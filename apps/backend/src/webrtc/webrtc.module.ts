import { Module } from '@nestjs/common';
import { WebRtcService } from './webrtc.service';
import { WebRtcController } from './webrtc.controller';

@Module({
  controllers: [WebRtcController],
  providers: [WebRtcService],
  exports: [WebRtcService],
})
export class WebRtcModule {}
