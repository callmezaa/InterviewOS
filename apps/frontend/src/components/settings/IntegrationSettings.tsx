'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Link2, Globe, Trash2, Plus, Check, X,
  Loader2, Bell, ExternalLink, ZapOff, Plug,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { toast } from '../../store/useToastStore';
import { API_URL } from '../../lib/config';

type Provider = 'SLACK' | 'DISCORD' | 'WEBHOOK';

interface Integration {
  id: string;
  provider: Provider;
  webhookUrl?: string | null;
  channelId?: string | null;
  channelName?: string | null;
  teamName?: string | null;
  enabled: boolean;
  notificationTypes: string[];
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

const EVENT_LABELS: Record<string, string> = {
  interview_scheduled: 'Interview Scheduled',
  interview_cancelled: 'Interview Cancelled',
  interview_rescheduled: 'Interview Rescheduled',
  feedback_ready: 'Feedback Ready',
  interview_reminder: 'Reminder (15 min before)',
};

const PROVIDER_META: Record<Provider, { name: string; description: string; color: string; icon: React.ElementType }> = {
  SLACK: { name: 'Slack', description: 'Send interview notifications to a Slack channel.', color: 'text-[#4A154B]', icon: MessageSquare },
  DISCORD: { name: 'Discord', description: 'Send interview notifications via Discord webhook.', color: 'text-[#5865F2]', icon: MessageSquare },
  WEBHOOK: { name: 'Webhook', description: 'Forward interview events to your own endpoint.', color: 'text-body-muted/60', icon: Globe },
};

function IntegrationCard({
  integration,
  onToggle,
  onUpdate,
  onDelete,
  onTest,
  testing,
}: {
  integration: Integration;
  onToggle: (enabled: boolean) => void;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onTest: () => void;
  testing: boolean;
}) {
  const meta = PROVIDER_META[integration.provider];
  const Icon = meta.icon;
  const connectedLabel = integration.teamName
    ? `${integration.teamName}${integration.channelName ? ` / #${integration.channelName}` : ''}`
    : 'Connected';

  return (
    <Card variant="default" className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] shrink-0 ${meta.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[15px] font-semibold text-white">{meta.name}</h4>
              <Badge variant={integration.enabled ? 'success' : 'neutral'} className="text-[10px]">
                {integration.enabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            {integration.provider !== 'WEBHOOK' ? (
              <span className="text-[12px] text-body-muted/50">{connectedLabel}</span>
            ) : (
              <span className="text-[12px] text-body-muted/50 font-mono truncate block max-w-[300px]">
                {(integration.metadata as Record<string, unknown>)?.name as string || integration.webhookUrl || 'Custom webhook'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={integration.enabled}
            onClick={() => onToggle(!integration.enabled)}
            className={`relative w-9 h-5 rounded-full transition-all duration-200 ${
              integration.enabled ? 'bg-primary' : 'bg-white/[0.1]'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${
              integration.enabled ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {integration.notificationTypes.map((event) => (
          <span key={event} className="text-[10px] text-primary-on-dark bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            {EVENT_LABELS[event] || event}
          </span>
        ))}
      </div>

      <div className="border-t border-white/[0.06] pt-3 flex items-center gap-2">
        <Button
          variant="ghost"
          disabled={testing}
          onClick={onTest}
          className="text-[11px] h-7 px-2.5"
        >
          {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
          <span>Test</span>
        </Button>
        <Button
          variant="ghost"
          onClick={onDelete}
          className="text-[11px] h-7 px-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-3 h-3" />
          <span>Disconnect</span>
        </Button>
      </div>
    </Card>
  );
}

export function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [slackInstalling, setSlackInstalling] = useState(false);
  const [discordInstalling, setDiscordInstalling] = useState(false);
  const [webhookFormOpen, setWebhookFormOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookName, setWebhookName] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookSubmitting, setWebhookSubmitting] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/integrations`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const handleSlackInstall = async () => {
    setSlackInstalling(true);
    try {
      const res = await fetch(`${API_URL}/integrations/slack/install`, {
        method: 'POST', credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to get install URL');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error('Slack Install Failed', err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setSlackInstalling(false);
    }
  };

  const handleDiscordInstall = async () => {
    setDiscordInstalling(true);
    try {
      const res = await fetch(`${API_URL}/integrations/discord/install`, {
        method: 'POST', credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to get install URL');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error('Discord Install Failed', err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setDiscordInstalling(false);
    }
  };

  const handleToggle = async (integration: Integration, enabled: boolean) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === integration.id ? { ...i, enabled } : i)),
    );

    try {
      const res = await fetch(`${API_URL}/integrations/${integration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integration.id ? { ...i, enabled: !enabled } : i)),
      );
      toast.error('Update Failed', 'Could not update integration');
    }
  };

  const handleDelete = async (id: string) => {
    const prev = integrations;
    setIntegrations((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await fetch(`${API_URL}/integrations/${id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Integration disconnected');
    } catch {
      setIntegrations(prev);
      toast.error('Disconnect Failed', 'Could not disconnect integration');
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`${API_URL}/integrations/${id}/test`, {
        method: 'POST', credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Test failed');
      toast.success('Test Sent', 'Check your integration for the test message');
    } catch (err) {
      toast.error('Test Failed', err instanceof Error ? err.message : 'Could not send test');
    } finally {
      setTestingId(null);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebhookSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/integrations/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          callbackUrl: webhookUrl,
          name: webhookName || undefined,
          secret: webhookSecret || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create webhook');

      setIntegrations((prev) => [data, ...prev]);
      setWebhookFormOpen(false);
      setWebhookUrl('');
      setWebhookName('');
      setWebhookSecret('');
      toast.success('Webhook created');
    } catch (err) {
      toast.error('Webhook Failed', err instanceof Error ? err.message : 'Could not create webhook');
    } finally {
      setWebhookSubmitting(false);
    }
  };

  const slackIntegration = integrations.find((i) => i.provider === 'SLACK');
  const discordIntegration = integrations.find((i) => i.provider === 'DISCORD');
  const webhookIntegrations = integrations.filter((i) => i.provider === 'WEBHOOK');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      key="integrations"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display font-semibold text-[20px] text-white">Integrations</h3>
        <p className="text-[12px] text-body-muted/50">
          Connect your tools to receive interview notifications and automate your workflow.
        </p>
      </div>

      <Card variant="default" className="p-5 flex flex-col gap-4">
        <h4 className="text-[14px] font-semibold text-white flex items-center gap-2">
          <Plug className="w-4 h-4 text-primary" />
          Available Integrations
        </h4>

        <div className="flex flex-col gap-3">
          {!slackIntegration ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#4A154B]/10 border border-[#4A154B]/20">
                  <MessageSquare className="w-5 h-5 text-[#4A154B]" />
                </div>
                <div>
                  <span className="block text-[14px] font-medium text-white">Slack</span>
                  <span className="block text-[11px] text-body-muted/50">Send notifications to your Slack workspace</span>
                </div>
              </div>
              <Button
                variant="secondary"
                disabled={slackInstalling}
                onClick={handleSlackInstall}
                className="text-[12px] h-8"
              >
                {slackInstalling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>Connect</span>
              </Button>
            </div>
          ) : (
            <IntegrationCard
              integration={slackIntegration}
              onToggle={(enabled) => handleToggle(slackIntegration, enabled)}
              onUpdate={async () => {}}
              onDelete={() => handleDelete(slackIntegration.id)}
              onTest={() => handleTest(slackIntegration.id)}
              testing={testingId === slackIntegration.id}
            />
          )}

          {!discordIntegration ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#5865F2]/10 border border-[#5865F2]/20">
                  <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                </div>
                <div>
                  <span className="block text-[14px] font-medium text-white">Discord</span>
                  <span className="block text-[11px] text-body-muted/50">Send notifications via Discord webhook</span>
                </div>
              </div>
              <Button
                variant="secondary"
                disabled={discordInstalling}
                onClick={handleDiscordInstall}
                className="text-[12px] h-8"
              >
                {discordInstalling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>Connect</span>
              </Button>
            </div>
          ) : (
            <IntegrationCard
              integration={discordIntegration}
              onToggle={(enabled) => handleToggle(discordIntegration, enabled)}
              onUpdate={async () => {}}
              onDelete={() => handleDelete(discordIntegration.id)}
              onTest={() => handleTest(discordIntegration.id)}
              testing={testingId === discordIntegration.id}
            />
          )}
        </div>

        <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-body-muted/60" />
              <span className="text-[14px] font-medium text-white">Custom Webhooks</span>
              {webhookIntegrations.length > 0 && (
                <span className="text-[11px] text-body-muted/50">({webhookIntegrations.length})</span>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => setWebhookFormOpen(!webhookFormOpen)}
              className="text-[12px] h-7"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Webhook</span>
            </Button>
          </div>

          {webhookFormOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateWebhook}
              className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-body-muted/60 font-mono font-semibold">Webhook URL</label>
                <input
                  type="url"
                  required
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.example.com/events"
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2 text-[13px] text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-body-muted/60 font-mono font-semibold">Name (Optional)</label>
                <input
                  type="text"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  placeholder="My Webhook"
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2 text-[13px] text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-body-muted/60 font-mono font-semibold">Secret (Optional)</label>
                <input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Bearer sk-..."
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2 text-[13px] text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={webhookSubmitting} className="text-[12px] h-8">
                  {webhookSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Create</span>
                </Button>
                <Button type="button" variant="ghost" onClick={() => setWebhookFormOpen(false)} className="text-[12px] h-8">
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </Button>
              </div>
            </motion.form>
          )}

          {webhookIntegrations.length > 0 && (
            <div className="flex flex-col gap-2">
              {webhookIntegrations.map((wh) => (
                <IntegrationCard
                  key={wh.id}
                  integration={wh}
                  onToggle={(enabled) => handleToggle(wh, enabled)}
                  onUpdate={async () => {}}
                  onDelete={() => handleDelete(wh.id)}
                  onTest={() => handleTest(wh.id)}
                  testing={testingId === wh.id}
                />
              ))}
            </div>
          )}

          {webhookIntegrations.length === 0 && !webhookFormOpen && (
            <p className="text-[12px] text-body-muted/40 text-center py-3">
              No custom webhooks configured. Add one to forward interview events to your own endpoint.
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
