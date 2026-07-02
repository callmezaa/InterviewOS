'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, ShieldCheck, UserPlus, X, ChevronDown, 
  Users, MoreHorizontal, Trash2, Sparkles, Crown,
  UserCog, User,
} from 'lucide-react';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { IllustrationTeam } from '../../components/ui/Illustrations';
import { useTeamStore, type TeamMember, type TeamRole } from '../../store/useTeamStore';
import { useInterviewStore } from '../../store/useInterviewStore';
import { api } from '../../lib/api';

const ease = [0.22, 1, 0.36, 1] as const;

const ROLE_CONFIG: Record<TeamRole, { label: string; icon: React.ElementType; color: string; border: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-amber-400', border: 'border-amber-400/20 bg-amber-400/8' },
  interviewer: { label: 'Interviewer', icon: UserCog, color: 'text-primary-on-dark', border: 'border-primary/20 bg-primary/8' },
  viewer: { label: 'Viewer', icon: User, color: 'text-body-muted', border: 'border-white/[0.06] bg-white/[0.03]' },
};

const ROLE_OPTIONS: { value: TeamRole; label: string; desc: string }[] = [
  { value: 'admin', label: 'Admin', desc: 'Full access — manage team, invites, and settings' },
  { value: 'interviewer', label: 'Interviewer', desc: 'Can conduct interviews and view results' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access to team data and reports' },
];

function RoleBadge({ role }: { role: TeamRole }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold font-mono ${cfg.border} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: 'active' | 'invited' }) {
  return status === 'active' ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-green-400/80">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400/80">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Invited
    </span>
  );
}

/* ── Invite Modal ─────────────────────────────────────────── */

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('interviewer');
  const { inviting, inviteMember } = useTeamStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await inviteMember(email.trim(), role);
    setEmail('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
            className="w-full max-w-md rounded-xl border border-white/[0.06] bg-surface-tile-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5 text-primary-on-dark" />
                </div>
                <h2 id="invite-title" className="font-display font-semibold text-[15px] text-white">Invite Member</h2>
              </div>
              <button onClick={onClose} className="text-body-muted/50 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-body-muted/60 font-mono font-semibold">Email Address</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  icon={Mail}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-body-muted/60 font-mono font-semibold">Role</label>
                <div className="flex flex-col gap-2">
                  {ROLE_OPTIONS.map((opt) => {
                    const Icon = ROLE_CONFIG[opt.value].icon;
                    const isActive = role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                          isActive
                            ? `${ROLE_CONFIG[opt.value].border}`
                            : 'border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 ${ROLE_CONFIG[opt.value].color}`} />
                        <div>
                          <span className={`text-[13px] font-semibold ${isActive ? 'text-white' : 'text-white/70'}`}>
                            {opt.label}
                          </span>
                          <p className="text-[11px] text-body-muted/50 mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={inviting || !email.trim()} className="flex-1">
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Role Select Dropdown ──────────────────────────────────── */

function RoleSelect({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const { updateRole } = useTeamStore();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-[11px] font-mono"
      >
        <RoleBadge role={member.role} />
        <ChevronDown className="w-3 h-3 text-body-muted/50" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15, ease }}
              className="absolute right-0 top-full mt-1 w-48 z-50 rounded-lg border border-white/[0.06] bg-surface-tile-2 shadow-lg overflow-hidden"
            >
              {ROLE_OPTIONS.map((opt) => {
                const isActive = member.role === opt.value;
                const Icon = ROLE_CONFIG[opt.value].icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateRole(member.id, opt.value);
                      setOpen(false);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                      isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${ROLE_CONFIG[opt.value].color}`} />
                    <span className={`text-[12px] ${isActive ? 'text-white font-semibold' : 'text-white/70'}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function TeamPage() {
  const { user } = useInterviewStore();
  const { members, loading, fetchMembers, removeMember } = useTeamStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const isAdmin = user?.role === 'INTERVIEWER';

  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans selection:bg-primary">
      <Header subTitle="Team Management" />

      <main className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col gap-6">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] via-surface-tile-2/40 to-white/[0.01]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-on-dark/30 to-transparent" />

            <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-on-dark" />
                </div>
                <div>
                  <h1 className="font-display font-semibold text-[18px] text-white">Team</h1>
                  <p className="text-[12px] text-body-muted/50 mt-0.5">
                    {members.length} {members.length === 1 ? 'member' : 'members'} · Collaborate on interviews
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-1.5 py-2"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </Button>
            </div>
          </motion.div>

          {/* ── Members List ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
          >
            {loading ? (
              <div className="flex flex-col gap-3 p-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <EmptyState
                illustration={<IllustrationTeam />}
                title="No team members yet"
                description="Invite colleagues to collaborate on interviews, share feedback, and manage candidates together."
                action={{ label: 'Invite Your First Member', onClick: () => setInviteOpen(true) }}
              />
            ) : (
              <div>
                {/* Table header */}
                <div className="hidden sm:flex items-center gap-4 px-5 py-3 border-b border-white/[0.04] text-[10px] text-body-muted/40 font-mono font-semibold uppercase tracking-wider">
                  <span className="flex-1">Member</span>
                  <span className="w-24">Role</span>
                  <span className="w-20">Status</span>
                  <span className="w-24">Joined</span>
                  <span className="w-10" />
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors">
                      {/* Avatar + Name */}
                      <div className="flex-1 flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-surface-tile-3 border border-white/[0.06] flex items-center justify-center shrink-0">
                          <span className="text-[13px] font-bold font-display text-white/80">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">{member.name}</p>
                          <p className="text-[11px] text-body-muted/50 font-mono truncate">{member.email}</p>
                        </div>
                      </div>

                      {/* Role */}
                      <div className="w-24 hidden sm:block">
                        <RoleSelect member={member} onClose={() => {}} />
                      </div>

                      {/* Status */}
                      <div className="w-20 hidden sm:block">
                        <StatusBadge status={member.status} />
                      </div>

                      {/* Joined Date */}
                      <div className="w-24 hidden sm:block">
                        <span className="text-[11px] text-body-muted/50 font-mono">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="w-10 flex justify-end">
                        {isAdmin && (
                          <button
                            onClick={() => setConfirmRemove(member.id)}
                            className="p-1.5 rounded-md text-body-muted/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Info Card ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-start gap-3"
          >
            <Sparkles className="w-4 h-4 text-primary-on-dark mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-white">Collaborative Team Management</p>
              <p className="text-[12px] text-body-muted/50 mt-1 leading-relaxed">
                Invite team members to collaborate on interviews. Admins can manage roles and permissions.
                All team actions are recorded and can be undone.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── Invite Modal ── */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* ── Confirm Remove ── */}
      <AnimatePresence>
        {confirmRemove && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease }}
              className="w-full max-w-sm rounded-xl border border-white/[0.06] bg-surface-tile-2 shadow-lg p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-white">Remove member?</h3>
                  <p className="text-[12px] text-body-muted/60 mt-0.5">
                    This will revoke their access to the team.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="ghost" onClick={() => setConfirmRemove(null)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    removeMember(confirmRemove);
                    setConfirmRemove(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none"
                >
                  Remove
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
