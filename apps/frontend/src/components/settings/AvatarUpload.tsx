'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Trash2, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../lib/config';
import { useInterviewStore } from '../../store/useInterviewStore';
import { toast } from '../../store/useToastStore';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

export default function AvatarUpload() {
  const { user, setUser } = useInterviewStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAvatar = user?.avatarUrl || null;
  const displayUrl = previewUrl || currentAvatar;

  // Clear error after 4s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, WebP, or AVIF image.';
    }
    if (file.size > MAX_SIZE) {
      return 'File is too large. Maximum size is 5 MB.';
    }
    return null;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        toast.error('Invalid File', validationError);
        return;
      }

      setError(null);

      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to backend
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const res = await fetch(`${API_URL}/auth/avatar`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || 'Upload failed');
        }

        const data = await res.json();

        // Update user store with new avatar URL
        if (user) {
          setUser({ ...user, avatarUrl: data.avatarUrl });
        }

        setPreviewUrl(null);
        toast.success('Avatar Updated', 'Your profile picture has been updated.');
      } catch (err: unknown) {
        setPreviewUrl(null);
        const message = err instanceof Error ? err.message : 'Connection failed.';
        setError(message);
        toast.error('Upload Failed', message);
      } finally {
        setUploading(false);
      }
    },
    [user, setUser, validateFile],
  );

  const handleRemove = useCallback(async () => {
    if (!user?.avatarUrl) return;
    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/auth/avatar`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to remove avatar');

      setUser({ ...user, avatarUrl: null });
      setPreviewUrl(null);
      toast.success('Avatar Removed', 'Your profile picture has been removed.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      setError(message);
      toast.error('Remove Failed', message);
    } finally {
      setUploading(false);
    }
  }, [user, setUser]);

  // Drag handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // Click upload
  const onUploadClick = () => inputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      {/* Avatar preview */}
      <div
        ref={dropRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onUploadClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onUploadClick(); }}
        className={`relative w-24 h-24 rounded-full overflow-hidden shrink-0 cursor-pointer group transition-all duration-200
          ${dragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-black scale-105' : ''}
          ${uploading ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Profile avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.06] flex items-center justify-center text-[28px] font-display font-semibold text-white/70">
            {user?.name ? getInitials(user.name) : 'U'}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Dragging indicator */}
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-primary/20 flex items-center justify-center"
            >
              <Upload className="w-8 h-8 text-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 pt-1">
        <h4 className="font-semibold text-[14px] text-white">Profile Photo</h4>
        <p className="text-[12px] text-body-muted/55 max-w-[280px] leading-relaxed">
          JPEG, PNG, WebP, or AVIF. Max 5 MB.
          {currentAvatar && ' Drag & drop a new image to replace it.'}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={onUploadClick}
            disabled={uploading}
            className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.1] transition-all disabled:opacity-40"
          >
            {currentAvatar ? 'Change' : 'Upload'}
          </button>

          {currentAvatar && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[11px] text-danger mt-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
