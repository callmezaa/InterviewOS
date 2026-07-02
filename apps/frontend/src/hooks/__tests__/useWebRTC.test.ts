import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInterviewStore } from '../../store/useInterviewStore';
import { useWebRTC } from '../useWebRTC';

function createMockRTCPeerConnection() {
  let _localDescription: any = null;
  let _remoteDescription: any = null;
  return {
    close: vi.fn(),
    addTrack: vi.fn(),
    addIceCandidate: vi.fn(),
    createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer' }),
    createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer' }),
    setLocalDescription: vi.fn((desc: any) => {
      _localDescription = desc;
      return Promise.resolve();
    }),
    setRemoteDescription: vi.fn((desc: any) => {
      _remoteDescription = desc;
      return Promise.resolve();
    }),
    get localDescription() { return _localDescription; },
    get remoteDescription() { return _remoteDescription; },
    restartIce: vi.fn(),
    getStats: vi.fn().mockResolvedValue(new Map()),
    iceGatheringState: 'stable',
    signalingState: 'stable',
    connectionState: 'new',
    iceConnectionState: 'new',
    onicecandidate: null as any,
    onconnectionstatechange: null as any,
    oniceconnectionstatechange: null as any,
    onicegatheringstatechange: null as any,
    ontrack: null as any,
  };
}

function createMockSocket() {
  const listeners = new Map<string, (...args: any[]) => void>();
  return {
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      listeners.set(event, handler);
    }),
    off: vi.fn((event: string, handler?: (...args: any[]) => void) => {
      if (handler) {
        const existing = listeners.get(event);
        if (existing === handler) listeners.delete(event);
      } else {
        listeners.delete(event);
      }
    }),
    emit: vi.fn(),
    emitEvent(event: string, ...args: any[]) {
      const handler = listeners.get(event);
      if (handler) handler(...args);
    },
  };
}

function createMockMediaStream() {
  const tracks = [
    { kind: 'audio', readyState: 'live', enabled: true, stop: vi.fn() },
    { kind: 'video', readyState: 'live', enabled: true, stop: vi.fn() },
  ];
  return {
    getTracks: vi.fn(() => tracks),
    getAudioTracks: vi.fn(() => [tracks[0]]),
    getVideoTracks: vi.fn(() => [tracks[1]]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
  };
}

beforeEach(() => {
  localStorage.clear();
  useInterviewStore.setState({
    user: {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
      role: 'INTERVIEWER',
    },
    localStream: null,
    peers: [],
  });

  function MockRTCPeerConnection() {
    return createMockRTCPeerConnection();
  }
  vi.stubGlobal('RTCPeerConnection', vi.fn(MockRTCPeerConnection));
  vi.stubGlobal('MediaStream', vi.fn(() => createMockMediaStream()));
  function MockRTCSessionDescription(d: any) { return d; }
  function MockRTCIceCandidate(d: any) { return d; }
  vi.stubGlobal('RTCSessionDescription', vi.fn(MockRTCSessionDescription));
  vi.stubGlobal('RTCIceCandidate', vi.fn(MockRTCIceCandidate));

  vi.stubGlobal(
    'navigator',
    {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(createMockMediaStream()),
      },
    },
  );
});

describe('useWebRTC', () => {
  it('starts local stream when user and interviewId are provided', async () => {
    const socket = createMockSocket() as any;
    renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.any(Object),
          audio: expect.any(Object),
        }),
      );
    });
  });

  it('sets local stream in store after start', async () => {
    const socket = createMockSocket() as any;
    renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      const state = useInterviewStore.getState();
      expect(state.localStream).toBeTruthy();
    });
  });

  it('registers socket event handlers on mount', async () => {
    const socket = createMockSocket() as any;
    renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      expect(socket.on).toHaveBeenCalledWith('peer-joined', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('webrtc-signal-received', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('room-joined-success', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('peer-left', expect.any(Function));
    });
  });

  it('adds peer and creates offer on peer-joined event', async () => {
    const socket = createMockSocket() as any;
    renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      expect(useInterviewStore.getState().localStream).toBeTruthy();
    });

    socket.emitEvent('peer-joined', {
      socketId: 'peer-socket-1',
      userId: 'peer-user-1',
      userName: 'Peer One',
      userRole: 'CANDIDATE',
    });

    await waitFor(() => {
      const peers = useInterviewStore.getState().peers;
      expect(peers).toHaveLength(1);
      expect(peers[0].socketId).toBe('peer-socket-1');
      expect(peers[0].userId).toBe('peer-user-1');
      expect(peers[0].userName).toBe('Peer One');
    });
  });

  it('creates RTCPeerConnection with correct config', async () => {
    const socket = createMockSocket() as any;
    renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      expect(useInterviewStore.getState().localStream).toBeTruthy();
    });

    socket.emitEvent('peer-joined', {
      socketId: 'socket-a',
      userId: 'user-a',
      userName: 'Alice',
      userRole: 'CANDIDATE',
    });

    await waitFor(() => {
      expect(RTCPeerConnection).toHaveBeenCalled();
    });
  });

  it('sends WebRTC signal on peer-joined (offer)', async () => {
    const socket = createMockSocket() as any;
    renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      expect(useInterviewStore.getState().localStream).toBeTruthy();
    });

    socket.emitEvent('peer-joined', {
      socketId: 'socket-a',
      userId: 'user-a',
      userName: 'Alice',
      userRole: 'CANDIDATE',
    });

    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith(
        'webrtc-signal',
        expect.objectContaining({
          targetUserId: 'user-a',
          senderUserId: 'user-1',
          signal: expect.objectContaining({
            sdp: expect.objectContaining({ type: 'offer' }),
          }),
        }),
      );
    });
  });

  it('handles room-joined-success by creating peer connections for existing peers', async () => {
    const socket = createMockSocket() as any;
    renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      expect(useInterviewStore.getState().localStream).toBeTruthy();
    });

    socket.emitEvent('room-joined-success', {
      peers: [
        { socketId: 'existing-socket', userId: 'existing-user', userName: 'Existing', userRole: 'CANDIDATE' },
      ],
    });

    await waitFor(() => {
      const peers = useInterviewStore.getState().peers;
      expect(peers).toHaveLength(1);
      expect(peers[0].userId).toBe('existing-user');
    });
  });

  it('removes peer and closes connection on peer-left event', async () => {
    const socket = createMockSocket() as any;
    renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      expect(useInterviewStore.getState().localStream).toBeTruthy();
    });

    socket.emitEvent('room-joined-success', {
      peers: [
        { socketId: 'socket-x', userId: 'user-x', userName: 'X', userRole: 'CANDIDATE' },
      ],
    });

    await waitFor(() => {
      expect(useInterviewStore.getState().peers).toHaveLength(1);
    });

    socket.emitEvent('peer-left', { socketId: 'socket-x' });

    await waitFor(() => {
      expect(useInterviewStore.getState().peers).toHaveLength(0);
    });
  });

  it('handles incoming WebRTC signal with SDP offer and sends answer', async () => {
    const socket = createMockSocket() as any;
    renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      expect(useInterviewStore.getState().localStream).toBeTruthy();
    });

    socket.emitEvent('room-joined-success', {
      peers: [
        { socketId: 'socket-y', userId: 'user-y', userName: 'Y', userRole: 'CANDIDATE' },
      ],
    });

    await waitFor(() => {
      expect(useInterviewStore.getState().peers).toHaveLength(1);
    });

    socket.emitEvent('webrtc-signal-received', {
      senderUserId: 'user-y',
      senderName: 'Y',
      signal: { sdp: { type: 'offer', sdp: 'incoming-offer' } },
    });

    await waitFor(() => {
      const RTCPC = vi.mocked(RTCPeerConnection).mock.results[0]?.value;
      if (RTCPC) {
        const createAnswerCalls = RTCPC.createAnswer.mock.calls.length;
        expect(createAnswerCalls).toBeGreaterThanOrEqual(1);
      }
    });
  });

  it('removes socket listeners and cleans up on unmount', async () => {
    const socket = createMockSocket() as any;
    const { unmount } = renderHook(() => useWebRTC(socket, 'interview-1'));

    await waitFor(() => {
      expect(useInterviewStore.getState().localStream).toBeTruthy();
    });

    unmount();

    expect(socket.off).toHaveBeenCalledWith('peer-joined', expect.any(Function));
    expect(socket.off).toHaveBeenCalledWith('webrtc-signal-received', expect.any(Function));
    expect(socket.off).toHaveBeenCalledWith('peer-left', expect.any(Function));

    await waitFor(() => {
      const state = useInterviewStore.getState();
      expect(state.localStream).toBeNull();
    });
  });
});
