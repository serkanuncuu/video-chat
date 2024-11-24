import { IRoomRepository } from '../domain/interfaces/IRoomRepository';

export class ManageRoom {
    constructor(private roomRepository: IRoomRepository) {}

    getRoom(roomId: string) {
        return this.roomRepository.getRoom(roomId);
    }

    deleteRoom(roomId: string) {
        this.roomRepository.deleteRoom(roomId);
    }

    createRoom(roomId: string) {
        return this.roomRepository.createRoom(roomId);
    }
}
