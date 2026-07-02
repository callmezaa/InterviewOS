'use client';

import React, { useRef, useState, useCallback } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import type { InterviewDetails } from '../../store/useInterviewStore';
import { useBranding } from '../providers/BrandingProvider';

interface PDFExportProps {
  interview: InterviewDetails;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function PDFExport({ interview }: PDFExportProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const branding = useBranding();

  const handleExport = useCallback(async () => {
    if (!printRef.current) return;
    setExporting(true);

    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const html2canvas = html2canvasModule.default;

      const originalDisplay = printRef.current.style.display;
      printRef.current.style.display = 'block';

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      } as any);

      printRef.current.style.display = originalDisplay;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const margin = 15;
      const usableW = pdfW - margin * 2;
      const usableH = pdfH - margin * 2;

      const imgAspect = canvas.width / canvas.height;
      let imgW = usableW;
      let imgH = imgW / imgAspect;

      if (imgH > usableH) {
        imgH = usableH;
        imgW = imgH * imgAspect;
      }

      const x = (pdfW - imgW) / 2;
      const y = margin;

      if (canvas.height / canvas.width * usableW <= usableH) {
        pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
      } else {
        const pageH = usableH / (pdfW / canvas.width) * canvas.width / canvas.height * usableH;
        const totalHeight = canvas.height;
        let position = 0;

        while (position < totalHeight) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(totalHeight - position, canvas.width * usableH / usableW);
          const ctx = pageCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, position, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);

          const pageImg = pageCanvas.toDataURL('image/png');
          if (position > 0) pdf.addPage();
          pdf.addImage(pageImg, 'PNG', x, margin, usableW, pageCanvas.height / canvas.width * usableW);
          position += pageCanvas.height;
        }
      }

      pdf.save(`${interview.title.replace(/[^a-zA-Z0-9]/g, '_')}_Feedback.pdf`);
    } catch {
      setExporting(false);
    } finally {
      setExporting(false);
    }
  }, [interview]);

  const fb = interview.feedback;

  return (
    <>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-pill hover:bg-primary-focus transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileDown className="w-3.5 h-3.5" />
        )}
        <span>{exporting ? 'Preparing PDF...' : 'Export PDF'}</span>
      </button>

      {/* Hidden print-friendly content */}
      <div
        ref={printRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '800px',
          display: 'none',
          background: '#ffffff',
          color: '#1a1a1a',
          fontFamily: "'SF Pro Text', 'Inter', Arial, sans-serif",
          padding: '40px',
          lineHeight: 1.5,
        }}
      >
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #e5e5e5' }}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="4" fill={branding.primaryColor} />
              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">&gt;_</text>
            </svg>
          )}
          <span style={{ fontSize: 15, fontWeight: 600, color: branding.primaryColor }}>{branding.name}</span>
          <span style={{ fontSize: 11, color: '#999', marginLeft: 'auto' }}>Interview Feedback Report</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#000' }}>{interview.title}</h1>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
          {formatDate(interview.scheduledTime)} at {formatTime(interview.scheduledTime)}
          {interview.candidateEmail && (
            <> &middot; {interview.candidateEmail}</>
          )}
        </div>

        {fb ? (
          <>
            {/* Score row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
              <div style={{
                flex: 1, background: '#f8f8f8', borderRadius: 8, padding: 20,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Score</span>
                <span style={{
                  fontSize: 40, fontWeight: 700,
                  color: fb.score >= 80 ? '#059669' : fb.score >= 60 ? '#d97706' : '#dc2626',
                }}>{fb.score}<span style={{ fontSize: 18, fontWeight: 400 }}>%</span></span>
              </div>
              <div style={{
                flex: 1, background: '#f8f8f8', borderRadius: 8, padding: 20,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical</span>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#000' }}>{fb.technicalRating.toFixed(1)}</span>
                <span style={{ fontSize: 11, color: '#999' }}>/ 5.0</span>
              </div>
              <div style={{
                flex: 1, background: '#f8f8f8', borderRadius: 8, padding: 20,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Communication</span>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#000' }}>{fb.communicationRating.toFixed(1)}</span>
                <span style={{ fontSize: 11, color: '#999' }}>/ 5.0</span>
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0066cc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Evaluation Summary</h2>
              <p style={{ fontSize: 14, color: '#333', lineHeight: 1.6, fontStyle: 'italic', padding: '12px 16px', background: '#f8f8f8', borderRadius: 8, borderLeft: '3px solid #0066cc' }}>
                &ldquo;{fb.summary}&rdquo;
              </p>
            </div>

            {/* Detailed Analysis */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0066cc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Detailed Analysis</h2>
              <div style={{
                fontSize: 13, color: '#333', lineHeight: 1.7,
                background: '#f8f8f8', borderRadius: 8, padding: 16,
                whiteSpace: 'pre-wrap',
                fontFamily: "'SF Mono', 'Consolas', monospace",
                border: '1px solid #e5e5e5',
              }}>
                {fb.detailedReview}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 24, background: '#f8f8f8', borderRadius: 8, textAlign: 'center', color: '#999', fontSize: 14 }}>
            No AI feedback was generated for this session.
          </div>
        )}

        {/* Transcript */}
        {interview.transcript && interview.transcript.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0066cc', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Transcript ({interview.transcript.length} entries)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {interview.transcript.map((item, idx) => (
                <div key={idx} style={{
                  padding: '8px 12px',
                  background: idx % 2 === 0 ? '#f8f8f8' : '#ffffff',
                  borderRadius: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0066cc' }}>{item.speakerName}</span>
                    <span style={{ fontSize: 10, color: '#aaa' }}>
                      {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#444', margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e5e5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 10, color: '#aaa',
        }}>
          <span>Generated by {branding.name}</span>
          <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span>Session: {interview.id.slice(0, 8)}</span>
        </div>
      </div>
    </>
  );
}
