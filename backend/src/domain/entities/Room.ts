import { Router, WebRtcTransport, Producer, Consumer } from 'mediasoup/node/lib/types';

export interface Room {
    id: string;
    router: Router;
    transports: Map<string, WebRtcTransport>;
    producers: Map<string, Producer>;
    consumers: Map<string, Consumer>;
}
