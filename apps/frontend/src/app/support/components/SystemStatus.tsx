'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Bell, Activity, Clock, Calendar, Wifi, Database, Code2, Video } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

type ServiceStatus = 'operational' | 'degraded' | 'down';

interface Service {
  name: string;
  icon: React.ElementType;
  status: ServiceStatus;
  uptime: string;
  latency: string;
  description: string;
}

const services: Service[] = [
  { name: 'Video Calls (WebRTC)', icon: Video, status: 'operational', uptime: '99.98%', latency: '<120ms', description: 'Peer-to-peer video, audio, and screen sharing' },
  { name: 'Code Editor', icon: Code2, status: 'operational', uptime: '99.99%', latency: '<50ms', description: 'Collaborative IDE with real-time sync' },
  { name: 'API', icon: Wifi, status: 'operational', uptime: '99.97%', latency: '<80ms', description: 'REST API and WebSocket gateway' },
  { name: 'Database', icon: Database, status: 'operational', uptime: '99.99%', latency: '<15ms', description: 'PostgreSQL with automated backups' },
  { name: 'AI Evaluation', icon: Activity, status: 'degraded', uptime: '99.85%', latency: '<2s', description: 'AI scoring and transcription service' },
];

const statusConfig = {
  operational: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Operational' },
  degraded: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Degraded Performance' },
  down: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Service Disruption' },
};

const uptimeHistory = [
  { month: 'Jan', uptime: 99.99 },
  { month: 'Feb', uptime: 99.98 },
  { month: 'Mar', uptime: 99.97 },
  { month: 'Apr', uptime: 99.99 },
  { month: 'May', uptime: 99.96 },
  { month: 'Jun', uptime: 99.98 },
];

export function SystemStatus() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-h1 font-display font-semibold text-white">
          System Status
        </h1>
        <p className="text-[13px] text-body-muted/60 mt-1">
          Real-time monitoring of all InterviewOS services
        </p>
      </div>

      {/* Overall status banner */}
      <Card variant="ghost" padding="md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-white">All Systems Operational</div>
            <div className="text-[12px] text-body-muted/50">Last checked 2 minutes ago</div>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-display font-semibold text-green-400">99.96%</div>
            <div className="text-[10px] text-body-muted/50 font-mono">Uptime this month</div>
          </div>
        </div>
      </Card>

      {/* Services grid */}
      <div className="grid gap-3">
        {services.map((service, index) => {
          const Icon = service.icon;
          const status = statusConfig[service.status];
          const StatusIcon = status.icon;
          return (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card variant="default" padding="md">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${status.bg}`}>
                    <Icon className="w-4.5 h-4.5 text-body-muted/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-white">{service.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[9px] font-semibold ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {status.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-body-muted/55 mt-0.5">{service.description}</div>
                  </div>
                  <div className="text-right text-[11px] text-body-muted/50 font-mono shrink-0">
                    <div>Uptime: {service.uptime}</div>
                    <div>Latency: {service.latency}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Uptime history */}
      <Card variant="default" padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-body-muted/55" />
            <span className="text-[13px] font-medium text-white">Uptime History</span>
          </div>
          <button
            onClick={() => setSubscribed(!subscribed)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
              subscribed
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-white/[0.04] text-body-muted/50 hover:text-white border border-transparent hover:border-white/[0.12]'
            }`}
          >
            <Bell className="w-3 h-3" />
            {subscribed ? 'Subscribed' : 'Get notified'}
          </button>
        </div>
        <div className="flex items-end gap-2 h-[60px]">
          {uptimeHistory.map((item) => {
            const height = Math.max(20, item.uptime - 99.9) * 200;
            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-md bg-primary/30 hover:bg-primary/50 transition-colors relative group"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-primary-on-dark">
                    {item.uptime}%
                  </div>
                </div>
                <span className="text-[9px] font-mono text-body-muted/50">{item.month}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Incident history */}
      <Card variant="default" padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-body-muted/55" />
          <span className="text-[13px] font-medium text-white">Past Incidents</span>
        </div>
        <div className="space-y-2">
          {[
            { date: 'May 28, 2026', title: 'AI Evaluation Latency Spike', duration: '12 min', status: 'resolved' as const },
            { date: 'May 15, 2026', title: 'WebSocket Reconnection Issue', duration: '8 min', status: 'resolved' as const },
            { date: 'Apr 30, 2026', title: 'Database Backup Delay', duration: '22 min', status: 'resolved' as const },
          ].map((incident) => (
            <div key={incident.date} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <CheckCircle className="w-3 h-3 text-green-400/50 shrink-0" />
              <span className="flex-1 text-[12px] text-body-muted/60">{incident.title}</span>
              <span className="text-[10px] text-body-muted/50 font-mono">{incident.date}</span>
              <span className="text-[10px] font-mono text-amber-400/50 bg-amber-400/10 px-1.5 py-0.5 rounded">
                {incident.duration}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
