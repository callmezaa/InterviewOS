'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '../../../../components/ui/EmptyState';

interface Note {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export const NotesPanel: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const addNote = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [note, ...prev]);
    setInput('');
  }, [input]);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingId === id) setEditingId(null);
  }, [editingId]);

  const startEdit = useCallback((note: Note) => {
    setEditingId(note.id);
    setEditText(note.text);
  }, []);

  const commitEdit = useCallback(() => {
    const text = editText.trim();
    if (!text || !editingId) { setEditingId(null); return; }
    setNotes((prev) =>
      prev.map((n) => (n.id === editingId ? { ...n, text, updatedAt: Date.now() } : n))
    );
    setEditingId(null);
    setEditText('');
  }, [editText, editingId]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText('');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex gap-2 mb-3 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a quick note..."
          aria-label="New note"
          className="flex-1 bg-surface-black border border-white/[0.06] focus:border-primary-focus focus:outline-none focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-1.5 text-[13px] text-white placeholder:text-body-muted/30"
        />
        <button
          onClick={addNote}
          disabled={!input.trim()}
          className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-30 transition-opacity shrink-0"
          aria-label="Add note"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {notes.length === 0 ? (
          <EmptyState
            icon={<StickyNote className="w-4 h-4" />}
            description="No notes yet. Jot down thoughts during the interview."
            compact
          />
        ) : (
          <AnimatePresence>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="group relative bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 hover:border-amber-500/25 transition-colors"
              >
                {editingId === note.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-surface-black border border-white/[0.06] rounded px-2 py-1.5 text-[13px] text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        className="text-[11px] text-body-muted/60 hover:text-white transition-colors font-mono"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={commitEdit}
                        className="text-[11px] text-primary-on-dark hover:text-white transition-colors font-mono font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p
                      onClick={() => startEdit(note)}
                      className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap cursor-pointer"
                    >
                      {note.text}
                    </p>
                    <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-body-muted/30 font-mono">
                        {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-body-muted/30 hover:text-red-400 transition-colors"
                        aria-label="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
