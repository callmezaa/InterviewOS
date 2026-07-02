'use client';

import { useRef, useCallback } from 'react';
import { useInterviewStore } from '../store/useInterviewStore';
import { toast } from '../store/useToastStore';
import { API_URL } from '../lib/config';

export const useRecording = (interviewId?: string) => {
  const { isRecording, setIsRecording, localStream, screenStream, setScreenStream } =
    useInterviewStore();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const recordingStartTime = useRef<number>(0);

  // ── Upload final blob to backend ────────────────────────────────────────────
  const uploadToBackend = useCallback(
    async (blob: Blob): Promise<string | null> => {
      if (!interviewId) return null;

      const formData = new FormData();
      formData.append('recording', blob, `interview_${interviewId}.webm`);

      try {
        const duration = recordingStartTime.current > 0 ? (Date.now() - recordingStartTime.current) / 1000 : 0;
        const res = await fetch(`${API_URL}/media/${interviewId}/upload`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'x-recording-duration': String(duration) },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Upload failed (${res.status}): ${err}`);
        }

        const data = await res.json();
        console.info('[Recording] Uploaded successfully:', data.recordingUrl);
        return data.recordingUrl as string;
      } catch (e) {
        console.error('[Recording] Upload error:', e);
        return null;
      }
    },
    [interviewId],
  );

  // ── Start recording ─────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isRecording || !interviewId) return;

    try {
      recordedChunks.current = [];

      let captureStream: MediaStream;

      // Prefer active screen share; otherwise prompt for it; fall back to camera
      if (screenStream) {
        captureStream = screenStream;
      } else {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          setScreenStream(displayStream);
          captureStream = displayStream;
        } catch {
          if (localStream) {
            captureStream = localStream;
          } else {
            alert('No media stream available to record.');
            return;
          }
        }
      }

      // Pick the best supported codec
      const mimeType = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ].find((m) => MediaRecorder.isTypeSupported(m)) ?? '';

      const recorder = new MediaRecorder(captureStream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);

        const actualMimeType = mediaRecorderRef.current?.mimeType || mimeType || 'video/webm';
        const finalBlob = new Blob(recordedChunks.current, { type: actualMimeType });
        console.info(`[Recording] Stopped. Total size: ${(finalBlob.size / 1024 / 1024).toFixed(2)} MB, type: ${actualMimeType}`);

        // Upload to backend (cloud storage)
        const cloudUrl = await uploadToBackend(finalBlob);

        if (cloudUrl) {
          console.info('[Recording] Saved to cloud:', cloudUrl);
          toast.success('Recording saved', 'Your session recording has been uploaded successfully.');
        } else {
          toast.error('Upload failed', 'Recording saved to your browser as fallback.');
          // Fallback: trigger local download so recording is not lost
          console.warn('[Recording] Upload failed — saving locally as fallback');
          const url = URL.createObjectURL(finalBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `interview_${interviewId}_${Date.now()}.webm`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 1000);
        }

        // Stop screen share tracks if we started them
        if (screenStream) {
          screenStream.getTracks().forEach((t) => t.stop());
          setScreenStream(null);
        }
      };

      // Collect a chunk every 2 seconds
      recorder.start(2000);
      recordingStartTime.current = Date.now();
      setIsRecording(true);
      console.info('[Recording] Started');
    } catch (err) {
      console.error('[Recording] Failed to start:', err);
    }
  }, [interviewId, isRecording, localStream, screenStream, setIsRecording, setScreenStream, uploadToBackend]);

  // ── Stop recording ──────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    console.info('[Recording] Stop requested');
  }, [isRecording]);

  return { isRecording, startRecording, stopRecording };
};
