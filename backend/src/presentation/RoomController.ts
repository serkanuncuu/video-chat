import { Socket } from 'socket.io';
import { ManageRoom } from '../use-cases/ManageRoom';
import config from '../../config';

export class RoomController {
    private manageRoom: ManageRoom;

    constructor(manageRoom: ManageRoom) {
        this.manageRoom = manageRoom;
    }

    async handleConnection(socket: Socket) {
        const { roomId } = socket.handshake.query as { roomId: string };
        let room = this.manageRoom.getRoom(roomId);

        if (!room) {
            room = await this.manageRoom.createRoom(roomId);
        }

        socket.on('mediasoup-request', async (request, cb) => {
            try {
              switch (request.method) {
                case 'join':
                  cb(null, { message: `Joined room ${roomId}` });
                  break;

                case 'existingProducers':
                  // Mevcut producers bilgisini yeni katılımcıya gönder...
                  const producers = Array.from(room!.producers.values()).map(producer => ({
                      id: producer.id,
                      kind: producer.kind
                  }));

                  cb(null, producers);
                  break;
          
                case 'queryRtpCapabilities':
                  cb(null, room!.router.rtpCapabilities);
                  break;
          
                case 'createTransport':
                  const transport = await room!.router.createWebRtcTransport({
                    listenIps: [{ ip: config.mediasoup.rtcAnnouncedIPv4 }],
                    enableUdp: true,
                    enableTcp: true,
                    preferUdp: true,
                  });
                  room!.transports.set(transport.id, transport);
          
                  cb(null, {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                  });
                  break;
          
                case 'connectTransport':
                  const { transportId, dtlsParameters } = request;
                  const transportToConnect = room!.transports.get(transportId);
                  if (transportToConnect) {
                    await transportToConnect.connect({ dtlsParameters });
                  }
                  cb();
                  break;
          
                case 'produce':
                  const { kind, rtpParameters } = request;
                  const producerTransport = room!.transports.get(request.transportId);
                  if (producerTransport) {
                    const producer = await producerTransport.produce({ kind, rtpParameters });
                    room!.producers.set(producer.id, producer);
                    cb(null, { id: producer.id });
          
                    // Yeni bir producer olduğunda tüm istemcilere bildirim gönder...
                    socket.broadcast.emit('newProducer', { producerId: producer.id });
                  }
                  break;
          
                case 'consume':
                  const { producerId } = request;
                  const consumerTransport = room!.transports.get(request.transportId);
                  if (consumerTransport) {
                    const consumer = await consumerTransport.consume({
                      producerId,
                      rtpCapabilities: request.rtpCapabilities,
                    });
                    room!.consumers.set(consumer.id, consumer);
                    cb(null, {
                      id: consumer.id,
                      producerId: producerId,
                      kind: consumer.kind,
                      rtpParameters: consumer.rtpParameters,
                    });
                  }
                  break;
          
                default:
                  cb('Unknown request');
              }
            } catch (error: any) {
              cb(error.toString());
            }
          });          

        socket.on('disconnect', () => {
            this.manageRoom.deleteRoom(roomId);
        });
    }
}
