'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { importQuestions, type ImportResult } from '../../lib/questions';

interface QuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

const ACCEPTED = '.json,.csv';

export default function QuestionImportModal({ isOpen, onClose, onImported }: QuestionImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setImporting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validateFile = (f: File): string | null => {
    const ext = f.name.toLowerCase();
    if (!ext.endsWith('.json') && !ext.endsWith('.csv')) {
      return 'Please upload a JSON or CSV file.';
    }
    if (f.size > 10 * 1024 * 1024) {
      return 'File is too large. Maximum size is 10 MB.';
    }
    return null;
  };

  const handleFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setResult(null);
    setFile(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const res = await importQuestions(file);
      setResult(res);
      if (res.imported > 0) {
        onImported();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-surface-tile-2 border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Import Questions
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-body-muted/50 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                {result.imported > 0 ? (
                  <CheckCircle className="w-8 h-8 text-success shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-warning shrink-0" />
                )}
                <div>
                  <p className="text-[14px] font-semibold text-white">
                    {result.imported > 0
                      ? `Successfully imported ${result.imported} question${result.imported !== 1 ? 's' : ''}`
                      : 'No questions were imported'}
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-[12px] text-body-muted/60 mt-0.5">
                      {result.skipped} question{result.skipped !== 1 ? 's' : ''} skipped due to errors
                    </p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  <p className="text-[12px] font-medium text-body-muted/60">Errors:</p>
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-danger/80">
                      <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>Row {e.row}: {e.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={reset}>
                  Import Another File
                </Button>
                <Button variant="primary" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-body-muted/60 leading-relaxed">
                Upload a JSON or CSV file containing questions. Use the export feature to get a template.
              </p>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[12px] text-danger flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </motion.p>
              )}

              <div
                ref={dropRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                  ${dragging
                    ? 'border-primary bg-primary/[0.04] scale-[1.02]'
                    : file
                      ? 'border-primary/40 bg-white/[0.02]'
                      : 'border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]'
                  }
                `}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    {file.name.endsWith('.json') ? (
                      <FileText className="w-10 h-10 text-primary" />
                    ) : (
                      <FileSpreadsheet className="w-10 h-10 text-primary" />
                    )}
                    <p className="text-[14px] font-medium text-white">{file.name}</p>
                    <p className="text-[12px] text-body-muted/50">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setError(null);
                      }}
                      className="text-[12px] text-danger/70 hover:text-danger transition-colors mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-body-muted/40" />
                    <p className="text-[14px] text-body-muted/70">
                      <span className="text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[12px] text-body-muted/40">
                      JSON or CSV files (max 10 MB)
                    </p>
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED}
                  className="hidden"
                  onChange={onInputChange}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!file || importing}
                  onClick={handleImport}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Import {file ? file.name : ''}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
