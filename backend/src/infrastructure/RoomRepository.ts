import { IRoomRepository } from '../domain/interfaces/IRoomRepository';
import { Room } from '../domain/entities/Room';
import { Worker } from 'mediasoup/node/lib/types';
import config from '../../config';

export class RoomRepository implements IRoomRepository {
    private rooms = new Map<string, Room>();
    private worker: Worker;

    constructor(worker: Worker) {
        this.worker = worker;
    }

    async createRoom(roomId: string): Promise<Room> {
        const router = await this.worker.createRouter({ mediaCodecs: config.mediasoup.mediaCodecs });
        const room: Room = {
            id: roomId,
            router,
            transports: new Map(),
            producers: new Map(),
            consumers: new Map(),
        };
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    deleteRoom(roomId: string): void {
        this.rooms.delete(roomId);
    }
}
