import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WebRtcService } from './webrtc.service';

@ApiTags('WebRTC')
@Controller('webrtc')
@UseGuards(JwtAuthGuard)
export class WebRtcController {
  constructor(private readonly webRtcService: WebRtcService) {}

  /**
   * GET /api/webrtc/ice-config
   *
   * Returns the ICE server list (STUN + TURN) to authenticated clients.
   * Serving this from the backend ensures TURN credentials are never
   * embedded in the client JavaScript bundle.
   */
  @Get('ice-config')
  getIceConfig() {
    return this.webRtcService.getIceConfig();
  }
}
