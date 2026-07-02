'use client';

import React, { useState } from 'react';
import { Download, Loader2, FileJson, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { API_URL } from '../../lib/config';
import { toast } from '../../store/useToastStore';

export default function DataExport() {
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/data-export`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to export data');
      }

      const blob = await res.blob();
      const filename =
        res.headers
          .get('Content-Disposition')
          ?.match(/filename="(.+)"/)?.[1] ||
        `interviewos-data-export-${new Date().toISOString().split('T')[0]}.json`;

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setLastExport(new Date().toISOString());
      toast.success('Data Exported', 'Your data has been downloaded successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Export Failed', message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card variant="default" className="p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <FileJson className="w-4 h-4 text-primary-on-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[14px] text-white">Download Your Data</h4>
          <p className="text-[12px] text-body-muted/55 mt-1 leading-relaxed">
            Get a copy of all your personal data stored on InterviewOS. This includes your
            profile, interviews, questions, notifications, and preferences. The data is
            exported as a structured JSON file.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="primary"
          disabled={exporting}
          onClick={handleExport}
          className="px-5 py-2 flex items-center gap-1.5"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{exporting ? 'Preparing export...' : 'Download Data'}</span>
        </Button>

        {lastExport && (
          <span className="flex items-center gap-1.5 text-[11px] text-body-muted/50">
            <CheckCircle className="w-3.5 h-3.5 text-success" />
            Last exported{' '}
            {new Date(lastExport).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </Card>
  );
}
