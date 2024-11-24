import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import { Transport, RtpCapabilities, DtlsParameters } from 'mediasoup-client/lib/types';

interface RoomProps {
  roomId: string;
  userId: string;
}

const SERVER_URL = 'http://127.0.0.1:3030';

const Room: React.FC<RoomProps> = ({ roomId, userId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [, setSendTransport] = useState<Transport | null>(null);
  const [recvTransport, setRecvTransport] = useState<Transport | null>(null);
  const [rtpCapabilities, setRtpCapabilities] = useState<RtpCapabilities | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      query: { roomId, peerName: userId },
    });
    setSocket(newSocket);

    newSocket.emit('mediasoup-request', { method: 'join' }, (err: any) => {
      if (err) {
        console.error('Join Error:', err);
        return;
      }
      newSocket.emit('mediasoup-request', { method: 'queryRtpCapabilities' }, (err: any, capabilities: RtpCapabilities) => {
        if (err) {
          console.error('RTP Capabilities Error:', err);
          return;
        }
        setRtpCapabilities(capabilities);
      });
    });

    return () => {
      newSocket.close();
    };
  }, [roomId, userId]);

  useEffect(() => {
    if (!socket || !recvTransport) return;
    socket.emit('mediasoup-request', {method: 'existingProducers'}, async (err: any, producers: any) => {
      if (err) {
        console.error('Join Error:', err);
        return;
      }
      for (const producer of producers) {
        await consume(producer.id);
      }
    });
    socket.on('newProducer', async ({ producerId }: { producerId: string }) => {
      console.log('New producer detected:', producerId);
      await consume(producerId);
    });
  }, [recvTransport, socket])

  useEffect(() => {
    if (!rtpCapabilities) return;

    const initializeDevice = async () => {
      try {
        const newDevice = new Device();
        await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
        setDevice(newDevice);
      } catch (error) {
        console.error("Device initialization error:", error);
      }
    };
    initializeDevice();
  }, [rtpCapabilities]);

  useEffect(() => {
    if (device && socket) {
      const setupRecvTransportAndListener = async () => {
        const transport = await createRecvTransport();
        if (transport) {
          console.log('Recv Transport created: ', transport);
          setRecvTransport(transport);
        } else {
          console.error("Recv Transport couldn't be created.");
        }
      };
      setupRecvTransportAndListener();
    }
  }, [device, socket]);

  const consume = async (producerId: string) => {
    if (!recvTransport || !device || !socket) {
      console.error('consume: recvTransport, device, or socket is not ready');
      return;
    }
  
    socket.emit('mediasoup-request', { method: 'consume', transportId: recvTransport.id, producerId, rtpCapabilities: device.rtpCapabilities }, async (err: any, { id, kind, rtpParameters }: any) => {
      if (err) {
        console.error('Consume Error:', err);
        return;
      }
  
      const consumer = await recvTransport.consume({ id, producerId, kind, rtpParameters });
      const newStream = new MediaStream([consumer.track]);
      setRemoteStreams((prevStreams) => [...prevStreams, newStream]);
    });
  };

  const createRecvTransport = async (): Promise<Transport | null> => {
    if (!device || !socket) return null;

    return new Promise((resolve) => {
      socket.emit('mediasoup-request', { method: 'createTransport' }, (err: any, transportOptions: any) => {
        if (err) {
          console.error('Create Receive Transport Error:', err);
          resolve(null);
          return;
        }
        const newRecvTransport = device.createRecvTransport(transportOptions);

        newRecvTransport.on('connect', ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, callback: () => void, errback: (error: Error) => void) => {
          socket.emit('mediasoup-request', { method: 'connectTransport', transportId: newRecvTransport.id, dtlsParameters }, (err: any) => {
            if (err) {
              errback(err);
              return;
            }
            callback();
          });
        });

        resolve(newRecvTransport);
      });
    });
  };

  const startSendTransport = async () => {
    if (!device || !socket) return;
  
    socket.emit('mediasoup-request', { method: 'createTransport' }, async (err: any, transportOptions: any) => {
      if (err) {
        console.error('Create Send Transport Error:', err);
        return;
      }
  
      const newSendTransport = device.createSendTransport(transportOptions);
      setSendTransport(newSendTransport);
  
      newSendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
        socket.emit('mediasoup-request', { method: 'connectTransport', transportId: newSendTransport.id, dtlsParameters }, (err: any) => {
          if (err) {
            console.error("Error connecting transport:", err);
            errback(err);
          } else {
            callback();
          }
        });
      });
  
      newSendTransport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
        socket.emit('mediasoup-request', { method: 'produce', transportId: newSendTransport.id, kind, rtpParameters }, (err: any, response: any) => {
          if (err) {
            console.error(`Error producing ${kind} track:`, err);
            errback(err);
          } else {
            callback({ id: response.id });
          }
        });
      });
  
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
  
        if (videoTrack) {
          newSendTransport.produce({ track: videoTrack }).catch(err => {
            console.error("Error producing video track:", err);
          });
        }
  
        if (audioTrack) {
          newSendTransport.produce({ track: audioTrack }).catch(err => {
            console.error("Error producing audio track:", err);
          });
        }
  
        setLocalStream(stream);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    });
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2>Oda: {roomId}</h2>
      <button onClick={startSendTransport} className="p-2 bg-blue-500 text-white rounded">Kamera Ac</button>
      <h1 className="text-2xl font-bold mb-4">Ben: </h1>
      <div>
        {localStream && <video autoPlay muted ref={(video) => video && (video.srcObject = localStream)} />}
      </div>
      <h1 className="text-2xl font-bold mb-4">Digerleri: </h1>
      <div>
        {remoteStreams.map((stream, index) => (
          <video key={index} autoPlay ref={(video) => video && (video.srcObject = stream)} />
        ))}
      </div>
    </div>
  );
};

export default Room;
