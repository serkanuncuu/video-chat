import { Room } from '../entities/Room';

export interface IRoomRepository {
    createRoom(roomId: string): Promise<Room>;
    getRoom(roomId: string): Room | undefined;
    deleteRoom(roomId: string): void;
}
