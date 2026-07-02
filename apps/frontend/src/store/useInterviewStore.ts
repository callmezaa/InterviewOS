import { create } from 'zustand';

import type { BrandSettings } from '@interviewos/shared';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'INTERVIEWER' | 'CANDIDATE';
  plan?: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';
  avatarUrl?: string | null;
  twoFactorEnabled?: boolean;
  branding?: BrandSettings;
  isGuest?: boolean;
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface TranscriptItem {
  speakerName: string;
  text: string;
  timestamp: string;
}

export interface PeerConnectionState {
  socketId: string;
  userId: string;
  userName: string;
  userRole: 'INTERVIEWER' | 'CANDIDATE';
  stream?: MediaStream;
  audioLevel: number;
  audioMuted?: boolean;
  videoMuted?: boolean;
  isSpeaking?: boolean;
  ping?: number;
  packetLoss?: number;
  isTabSwitched?: boolean;
  isFocusLost?: boolean;
}

export interface InterviewDetails {
  id: string;
  title: string;
  description?: string;
  candidateEmail?: string;
  candidateToken?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledTime: string;
  codeContent: string;
  language: string;
  transcript: TranscriptItem[];
  codeHistory?: { codeContent: string; language: string; timestamp: string }[];
  feedback?: {
    score: number;
    technicalRating: number;
    communicationRating: number;
    summary: string;
    detailedReview: string;
  };
  recordingUrl?: string | null;
  recordingSize?: number | null;
  recordingDuration?: number | null;
  recordingMimeType?: string | null;
  recurringPatternId?: string | null;
  instanceNumber?: number | null;
}

export interface DevicePreferences {
  cameraId?: string;
  microphoneId?: string;
  speakerId?: string;
}

interface InterviewState {
  // Authentication
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  logout: () => void;

  // Active Interview Room State
  activeInterview: InterviewDetails | null;
  setActiveInterview: (details: InterviewDetails) => void;
  updateInterviewCode: (code: string) => void;
  updateInterviewLanguage: (lang: string) => void;
  
  // Realtime Connection & Signaling
  peers: PeerConnectionState[];
  setPeers: (peers: PeerConnectionState[]) => void;
  addPeer: (peer: PeerConnectionState) => void;
  updatePeerStream: (socketId: string, stream: MediaStream) => void;
  updatePeerStreamByUserId: (userId: string, stream: MediaStream) => void;
  updatePeerAudioLevel: (userId: string, level: number) => void;
  updatePeerMuteState: (socketId: string, audioMuted: boolean, videoMuted: boolean) => void;
  updatePeerSpeaking: (userId: string, isSpeaking: boolean) => void;
  removePeer: (socketId: string) => void;
  clearPeers: () => void;

  // Local Media Streams & Status toggles
  localStream: MediaStream | null;
  setLocalStream: (stream: MediaStream | null) => void;
  screenStream: MediaStream | null;
  setScreenStream: (stream: MediaStream | null) => void;
  isLocalAudioMuted: boolean;
  setLocalAudioMuted: (muted: boolean) => void;
  isLocalVideoMuted: boolean;
  setLocalVideoMuted: (muted: boolean) => void;
  isLocalSpeaking: boolean;
  setLocalSpeaking: (speaking: boolean) => void;

  // Recording State
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;

  // Chat Room messages
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  // Live Transcript list
  transcriptItems: TranscriptItem[];
  addTranscriptItem: (item: TranscriptItem) => void;
  setTranscriptItems: (items: TranscriptItem[]) => void;

  // WebRTC Connection Phase
  webrtcPhase: 'idle' | 'requesting-media' | 'media-ready' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  setWebrtcPhase: (phase: InterviewState['webrtcPhase']) => void;

  // Device preferences (from pre-interview device check)
  devicePreferences: DevicePreferences | null;
  setDevicePreferences: (prefs: DevicePreferences | null) => void;

  // Proctoring logs
  proctoringLogs: {
    id: string;
    userId: string;
    userName: string;
    eventType: 'tab-switch' | 'focus-lost' | 'focus-gained';
    timestamp: string;
    reason?: string;
  }[];
  addProctoringLog: (log: { userId: string; userName: string; eventType: 'tab-switch' | 'focus-lost' | 'focus-gained'; timestamp?: string; reason?: string }) => void;
  clearProctoringLogs: () => void;
  setProctoringLogs: (logs: { id: string; userId: string; userName: string; eventType: 'tab-switch' | 'focus-lost' | 'focus-gained'; timestamp: string; reason?: string }[]) => void;
  updatePeerProctoringState: (userId: string, eventType: 'tab-switch' | 'focus-lost' | 'focus-gained') => void;
  updateProctoringLogReason: (logId: string, reason: string) => void;
}

export const useInterviewStore = create<InterviewState>((set) => {
  let initialUser = null;

  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          initialUser = JSON.parse(savedUser);
        } catch (e) {
          console.error('Failed to parse initial user from localStorage', e);
        }
      }
    } catch {
      // localStorage unavailable (SSR, test environment, private browsing)
    }
  }

  return {
    user: initialUser,
    setUser: (user) => {
      if (typeof window !== 'undefined') {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }
      }
      set({ user });
    },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    set({
      user: null,
      activeInterview: null,
      peers: [],
      localStream: null,
      screenStream: null,
      isLocalAudioMuted: false,
      isLocalVideoMuted: false,
      isLocalSpeaking: false,
      webrtcPhase: 'idle',
      chatMessages: [],
      transcriptItems: []
    });
  },

  activeInterview: null,
  setActiveInterview: (details) => set({ activeInterview: details, transcriptItems: details.transcript || [] }),
  updateInterviewCode: (codeContent) => set((state) => ({
    activeInterview: state.activeInterview ? { ...state.activeInterview, codeContent } : null
  })),
  updateInterviewLanguage: (language) => set((state) => ({
    activeInterview: state.activeInterview ? { ...state.activeInterview, language } : null
  })),

  peers: [],
  setPeers: (peers) => set({ peers }),
  addPeer: (peer) => set((state) => {
    // Guard by socketId OR userId to prevent duplicate peer entries
    if (state.peers.some((p) => p.socketId === peer.socketId || p.userId === peer.userId)) return state;
    return { peers: [...state.peers, peer] };
  }),
  updatePeerStream: (socketId, stream) => set((state) => ({
    peers: state.peers.map((p) => (p.socketId === socketId ? { ...p, stream } : p))
  })),
  updatePeerStreamByUserId: (userId, stream) => set((state) => ({
    peers: state.peers.map((p) => (p.userId === userId ? { ...p, stream } : p))
  })),
  updatePeerAudioLevel: (userId, level) => set((state) => ({
    peers: state.peers.map((p) => (p.userId === userId ? { ...p, audioLevel: level } : p))
  })),
  updatePeerMuteState: (socketId, audioMuted, videoMuted) => set((state) => ({
    peers: state.peers.map((p) => (p.socketId === socketId ? { ...p, audioMuted, videoMuted } : p))
  })),
  updatePeerSpeaking: (userId, isSpeaking) => set((state) => ({
    peers: state.peers.map((p) => (p.userId === userId ? { ...p, isSpeaking } : p))
  })),
  removePeer: (socketId) => set((state) => ({
    peers: state.peers.filter((p) => p.socketId !== socketId)
  })),
  clearPeers: () => set({ peers: [] }),

  localStream: null,
  setLocalStream: (localStream) => set({ localStream }),
  screenStream: null,
  setScreenStream: (screenStream) => set({ screenStream }),

  isLocalAudioMuted: false,
  setLocalAudioMuted: (isLocalAudioMuted) => set({ isLocalAudioMuted }),
  isLocalVideoMuted: false,
  setLocalVideoMuted: (isLocalVideoMuted) => set({ isLocalVideoMuted }),
  isLocalSpeaking: false,
  setLocalSpeaking: (isLocalSpeaking) => set({ isLocalSpeaking }),

  isRecording: false,
  setIsRecording: (isRecording) => set({ isRecording }),

  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),

  transcriptItems: [],
  addTranscriptItem: (item) => set((state) => ({ transcriptItems: [...state.transcriptItems, item] })),
  setTranscriptItems: (transcriptItems) => set({ transcriptItems }),

  webrtcPhase: 'idle',
  setWebrtcPhase: (webrtcPhase) => set({ webrtcPhase }),

  devicePreferences: null,
  setDevicePreferences: (devicePreferences) => set({ devicePreferences }),

  proctoringLogs: [],
  addProctoringLog: (log) => set((state) => ({
    proctoringLogs: [
      ...state.proctoringLogs,
      {
        id: Math.random().toString(36).substring(2, 9),
        userId: log.userId,
        userName: log.userName,
        eventType: log.eventType,
        timestamp: log.timestamp || new Date().toISOString()
      }
    ]
  })),
  clearProctoringLogs: () => set({ proctoringLogs: [] }),
  setProctoringLogs: (proctoringLogs) => set({ proctoringLogs }),
  updatePeerProctoringState: (userId, eventType) => set((state) => ({
    peers: state.peers.map((p) => {
      if (p.userId === userId) {
        return {
          ...p,
          isTabSwitched: eventType === 'tab-switch' ? true : (eventType === 'focus-gained' ? false : p.isTabSwitched),
          isFocusLost: (eventType === 'focus-lost' || eventType === 'tab-switch') ? true : (eventType === 'focus-gained' ? false : p.isFocusLost)
        };
      }
      return p;
    })
  })),
  updateProctoringLogReason: (logId, reason) => set((state) => ({
    proctoringLogs: state.proctoringLogs.map((log) =>
      log.id === logId ? { ...log, reason } : log
    )
  })),
  };
});
