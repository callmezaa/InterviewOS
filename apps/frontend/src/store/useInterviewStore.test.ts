import { describe, it, expect, beforeEach } from 'vitest';
import { useInterviewStore, type UserSession, type PeerConnectionState, type ChatMessage, type TranscriptItem, type InterviewDetails } from './useInterviewStore';

function createMockUser(overrides: Partial<UserSession> = {}): UserSession {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'INTERVIEWER',
    ...overrides,
  };
}

function createMockPeer(overrides: Partial<PeerConnectionState> = {}): PeerConnectionState {
  return {
    socketId: 'socket-1',
    userId: 'peer-1',
    userName: 'Peer One',
    userRole: 'CANDIDATE',
    audioLevel: 0,
    ...overrides,
  };
}

function createMockInterview(overrides: Partial<InterviewDetails> = {}): InterviewDetails {
  return {
    id: 'interview-1',
    title: 'Test Interview',
    status: 'SCHEDULED',
    scheduledTime: new Date().toISOString(),
    codeContent: '',
    language: 'javascript',
    transcript: [],
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  useInterviewStore.setState({
    user: null,
    activeInterview: null,
    peers: [],
    localStream: null,
    screenStream: null,
    isLocalAudioMuted: false,
    isLocalVideoMuted: false,
    isLocalSpeaking: false,
    isRecording: false,
    chatMessages: [],
    transcriptItems: [],
    proctoringLogs: [],
  });
});

describe('useInterviewStore', () => {
  describe('Auth Flow', () => {
    it('setUser stores user in state and localStorage', () => {
      const user = createMockUser();
      useInterviewStore.getState().setUser(user);

      const state = useInterviewStore.getState();
      expect(state.user).toEqual(user);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
    });

    it('setUser with null clears user and localStorage', () => {
      localStorage.setItem('user', JSON.stringify(createMockUser()));
      useInterviewStore.getState().setUser(null);

      expect(useInterviewStore.getState().user).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('logout clears all auth and resets interview/peer state', () => {
      useInterviewStore.getState().setUser(createMockUser());
      useInterviewStore.getState().setActiveInterview(createMockInterview());
      useInterviewStore.getState().addPeer(createMockPeer());
      useInterviewStore.getState().addChatMessage({ senderId: 'u1', senderName: 'A', text: 'hi', timestamp: new Date().toISOString() });

      useInterviewStore.getState().logout();

      const state = useInterviewStore.getState();
      expect(state.user).toBeNull();
      expect(state.activeInterview).toBeNull();
      expect(state.peers).toEqual([]);
      expect(state.chatMessages).toEqual([]);
      expect(state.transcriptItems).toEqual([]);
      expect(state.localStream).toBeNull();
      expect(state.screenStream).toBeNull();
    });

    it('logout clears user from localStorage', () => {
      localStorage.setItem('user', JSON.stringify(createMockUser()));

      useInterviewStore.getState().logout();

      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Interview Flow', () => {
    it('setActiveInterview updates active interview and transcriptItems', () => {
      const interview = createMockInterview({
        transcript: [{ speakerName: 'A', text: 'Hello', timestamp: '2025-01-01T00:00:00Z' }],
      });

      useInterviewStore.getState().setActiveInterview(interview);

      const state = useInterviewStore.getState();
      expect(state.activeInterview).toEqual(interview);
      expect(state.transcriptItems).toEqual(interview.transcript);
    });

    it('updateInterviewCode changes codeContent in active interview', () => {
      useInterviewStore.getState().setActiveInterview(createMockInterview());
      useInterviewStore.getState().updateInterviewCode('console.log("hello");');

      expect(useInterviewStore.getState().activeInterview?.codeContent).toBe('console.log("hello");');
    });

    it('updateInterviewCode does nothing when no active interview', () => {
      useInterviewStore.getState().updateInterviewCode('code');
      expect(useInterviewStore.getState().activeInterview).toBeNull();
    });

    it('updateInterviewLanguage changes language in active interview', () => {
      useInterviewStore.getState().setActiveInterview(createMockInterview());
      useInterviewStore.getState().updateInterviewLanguage('python');

      expect(useInterviewStore.getState().activeInterview?.language).toBe('python');
    });
  });

  describe('Peer Management (WebRTC)', () => {
    it('addPeer adds a peer to the list', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));

      expect(useInterviewStore.getState().peers).toHaveLength(1);
      expect(useInterviewStore.getState().peers[0].socketId).toBe('s1');
    });

    it('addPeer prevents duplicate by socketId', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u2' }));

      expect(useInterviewStore.getState().peers).toHaveLength(1);
    });

    it('addPeer prevents duplicate by userId', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's2', userId: 'u1' }));

      expect(useInterviewStore.getState().peers).toHaveLength(1);
    });

    it('addPeer allows unique peers', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's2', userId: 'u2' }));

      expect(useInterviewStore.getState().peers).toHaveLength(2);
    });

    it('removePeer removes peer by socketId', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's2', userId: 'u2' }));
      useInterviewStore.getState().removePeer('s1');

      expect(useInterviewStore.getState().peers).toHaveLength(1);
      expect(useInterviewStore.getState().peers[0].socketId).toBe('s2');
    });

    it('updatePeerAudioLevel updates audio level by userId', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().updatePeerAudioLevel('u1', 42);

      expect(useInterviewStore.getState().peers[0].audioLevel).toBe(42);
    });

    it('updatePeerMuteState updates mute state by socketId', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().updatePeerMuteState('s1', true, false);

      expect(useInterviewStore.getState().peers[0].audioMuted).toBe(true);
      expect(useInterviewStore.getState().peers[0].videoMuted).toBe(false);
    });

    it('updatePeerSpeaking sets isSpeaking by userId', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().updatePeerSpeaking('u1', true);

      expect(useInterviewStore.getState().peers[0].isSpeaking).toBe(true);
    });

    it('updatePeerStream updates stream by socketId', () => {
      const stream = {} as MediaStream;
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().updatePeerStream('s1', stream);

      expect(useInterviewStore.getState().peers[0].stream).toBe(stream);
    });

    it('updatePeerStreamByUserId updates stream by userId', () => {
      const stream = {} as MediaStream;
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().updatePeerStreamByUserId('u1', stream);

      expect(useInterviewStore.getState().peers[0].stream).toBe(stream);
    });

    it('clearPeers empties the peer list', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's2', userId: 'u2' }));
      useInterviewStore.getState().clearPeers();

      expect(useInterviewStore.getState().peers).toEqual([]);
    });

    it('setPeers replaces the entire peer list', () => {
      const newPeers = [
        createMockPeer({ socketId: 's3', userId: 'u3' }),
      ];
      useInterviewStore.getState().setPeers(newPeers);

      expect(useInterviewStore.getState().peers).toEqual(newPeers);
    });
  });

  describe('Chat', () => {
    it('addChatMessage appends a message', () => {
      const msg: ChatMessage = { senderId: 'u1', senderName: 'Alice', text: 'Hello', timestamp: '2025-01-01T00:00:00Z' };
      useInterviewStore.getState().addChatMessage(msg);

      expect(useInterviewStore.getState().chatMessages).toHaveLength(1);
      expect(useInterviewStore.getState().chatMessages[0]).toEqual(msg);
    });

    it('clearChat empties messages', () => {
      useInterviewStore.getState().addChatMessage({ senderId: 'u1', senderName: 'A', text: 'hi', timestamp: '' });
      useInterviewStore.getState().clearChat();

      expect(useInterviewStore.getState().chatMessages).toEqual([]);
    });
  });

  describe('Transcript', () => {
    it('addTranscriptItem appends item', () => {
      const item: TranscriptItem = { speakerName: 'Alice', text: 'Hello', timestamp: '2025-01-01T00:00:00Z' };
      useInterviewStore.getState().addTranscriptItem(item);

      expect(useInterviewStore.getState().transcriptItems).toHaveLength(1);
      expect(useInterviewStore.getState().transcriptItems[0]).toEqual(item);
    });

    it('setTranscriptItems replaces items', () => {
      const items: TranscriptItem[] = [
        { speakerName: 'A', text: 'First', timestamp: 't1' },
        { speakerName: 'B', text: 'Second', timestamp: 't2' },
      ];
      useInterviewStore.getState().setTranscriptItems(items);

      expect(useInterviewStore.getState().transcriptItems).toEqual(items);
    });
  });

  describe('Proctoring', () => {
    it('addProctoringLog adds a log with generated id and timestamp', () => {
      useInterviewStore.getState().addProctoringLog({
        userId: 'u1',
        userName: 'Alice',
        eventType: 'tab-switch',
      });

      const logs = useInterviewStore.getState().proctoringLogs;
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('u1');
      expect(logs[0].userName).toBe('Alice');
      expect(logs[0].eventType).toBe('tab-switch');
      expect(logs[0].id).toBeDefined();
      expect(logs[0].timestamp).toBeDefined();
    });

    it('clearProctoringLogs empties all logs', () => {
      useInterviewStore.getState().addProctoringLog({ userId: 'u1', userName: 'A', eventType: 'focus-lost' });
      useInterviewStore.getState().clearProctoringLogs();

      expect(useInterviewStore.getState().proctoringLogs).toEqual([]);
    });

    it('setProctoringLogs replaces logs', () => {
      const logs = [
        { id: 'log-1', userId: 'u1', userName: 'A', eventType: 'tab-switch' as const, timestamp: 't1' },
      ];
      useInterviewStore.getState().setProctoringLogs(logs);

      expect(useInterviewStore.getState().proctoringLogs).toEqual(logs);
    });

    it('updatePeerProctoringState sets isTabSwitched on tab-switch', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1' }));
      useInterviewStore.getState().updatePeerProctoringState('u1', 'tab-switch');

      expect(useInterviewStore.getState().peers[0].isTabSwitched).toBe(true);
      expect(useInterviewStore.getState().peers[0].isFocusLost).toBe(true);
    });

    it('updatePeerProctoringState clears isFocusLost on focus-gained', () => {
      useInterviewStore.getState().addPeer(createMockPeer({ socketId: 's1', userId: 'u1', isFocusLost: true, isTabSwitched: true }));
      useInterviewStore.getState().updatePeerProctoringState('u1', 'focus-gained');

      expect(useInterviewStore.getState().peers[0].isFocusLost).toBe(false);
      expect(useInterviewStore.getState().peers[0].isTabSwitched).toBe(false);
    });

    it('updateProctoringLogReason attaches reason to log', () => {
      useInterviewStore.getState().addProctoringLog({ userId: 'u1', userName: 'A', eventType: 'tab-switch' });
      const logId = useInterviewStore.getState().proctoringLogs[0].id;

      useInterviewStore.getState().updateProctoringLogReason(logId, 'testing');

      expect(useInterviewStore.getState().proctoringLogs[0].reason).toBe('testing');
    });
  });

  describe('Media & Recording', () => {
    it('setLocalStream stores the stream', () => {
      const stream = {} as MediaStream;
      useInterviewStore.getState().setLocalStream(stream);

      expect(useInterviewStore.getState().localStream).toBe(stream);
    });

    it('setLocalStream clears with null', () => {
      useInterviewStore.getState().setLocalStream({} as MediaStream);
      useInterviewStore.getState().setLocalStream(null);

      expect(useInterviewStore.getState().localStream).toBeNull();
    });

    it('setScreenStream stores the screen stream', () => {
      const stream = {} as MediaStream;
      useInterviewStore.getState().setScreenStream(stream);

      expect(useInterviewStore.getState().screenStream).toBe(stream);
    });

    it('setIsRecording toggles recording state', () => {
      useInterviewStore.getState().setIsRecording(true);
      expect(useInterviewStore.getState().isRecording).toBe(true);

      useInterviewStore.getState().setIsRecording(false);
      expect(useInterviewStore.getState().isRecording).toBe(false);
    });
  });
});
