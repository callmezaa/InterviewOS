import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

@Injectable()
export class WebRtcService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns the full ICE server configuration for WebRTC peers.
   * Priority: STUN (Google) → TURN (Open Relay free) → TURN (custom env)
   *
   * TURN credentials are served from the backend so they are never
   * embedded in the client bundle.
   */
  getIceConfig(): { iceServers: IceServer[] } {
    const servers: IceServer[] = [
      // ── STUN servers (multiple for redundancy) ──────────────────────────
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },

      // ── TURN via Open Relay (free, no signup required) ──────────────────
      // Port 80: traverses most firewalls (same port as HTTP)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      // Port 443: traverses strict firewalls that block non-HTTPS
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      // TURNS (TURN over TLS) on 443: encrypted relay, bypasses deep packet inspection
      {
        urls: 'turns:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      // UDP port 443 fallback
      {
        urls: 'turn:openrelay.metered.ca:443?transport=udp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ];

    // ── Optional: inject premium/custom TURN credentials from environment ──
    const turnUrl = this.configService.get<string>('TURN_URL');
    const turnUser = this.configService.get<string>('TURN_USERNAME');
    const turnCred = this.configService.get<string>('TURN_CREDENTIAL');

    if (turnUrl && turnUser && turnCred) {
      servers.push({
        urls: turnUrl,
        username: turnUser,
        credential: turnCred,
      });
    }

    return { iceServers: servers };
  }
}
