import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useInterviewStore } from '../store/useInterviewStore';
import { SOCKET_URL } from '../lib/config';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export const useSocket = (interviewId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const {
    user,
    updateInterviewCode,
    updateInterviewLanguage,
    addChatMessage,
    addTranscriptItem,
    updatePeerAudioLevel,
    removePeer,
  } = useInterviewStore();

  useEffect(() => {
    if (!interviewId || !user) return;

    const cookieToken = typeof document !== 'undefined'
      ? document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1')
      : null;

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token: cookieToken },
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
    });

    socketInstance.on('connect_error', (err) => {
      // ponytail: suppress when backend is not running — expected in dev/mock mode
      console.warn('[Socket] Connection error:', err.message);
      setConnectionStatus('disconnected');
    });

    socketInstance.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    socketInstance.on('reconnect', () => {
      setConnectionStatus('connected');
    });

    socketInstance.on('code-updated', (content: string) => {
      updateInterviewCode(content);
    });

    socketInstance.on('code-language-updated', (lang: string) => {
      updateInterviewLanguage(lang);
    });

    socketInstance.on('chat-message-received', (msg: any) => {
      addChatMessage({
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.text,
        timestamp: msg.timestamp,
      });
    });

    socketInstance.on('audio-level-updated', (data: { userId: string; level: number }) => {
      updatePeerAudioLevel(data.userId, data.level);
      const isSpeaking = data.level > 15;
      useInterviewStore.getState().updatePeerSpeaking(data.userId, isSpeaking);
    });

    socketInstance.on('media-state-updated', (data: { userId: string; audioMuted: boolean; videoMuted: boolean }) => {
      const peers = useInterviewStore.getState().peers;
      const peer = peers.find((p) => p.userId === data.userId);
      if (peer) {
        useInterviewStore.getState().updatePeerMuteState(peer.socketId, data.audioMuted, data.videoMuted);
      }
    });

    socketInstance.on('transcript-updated', (item: any) => {
      addTranscriptItem({
        speakerName: item.speakerName,
        text: item.text,
        timestamp: item.timestamp,
      });
    });

    socketInstance.on('peer-left', (data: { userId: string; userName: string; socketId: string }) => {
      removePeer(data.socketId);
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setConnectionStatus('disconnected');
    };
  }, [interviewId, user]);

  return { socket, connectionStatus };
};
