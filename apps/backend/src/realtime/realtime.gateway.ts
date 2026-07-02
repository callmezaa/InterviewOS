import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

interface JoinRoomDto {
  interviewId: string;
  userId: string;
  userName: string;
  userRole: 'INTERVIEWER' | 'CANDIDATE';
}

interface CodeChangeDto {
  interviewId: string;
  codeContent: string;
}

interface LanguageChangeDto {
  interviewId: string;
  language: string;
}

interface SignalDto {
  targetUserId: string;
  senderUserId: string;
  senderName: string;
  signal: Record<string, unknown>;
}

interface ChatDto {
  interviewId: string;
  senderId: string;
  senderName: string;
  text: string;
}

interface TranscriptDto {
  interviewId: string;
  speakerName: string;
  text: string;
  timestamp: string;
}

@WebSocketGateway()
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  // Map user ID to Socket ID
  private activeUsers = new Map<string, string>();
  // Map Socket ID to Room ID
  private socketRooms = new Map<string, string>();
  // Map Socket ID to User Details
  private socketUserDetails = new Map<
    string,
    { userId: string; userName: string; userRole: string }
  >();
  // Map interview ID to last history save timestamp
  private lastHistoryTimes = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token || this.extractTokenFromCookie(client);
    if (!token) {
      this.logger.warn(
        `Client connection rejected: No auth token provided (${client.id})`,
      );
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      this.logger.log(
        `Client connected: ${client.id} (User: ${payload.email})`,
      );
    } catch {
      this.logger.warn(
        `Client connection rejected: Invalid auth token (${client.id})`,
      );
      client.disconnect(true);
    }
  }

  private extractTokenFromCookie(client: Socket): string | null {
    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [key, ...vals] = c.trim().split('=');
        return [key, vals.join('=')];
      }),
    );
    return cookies['token'] ?? null;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const details = this.socketUserDetails.get(client.id);
    const roomId = this.socketRooms.get(client.id);

    if (details && roomId) {
      this.server.to(roomId).emit('peer-left', {
        userId: details.userId,
        userName: details.userName,
        socketId: client.id,
      });

      // Clear records
      this.activeUsers.delete(details.userId);
      this.socketRooms.delete(client.id);
      this.socketUserDetails.delete(client.id);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ) {
    const { interviewId, userId, userName, userRole } = data;
    void client.join(interviewId);
    this.socketRooms.set(client.id, interviewId);
    this.socketUserDetails.set(client.id, { userId, userName, userRole });
    this.activeUsers.set(userId, client.id);
    this.socketRooms.set(client.id, interviewId);
    this.socketUserDetails.set(client.id, { userId, userName, userRole });

    // Tell everyone in the room about the new peer
    client.to(interviewId).emit('peer-joined', {
      userId,
      userName,
      userRole,
      socketId: client.id,
    });

    // Send currently connected peers list to the joining user
    const roomClients = this.server.sockets.adapter.rooms.get(interviewId);
    const peers: Array<{
      userId: string;
      userName: string;
      userRole: string;
      socketId: string;
    }> = [];

    if (roomClients) {
      for (const clientId of roomClients) {
        if (clientId !== client.id) {
          const peerDetails = this.socketUserDetails.get(clientId);
          if (peerDetails) {
            peers.push({
              userId: peerDetails.userId,
              userName: peerDetails.userName,
              userRole: peerDetails.userRole,
              socketId: clientId,
            });
          }
        }
      }
    }

    // Get current interview state (code, language, whiteboard, and history)
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      select: {
        codeContent: true,
        language: true,
        whiteboardShapes: true,
        codeHistory: true,
      },
    });

    client.emit('room-joined-success', {
      peers,
      codeContent: interview?.codeContent || '',
      language: interview?.language || 'javascript',
      whiteboardShapes: interview?.whiteboardShapes || null,
      codeHistory: interview?.codeHistory || null,
    });
  }

  @SubscribeMessage('webrtc-signal')
  handleWebRtcSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalDto,
  ) {
    const targetSocketId = this.activeUsers.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('webrtc-signal-received', {
        senderUserId: data.senderUserId,
        senderName: data.senderName,
        signal: data.signal,
      });
    }
  }

  @SubscribeMessage('code-change')
  async handleCodeChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CodeChangeDto,
  ) {
    const { interviewId, codeContent } = data;

    // Broadcast changes to others in the room
    client.to(interviewId).emit('code-updated', codeContent);

    // Save changes to database
    try {
      await this.prisma.interview.update({
        where: { id: interviewId },
        data: { codeContent },
      });

      // Throttle adding checkpoints to history (once every 5 seconds)
      const now = Date.now();
      const lastSave = this.lastHistoryTimes.get(interviewId) || 0;
      if (now - lastSave > 5000) {
        this.lastHistoryTimes.set(interviewId, now);

        const interview = await this.prisma.interview.findUnique({
          where: { id: interviewId },
          select: { codeHistory: true, language: true },
        });

        const history = Array.isArray(interview?.codeHistory)
          ? (interview.codeHistory as Array<{
              codeContent: string;
              language: string;
              timestamp: string;
            }>)
          : [];
        if (history.length < 500) {
          // Limit to 500 checkpoints per interview to prevent DB bloat
          history.push({
            codeContent,
            language: interview?.language || 'javascript',
            timestamp: new Date().toISOString(),
          });
          await this.prisma.interview.update({
            where: { id: interviewId },
            data: { codeHistory: history },
          });
        }
      }
    } catch (e) {
      this.logger.error(`Error saving code update or history: ${e}`);
    }
  }

  @SubscribeMessage('code-language-change')
  async handleLanguageChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LanguageChangeDto,
  ) {
    const { interviewId, language } = data;

    // Broadcast changes to others in the room
    client.to(interviewId).emit('code-language-updated', language);

    // Save changes to database
    try {
      await this.prisma.interview.update({
        where: { id: interviewId },
        data: { language },
      });
    } catch (e) {
      this.logger.error(`Error saving language update: ${e}`);
    }
  }

  @SubscribeMessage('chat-message')
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatDto,
  ) {
    // Broadcast message to everyone in the room
    this.server.to(data.interviewId).emit('chat-message-received', {
      senderId: data.senderId,
      senderName: data.senderName,
      text: data.text,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('audio-level')
  handleAudioLevel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { interviewId: string; userId: string; level: number },
  ) {
    // Broadcast active speaking level to update waveforms
    client.to(data.interviewId).emit('audio-level-updated', {
      userId: data.userId,
      level: data.level,
    });
  }

  @SubscribeMessage('transcript-append')
  async handleTranscriptAppend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TranscriptDto,
  ) {
    const { interviewId, speakerName, text, timestamp } = data;

    // Broadcast newly appended segment to room
    this.server.to(interviewId).emit('transcript-updated', {
      speakerName,
      text,
      timestamp,
    });

    try {
      // Append segment to the existing interview transcript
      const interview = await this.prisma.interview.findUnique({
        where: { id: interviewId },
        select: { transcript: true },
      });

      let currentTranscript: Array<{
        speakerName: string;
        text: string;
        timestamp: string;
      }> = [];
      if (interview?.transcript && Array.isArray(interview.transcript)) {
        currentTranscript = interview.transcript as Array<{
          speakerName: string;
          text: string;
          timestamp: string;
        }>;
      }

      currentTranscript.push({ speakerName, text, timestamp });

      await this.prisma.interview.update({
        where: { id: interviewId },
        data: { transcript: currentTranscript },
      });
    } catch (e) {
      this.logger.error(`Error appending transcript: ${e}`);
    }
  }

  @SubscribeMessage('media-state-change')
  handleMediaStateChange(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    data: {
      interviewId: string;
      userId: string;
      audioMuted: boolean;
      videoMuted: boolean;
    },
  ) {
    _client.to(data.interviewId).emit('media-state-updated', {
      userId: data.userId,
      audioMuted: data.audioMuted,
      videoMuted: data.videoMuted,
    });
  }

  @SubscribeMessage('whiteboard-draw')
  async handleWhiteboardDraw(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { interviewId: string; shapes: Record<string, unknown> },
  ) {
    const { interviewId, shapes } = data;
    client.to(interviewId).emit('whiteboard-shapes-updated', shapes);
    try {
      await this.prisma.interview.update({
        where: { id: interviewId },
        data: { whiteboardShapes: shapes as Prisma.InputJsonValue },
      });
    } catch (e) {
      this.logger.error(`Error saving whiteboard shapes: ${e}`);
    }
  }

  @SubscribeMessage('whiteboard-clear')
  async handleWhiteboardClear(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { interviewId: string },
  ) {
    const { interviewId } = data;
    client.to(interviewId).emit('whiteboard-cleared');
    try {
      await this.prisma.interview.update({
        where: { id: interviewId },
        data: { whiteboardShapes: Prisma.JsonNull },
      });
    } catch (e) {
      this.logger.error(`Error clearing whiteboard shapes: ${e}`);
    }
  }

  @SubscribeMessage('whiteboard-cursor')
  handleWhiteboardCursor(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { interviewId: string; x: number; y: number; userName: string },
  ) {
    const { interviewId, x, y, userName } = data;
    const details = this.socketUserDetails.get(client.id);
    const userId = details?.userId || client.id;
    client.to(interviewId).emit('whiteboard-cursor-updated', {
      userId,
      userName,
      x,
      y,
    });
  }

  @SubscribeMessage('editor-cursor')
  handleEditorCursor(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      interviewId: string;
      lineNumber: number;
      column: number;
      userName: string;
      selection?: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
      };
    },
  ) {
    const { interviewId, lineNumber, column, userName, selection } = data;
    const details = this.socketUserDetails.get(client.id);
    const userId = details?.userId || client.id;
    client.to(interviewId).emit('editor-cursor-updated', {
      userId,
      userName,
      lineNumber,
      column,
      selection,
    });
  }

  @SubscribeMessage('proctoring-event')
  async handleProctoringEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      interviewId: string;
      userId: string;
      userName: string;
      eventType: 'tab-switch' | 'focus-lost' | 'focus-gained';
    },
  ) {
    const { interviewId, userId, userName, eventType } = data;
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[Proctoring] User ${userName} (${userId}) triggered event: ${eventType} in room ${interviewId}`,
    );

    client.to(interviewId).emit('proctoring-event-received', {
      userId,
      userName,
      eventType,
      timestamp,
    });

    try {
      const interview = await this.prisma.interview.findUnique({
        where: { id: interviewId },
        select: { proctoringLogs: true },
      });

      let currentLogs: Array<{
        id: string;
        userId: string;
        userName: string;
        eventType: string;
        timestamp: string;
      }> = [];
      if (interview && interview.proctoringLogs) {
        if (typeof interview.proctoringLogs === 'string') {
          currentLogs = JSON.parse(interview.proctoringLogs);
        } else if (Array.isArray(interview.proctoringLogs)) {
          currentLogs = interview.proctoringLogs as Array<{
            id: string;
            userId: string;
            userName: string;
            eventType: string;
            timestamp: string;
          }>;
        }
      }

      currentLogs.push({
        id: Math.random().toString(36).substring(2, 9),
        userId,
        userName,
        eventType,
        timestamp,
      });

      await this.prisma.interview.update({
        where: { id: interviewId },
        data: {
          proctoringLogs: currentLogs,
        },
      });
    } catch (e) {
      this.logger.error(`Error persisting proctoring event to database: ${e}`);
    }
  }

  @SubscribeMessage('proctoring-reason')
  async handleProctoringReason(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      interviewId: string;
      userId: string;
      userName: string;
      reason: string;
    },
  ) {
    const { interviewId, userId, userName, reason } = data;
    this.logger.log(
      `[Proctoring] Reason from ${userName} (${userId}): "${reason}"`,
    );

    try {
      const interview = await this.prisma.interview.findUnique({
        where: { id: interviewId },
        select: { proctoringLogs: true },
      });

      let currentLogs: Array<{
        id: string;
        userId: string;
        userName: string;
        eventType: string;
        timestamp: string;
        reason?: string;
      }> = [];
      if (interview && interview.proctoringLogs) {
        if (typeof interview.proctoringLogs === 'string') {
          currentLogs = JSON.parse(interview.proctoringLogs);
        } else if (Array.isArray(interview.proctoringLogs)) {
          currentLogs = interview.proctoringLogs as Array<{
            id: string;
            userId: string;
            userName: string;
            eventType: string;
            timestamp: string;
            reason?: string;
          }>;
        }
      }

      // Find the last event for this user and attach the reason
      let targetLogId: string | null = null;
      for (let i = currentLogs.length - 1; i >= 0; i--) {
        if (currentLogs[i].userId === userId) {
          currentLogs[i].reason = reason;
          targetLogId = currentLogs[i].id;
          break;
        }
      }

      if (targetLogId) {
        await this.prisma.interview.update({
          where: { id: interviewId },
          data: { proctoringLogs: currentLogs },
        });

        client.to(interviewId).emit('proctoring-reason-updated', {
          logId: targetLogId,
          userId,
          userName,
          reason,
        });
      }
    } catch (e) {
      this.logger.error(`Error persisting proctoring reason: ${e}`);
    }
  }

  @SubscribeMessage('recording-state')
  handleRecordingState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { interviewId: string; isRecording: boolean },
  ) {
    client.to(data.interviewId).emit('recording-state-updated', {
      isRecording: data.isRecording,
    });
  }
}
