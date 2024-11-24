import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { MediasoupHandler } from './src/infrastructure/MediasoupHandler';
import { RoomRepository } from './src/infrastructure/RoomRepository';
import { ManageRoom } from './src/use-cases/ManageRoom';
import { RoomController } from './src/presentation/RoomController';
import config from './config';


const port = config.server.port;
const host = config.server.host;
const app = http.createServer();
const io = new SocketIOServer(app, {
    cors: {
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
      },
});

(async () => {
    const worker = await MediasoupHandler.createWorker();
    const roomRepository = new RoomRepository(worker);
    const manageRoom = new ManageRoom(roomRepository);
    const roomController = new RoomController(manageRoom);

    io.on('connection', (socket) => {
        roomController.handleConnection(socket)
    });
    
    app.listen(port, host, () =>  console.log(`Socket.IO server running at http://${host}:${port}/`));
})();
