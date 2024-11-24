import { Worker } from 'mediasoup/node/lib/types';
import * as mediasoup from 'mediasoup';
import config from '../../config';

export class MediasoupHandler {
    static async createWorker(): Promise<Worker> {
        return await mediasoup.createWorker({
            logLevel: config.mediasoup.logLevel,
            logTags: config.mediasoup.logTags,
            rtcMinPort: config.mediasoup.rtcMinPort,
            rtcMaxPort: config.mediasoup.rtcMaxPort,
        });
    }
}
