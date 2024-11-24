import { RtpCodecCapability, WorkerLogLevel, WorkerLogTag } from 'mediasoup/node/lib/types';

export default {
  server: {
    port: 3030,
    host: '127.0.0.1'
  },
  mediasoup: {
    logLevel: 'warn' as WorkerLogLevel, // WorkerLogLevel türüyle belirledik
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'] as WorkerLogTag[], // WorkerLogTag türünde tanımladık
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    mediaCodecs: [
      {
        kind: 'audio' as const,
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video' as const,
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {},
      },
    ] as RtpCodecCapability[],
    rtcIPv4: true,
    rtcIPv6: false,
    rtcAnnouncedIPv4: '127.0.0.1', // Sunucunun IP adresini burada belirtin
  },
};
