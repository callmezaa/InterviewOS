import { create } from 'zustand';
import { api } from '../lib/api';
import { toast } from './useToastStore';
import { optimisticMutate } from '../lib/optimistic';
import { useActionHistory } from './useActionHistoryStore';

export type TeamRole = 'admin' | 'interviewer' | 'viewer';
export type MemberStatus = 'active' | 'invited';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  status: MemberStatus;
  avatarUrl?: string | null;
  joinedAt: string;
}

interface TeamState {
  members: TeamMember[];
  loading: boolean;
  inviting: boolean;

  fetchMembers: () => Promise<void>;
  inviteMember: (email: string, role: TeamRole) => Promise<void>;
  updateRole: (memberId: string, role: TeamRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  addLocalMember: (member: TeamMember) => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  loading: false,
  inviting: false,

  fetchMembers: async () => {
    set({ loading: true });
    try {
      const data = await api.get<TeamMember[]>('/team/members');
      set({ members: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  inviteMember: async (email, role) => {
    set({ inviting: true });
    let createdId: string | null = null;
    try {
      const res = await api.post<{ id: string }>('/team/invite', { email, role });
      createdId = res.id;
      useActionHistory.getState().pushAction({
        type: 'team:invited',
        label: 'Invitation sent',
        description: `${email} has been invited as ${role}.`,
        undo: async () => {
          if (!createdId) throw new Error('No invite ID');
          await api.del(`/team/invitations/${createdId}`);
        },
      });
      get().fetchMembers();
    } catch {
      toast.error('Invitation failed', `Could not invite ${email}. Please try again.`);
    } finally {
      set({ inviting: false });
    }
  },

  updateRole: async (memberId, role) => {
    const prev = get().members.find((m) => m.id === memberId);
    if (!prev) return;

    await optimisticMutate(
      () => api.patch(`/team/members/${memberId}`, { role }),
      {
        optimisticUpdate: () => {
          set((s) => ({
            members: s.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
          }));
        },
        rollback: () => {
          set((s) => ({
            members: s.members.map((m) => (m.id === memberId ? prev : m)),
          }));
        },
        undoConfig: {
          label: 'Role updated',
          description: `${prev.name} is now ${role}.`,
          undo: async () => {
            await api.patch(`/team/members/${memberId}`, { role: prev.role });
            set((s) => ({
              members: s.members.map((m) => (m.id === memberId ? { ...m, role: prev.role } : m)),
            }));
          },
        },
        errorMessage: 'Could not update member role.',
      },
    );
  },

  removeMember: async (memberId) => {
    const member = get().members.find((m) => m.id === memberId);
    if (!member) return;

    await optimisticMutate(
      () => api.del(`/team/members/${memberId}`),
      {
        optimisticUpdate: () => {
          set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));
        },
        rollback: () => {
          set((s) => ({ members: [...s.members, member] }));
        },
        undoConfig: {
          label: 'Member removed',
          description: `${member.name} has been removed from the team.`,
          undo: async () => {
            await api.post('/team/members', member);
            set((s) => ({ members: [...s.members, member] }));
          },
        },
        errorMessage: 'Could not remove member.',
      },
    );
  },

  addLocalMember: (member) => {
    set((s) => ({ members: [...s.members, member] }));
  },
}));
