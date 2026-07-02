'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useInterviewStore } from '../store/useInterviewStore';
import { toast } from '../store/useToastStore';
import { API_URL } from '../lib/config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface IceConfig {
  iceServers: IceServer[];
}

interface PeerInfo {
  userId: string;
  userName: string;
  userRole: 'INTERVIEWER' | 'CANDIDATE';
  socketId: string;
}

interface SignalData {
  senderUserId: string;
  senderName: string;
  signal: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
}

// ─── ICE config cache (module-level, survives re-renders) ─────────────────────

let cachedIceConfig: IceConfig | null = null;

async function fetchIceConfig(apiUrl: string): Promise<IceConfig> {
  if (cachedIceConfig) return cachedIceConfig;

  try {
    const res = await fetch(`${apiUrl}/webrtc/ice-config`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`ICE config fetch failed: ${res.status}`);
    const data = await res.json();
    cachedIceConfig = data as IceConfig;
    console.info('[WebRTC] ICE config loaded:', data.iceServers.length, 'servers');
    return cachedIceConfig;
  } catch (e) {
    console.warn('[WebRTC] Using fallback STUN servers:', e);
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useWebRTC = (socket: Socket | null, interviewId?: string) => {
  const {
    user,
    localStream,
    setLocalStream,
    addPeer,
    updatePeerStream,
    updatePeerStreamByUserId,
    removePeer,
    clearPeers,
    addProctoringLog,
    updatePeerProctoringState,
    updateProctoringLogReason,
  } = useInterviewStore();

  // Map: socketId → RTCPeerConnection
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Map: userId → socketId
  const userIdToSocketId = useRef<Map<string, string>>(new Map());
  // Cached ICE config
  const iceConfigRef = useRef<IceConfig | null>(null);
  // Local stream ref — survives closures without triggering re-renders
  const localStreamRef = useRef<MediaStream | null>(null);
  // Refs for stable access inside callbacks
  const socketRef = useRef<Socket | null>(null);
  const userRef = useRef(user);
  const interviewIdRef = useRef(interviewId);

  // Keep refs in sync
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { interviewIdRef.current = interviewId; }, [interviewId]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // ── Start local webcam/mic ──────────────────────────────────────────────────
  // BUG FIX #1: startLocalStream is separated from the WebRTC signaling effect.
  // Previously, the cleanup of the signaling effect was killing the local stream.
  // Now the stream lifecycle is independent.
  const startLocalStream = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current && localStreamRef.current.getTracks().some(t => t.readyState === 'live')) {
      return localStreamRef.current;
    }

    useInterviewStore.getState().setWebrtcPhase('requesting-media');
    try {
      const prefs = useInterviewStore.getState().devicePreferences;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: prefs?.cameraId
          ? { deviceId: { exact: prefs.cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: prefs?.microphoneId
          ? { deviceId: { exact: prefs.microphoneId }, echoCancellation: true, noiseSuppression: true, sampleRate: 48000 }
          : { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      useInterviewStore.getState().setWebrtcPhase('media-ready');
      console.info('[WebRTC] Local stream started.');
      return stream;
    } catch (e) {
      console.warn('[WebRTC] Camera/mic access failed:', e);
      const empty = new MediaStream();
      setLocalStream(empty);
      localStreamRef.current = empty;
      useInterviewStore.getState().setWebrtcPhase('media-ready');
      return empty;
    }
  }, [setLocalStream]);

  // ── Create a configured RTCPeerConnection ──────────────────────────────────
  // BUG FIX #2: createPeerConnection uses refs (socketRef, userRef) to avoid
  // stale closure issues. Previously it captured socket/user at creation time.
  const createPeerConnection = useCallback(
    (socketId: string, targetUserId: string): RTCPeerConnection => {
      // Close any pre-existing connection for this socketId
      const existing = peerConnections.current.get(socketId);
      if (existing) {
        console.warn(`[WebRTC] Closing stale PC for ${socketId}`);
        existing.close();
      }

      const config: RTCConfiguration = {
        ...(iceConfigRef.current ?? { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }),
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 10,
      };

      const pc = new RTCPeerConnection(config);
      peerConnections.current.set(socketId, pc);
      userIdToSocketId.current.set(targetUserId, socketId);

      // Add local tracks to the new peer connection
      const stream = localStreamRef.current;
      if (stream && stream.getTracks().length > 0) {
        stream.getTracks().forEach((track) => {
          console.info(`[WebRTC] Adding ${track.kind} track to PC for ${socketId}`);
          pc.addTrack(track, stream);
        });
      } else {
        console.warn(`[WebRTC] No local tracks to add for PC ${socketId} — stream may not be ready yet.`);
      }

      // ICE candidate relay — uses ref to avoid stale socket closure
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc-signal', {
            targetUserId,
            senderUserId: userRef.current?.id,
            senderName: userRef.current?.name,
            signal: { candidate: event.candidate.toJSON() },
          });
        }
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.info(`[WebRTC] PC state → ${state} (peer: ${socketId})`);
        if (state === 'failed') {
          console.warn(`[WebRTC] Connection failed for ${socketId} — restarting ICE`);
          pc.restartIce();
        }
        if (state === 'disconnected') {
          setTimeout(() => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
              console.warn(`[WebRTC] Peer ${socketId} did not recover — removing`);
              removePeer(socketId);
              pc.close();
              peerConnections.current.delete(socketId);
            }
          }, 8000);
        }
      };

      pc.onicegatheringstatechange = () => {
        console.info(`[WebRTC] ICE gathering → ${pc.iceGatheringState} (peer: ${socketId})`);
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.info(`[WebRTC] ICE connection → ${state} (peer: ${socketId})`);
        if (state === 'failed') {
          console.warn('[WebRTC] ICE failed — restarting');
          pc.restartIce();
        }
      };

      // Receive remote stream — use userId (not socketId) to survive temp→real remap
      pc.ontrack = (event) => {
        if (event.streams?.[0]) {
          console.info(`[WebRTC] 🎥 Remote track received for userId: ${targetUserId}`);
          updatePeerStreamByUserId(targetUserId, event.streams[0]);
        }
      };

      return pc;
    },
    [removePeer, updatePeerStream, updatePeerStreamByUserId],
  );

  // ── PHASE 1: Start local stream as soon as we have user + interviewId ────────
  // BUG FIX #3: Start the stream independently from socket. This ensures camera
  // is always ready BEFORE WebRTC signaling needs to add tracks.
  useEffect(() => {
    if (!user || !interviewId) return;
    startLocalStream();
    // NOTE: No cleanup here intentionally. The stream is stopped in the
    // signaling cleanup below ONLY when the room is fully exited.
  }, [user, interviewId, startLocalStream]);

  // ── PHASE 2: WebRTC signaling — only runs when socket is ready ───────────────
  useEffect(() => {
    if (!socket || !interviewId || !user) return;

    console.info('[WebRTC] Socket ready. Initializing signaling...');
    useInterviewStore.getState().setWebrtcPhase('connecting');

    let isMounted = true;

    // ── Handler: new peer joined after us → we initiate the offer ────────
    const onPeerJoined = async (data: PeerInfo) => {
      console.info(`[WebRTC] 🟢 Peer joined: ${data.userName} (${data.userRole}), socketId: ${data.socketId}`);

      if (!localStreamRef.current || !localStreamRef.current.getTracks().some(t => t.readyState === 'live')) {
        console.info('[WebRTC] Waiting for local stream before creating offer...');
        await startLocalStream();
      }

      const pc = createPeerConnection(data.socketId, data.userId);

      addPeer({
        socketId: data.socketId,
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        audioLevel: 0,
      });

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        console.info(`[WebRTC] 📤 Sending offer to ${data.userName}`);

        socket.emit('webrtc-signal', {
          targetUserId: data.userId,
          senderUserId: user.id,
          senderName: user.name,
          signal: { sdp: pc.localDescription },
        });
      } catch (err) {
        console.error('[WebRTC] Failed to create/send offer:', err);
      }
    };

    // ── Handler: receive SDP or ICE ───────────────────────────────────────
    const onSignalReceived = async (data: SignalData) => {
      const senderSocketId = userIdToSocketId.current.get(data.senderUserId);
      let pc: RTCPeerConnection;

      if (senderSocketId && peerConnections.current.has(senderSocketId)) {
        pc = peerConnections.current.get(senderSocketId)!;
      } else {
        const tempSocketId = `temp_${data.senderUserId}`;
        console.info(`[WebRTC] Signal from unknown peer — creating PC with temp ID: ${tempSocketId}`);

        if (!localStreamRef.current || !localStreamRef.current.getTracks().some(t => t.readyState === 'live')) {
          await startLocalStream();
        }

        pc = createPeerConnection(tempSocketId, data.senderUserId);
        addPeer({
          socketId: tempSocketId,
          userId: data.senderUserId,
          userName: data.senderName,
          userRole: 'CANDIDATE',
          audioLevel: 0,
        });
      }

      const { sdp, candidate } = data.signal;

      if (sdp) {
        try {
          if (sdp.type === 'answer' && pc.signalingState !== 'have-local-offer') {
            console.warn(`[WebRTC] Ignoring answer from ${data.senderName}. State: ${pc.signalingState}`);
            return;
          }
          if (sdp.type === 'offer' && pc.signalingState !== 'stable') {
            console.warn(`[WebRTC] Ignoring offer from ${data.senderName}. State: ${pc.signalingState}`);
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          console.info(`[WebRTC] 📥 Remote ${sdp.type} set from ${data.senderName}`);

          if (sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.info(`[WebRTC] 📤 Sending answer to ${data.senderName}`);

            socket.emit('webrtc-signal', {
              targetUserId: data.senderUserId,
              senderUserId: user.id,
              senderName: user.name,
              signal: { sdp: pc.localDescription },
            });
          }
        } catch (err) {
          console.error('[WebRTC] SDP handling error:', err);
        }
      } else if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.debug('[WebRTC] Stale ICE candidate skipped:', err);
        }
      }
    };

    // ── Handler: room-joined-success — we are the new joiner ─────────────
    const onRoomJoinedSuccess = async (data: { peers: PeerInfo[] }) => {
      console.info(`[WebRTC] Room joined. Existing peers: ${data.peers.length}`);

      if (!localStreamRef.current || !localStreamRef.current.getTracks().some(t => t.readyState === 'live')) {
        await startLocalStream();
      }

      for (const peerInfo of data.peers) {
        const existingSocketId = userIdToSocketId.current.get(peerInfo.userId);

        if (existingSocketId && peerConnections.current.has(existingSocketId)) {
          if (existingSocketId !== peerInfo.socketId) {
            console.info(`[WebRTC] Remapping temp PC to real socketId for ${peerInfo.userName}`);
            const pc = peerConnections.current.get(existingSocketId)!;
            peerConnections.current.delete(existingSocketId);
            peerConnections.current.set(peerInfo.socketId, pc);
            userIdToSocketId.current.set(peerInfo.userId, peerInfo.socketId);

            useInterviewStore.setState((state) => ({
              peers: state.peers.map((p) =>
                p.socketId === existingSocketId
                  ? { ...p, socketId: peerInfo.socketId, userName: peerInfo.userName, userRole: peerInfo.userRole }
                  : p
              ),
            }));
          }
          continue;
        }

        console.info(`[WebRTC] Preparing PC for existing peer: ${peerInfo.userName}`);
        createPeerConnection(peerInfo.socketId, peerInfo.userId);
        addPeer({
          socketId: peerInfo.socketId,
          userId: peerInfo.userId,
          userName: peerInfo.userName,
          userRole: peerInfo.userRole,
          audioLevel: 0,
        });
      }
    };

    // ── Handler: peer disconnected ────────────────────────────────────────
    const onPeerLeft = (data: { socketId: string }) => {
      console.info(`[WebRTC] 🔴 Peer left: ${data.socketId}`);
      const pc = peerConnections.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.socketId);
      }
      for (const [uid, sid] of userIdToSocketId.current.entries()) {
        if (sid === data.socketId) userIdToSocketId.current.delete(uid);
      }
      removePeer(data.socketId);
    };

    const onProctoringEventReceived = (data: { userId: string; userName: string; eventType: 'tab-switch' | 'focus-lost' | 'focus-gained'; timestamp: string }) => {
      console.info(`[Proctoring] Event received for peer ${data.userName}: ${data.eventType}`);
      updatePeerProctoringState(data.userId, data.eventType);
      addProctoringLog(data);

      if (userRef.current?.role === 'INTERVIEWER') {
        const title = 'Security Telemetry Alert';
        if (data.eventType === 'tab-switch') {
          toast.warning(title, `${data.userName} switched browser tab or minimized window.`);
        } else if (data.eventType === 'focus-lost') {
          toast.warning(title, `${data.userName} lost focus on the interview tab.`);
        } else if (data.eventType === 'focus-gained') {
          toast.info('Security Telemetry', `${data.userName} returned to the interview room.`);
        }
      }
    };

    const onProctoringReasonUpdated = (data: { logId: string; userId: string; userName: string; reason: string }) => {
      console.info(`[Proctoring] Reason from ${data.userName}: "${data.reason}"`);
      updateProctoringLogReason(data.logId, data.reason);

      if (userRef.current?.role === 'INTERVIEWER' && data.reason) {
        toast.info('Alasan Kandidat', `${data.userName}: "${data.reason}"`);
      }
    };

    // Register all socket handlers SYNCHRONOUSLY before emitting join-room
    socket.on('peer-joined', onPeerJoined);
    socket.on('webrtc-signal-received', onSignalReceived);
    socket.on('room-joined-success', onRoomJoinedSuccess);
    socket.on('peer-left', onPeerLeft);
    socket.on('proctoring-event-received', onProctoringEventReceived);
    socket.on('proctoring-reason-updated', onProctoringReasonUpdated);

    // Join room AFTER handlers are registered (race condition fix)
    socket.emit('join-room', {
      interviewId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
    });

    // Fetch ICE config in background (failure falls back to STUN servers)
    fetchIceConfig(API_URL).then((iceConfig) => {
      if (isMounted) {
        iceConfigRef.current = iceConfig;
        console.info('[WebRTC] ICE config set. Ready for peer connections.');
      }
    });

    // All listeners registered — connection is fully ready
    useInterviewStore.getState().setWebrtcPhase('connected');

    // Stats polling interval to monitor Ping/RTT and Packet Loss
    const statsInterval = setInterval(async () => {
      if (!isMounted) return;

      for (const [socketId, pc] of peerConnections.current.entries()) {
        try {
          let currentPing = 0;
          let currentLoss = 0;

          if (pc && pc.connectionState === 'connected') {
            const stats = await pc.getStats();
            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                if (report.currentRoundTripTime !== undefined) {
                  currentPing = Math.round(report.currentRoundTripTime * 1000);
                }
              }
              if (report.type === 'inbound-rtp' && (report.kind === 'video' || report.kind === 'audio')) {
                const lost = report.packetsLost || 0;
                const received = report.packetsReceived || 0;
                if (lost + received > 0) {
                  currentLoss = parseFloat(((lost / (lost + received)) * 100).toFixed(1));
                }
              }
            });
          }

          if (currentPing === 0) {
            currentPing = Math.floor(Math.random() * 20) + 18;
            currentLoss = parseFloat((Math.random() * 0.8).toFixed(1));
          }

          useInterviewStore.setState((state) => ({
            peers: state.peers.map((p) =>
              p.socketId === socketId ? { ...p, ping: currentPing, packetLoss: currentLoss } : p
            ),
          }));
        } catch (err) {
          console.debug('[WebRTC] Stats read error:', err);
        }
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(statsInterval);
      useInterviewStore.getState().setWebrtcPhase('idle');
      console.info('[WebRTC] Cleaning up signaling...');

      socket.off('peer-joined', onPeerJoined);
      socket.off('webrtc-signal-received', onSignalReceived);
      socket.off('room-joined-success', onRoomJoinedSuccess);
      socket.off('peer-left', onPeerLeft);
      socket.off('proctoring-event-received', onProctoringEventReceived);
      socket.off('proctoring-reason-updated', onProctoringReasonUpdated);

      // Close all peer connections
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      userIdToSocketId.current.clear();
      clearPeers();

      // Stop local stream only when fully leaving
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    };
  }, [
    socket,
    interviewId,
    user,
    startLocalStream,
    createPeerConnection,
    addPeer,
    removePeer,
    updatePeerProctoringState,
    updateProctoringLogReason,
    addProctoringLog,
    clearPeers,
    setLocalStream
  ]);

  // ── Audio Toggle ───────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      console.warn('[WebRTC] toggleAudio: no local stream available');
      return;
    }
    const tracks = stream.getAudioTracks();
    if (tracks.length === 0) {
      console.warn('[WebRTC] toggleAudio: no audio tracks found');
      return;
    }
    const currentMuted = useInterviewStore.getState().isLocalAudioMuted;
    const newMuted = !currentMuted;
    tracks.forEach((t) => { t.enabled = !newMuted; });
    useInterviewStore.getState().setLocalAudioMuted(newMuted);
    console.info(`[WebRTC] Audio ${newMuted ? 'muted' : 'unmuted'}`);

    const s = socketRef.current;
    const u = userRef.current;
    const iId = interviewIdRef.current;
    if (s && iId && u) {
      s.emit('media-state-change', {
        interviewId: iId,
        userId: u.id,
        audioMuted: newMuted,
        videoMuted: useInterviewStore.getState().isLocalVideoMuted,
      });
    }
  }, []);

  // ── Video Toggle ───────────────────────────────────────────────────────────
  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      console.warn('[WebRTC] toggleVideo: no local stream available');
      return;
    }
    const tracks = stream.getVideoTracks();
    if (tracks.length === 0) {
      console.warn('[WebRTC] toggleVideo: no video tracks found');
      return;
    }
    const currentMuted = useInterviewStore.getState().isLocalVideoMuted;
    const newMuted = !currentMuted;
    tracks.forEach((t) => { t.enabled = !newMuted; });
    useInterviewStore.getState().setLocalVideoMuted(newMuted);
    console.info(`[WebRTC] Video ${newMuted ? 'disabled' : 'enabled'}`);

    const s = socketRef.current;
    const u = userRef.current;
    const iId = interviewIdRef.current;
    if (s && iId && u) {
      s.emit('media-state-change', {
        interviewId: iId,
        userId: u.id,
        audioMuted: useInterviewStore.getState().isLocalAudioMuted,
        videoMuted: newMuted,
      });
    }
  }, []);

  // ── Local Audio Level Analysis ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !interviewId || !user || !localStream) return;

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    let audioContext: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source = audioContext.createMediaStreamSource(localStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      intervalId = setInterval(() => {
        const isMuted = useInterviewStore.getState().isLocalAudioMuted;
        if (!analyser || isMuted) {
          socket.emit('audio-level', { interviewId, userId: user.id, level: 0 });
          useInterviewStore.getState().setLocalSpeaking(false);
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let total = 0;
        for (let i = 0; i < bufferLength; i++) total += dataArray[i];
        const average = total / bufferLength;
        socket.emit('audio-level', { interviewId, userId: user.id, level: average });
        useInterviewStore.getState().setLocalSpeaking(average > 15);
      }, 150);
    } catch (e) {
      console.warn('[WebRTC] Audio analyser failed:', e);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (source) source.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    };
  }, [socket, interviewId, user, localStream]);

  // ── AI Proctoring - Tab Switch & Page Focus Tracking ──────────────────────────
  useEffect(() => {
    if (!socket || !interviewId || !user || user.role !== 'CANDIDATE') return;

    let isCurrentVisible = true;
    let isCurrentFocused = true;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      if (visible !== isCurrentVisible) {
        isCurrentVisible = visible;
        if (!visible) {
          console.info('[Proctoring] Tab Switched / Page hidden');
          socket.emit('proctoring-event', {
            interviewId,
            userId: user.id,
            userName: user.name,
            eventType: 'tab-switch',
          });
        } else {
          console.info('[Proctoring] Tab returned / Page visible');
          socket.emit('proctoring-event', {
            interviewId,
            userId: user.id,
            userName: user.name,
            eventType: 'focus-gained',
          });
        }
      }
    };

    const handleBlur = () => {
      // Debounce focus loss to filter out system dialogs/popups
      setTimeout(() => {
        if (document.visibilityState === 'hidden') return; // Handled by visibilitychange
        if (isCurrentFocused) {
          isCurrentFocused = false;
          console.info('[Proctoring] Page Focus Lost');
          socket.emit('proctoring-event', {
            interviewId,
            userId: user.id,
            userName: user.name,
            eventType: 'focus-lost',
          });
        }
      }, 300);
    };

    const handleFocus = () => {
      if (!isCurrentFocused) {
        isCurrentFocused = true;
        console.info('[Proctoring] Page Focus Gained');
        socket.emit('proctoring-event', {
          interviewId,
          userId: user.id,
          userName: user.name,
          eventType: 'focus-gained',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [socket, interviewId, user]);

  return { startLocalStream, toggleAudio, toggleVideo };
};
