'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  LayoutDashboard,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
  ShieldCheck,
  Award,
  ChevronRight,
  Sparkles,
  Video,
  BarChart3,
} from 'lucide-react';
import { useInterviewStore } from '../../store/useInterviewStore';
import { useBranding } from '../providers/BrandingProvider';
import { ConfirmDialog } from './ConfirmDialog';
import { Badge } from './Badge';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/templates', label: 'Templates', icon: Sparkles },
  { href: '/recordings', label: 'Recordings', icon: Video },
  { href: '/docs', label: 'Docs', icon: FileText },
  { href: '/support', label: 'Support', icon: HelpCircle },
];

const ease = [0.22, 1, 0.36, 1] as const;

const overlayVariants = {
  closed: { opacity: 0, transition: { duration: 0.3, ease } },
  open: { opacity: 1, transition: { duration: 0.3, ease } },
};

const drawerVariants = {
  closed: {
    x: '-100%',
    transition: { duration: 0.35, ease },
  },
  open: {
    x: 0,
    transition: { duration: 0.4, ease },
  },
};

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useInterviewStore();
  const branding = useBranding();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    onClose();
    setShowLogoutConfirm(false);
    router.push('/auth/login');
  };

  const handleNav = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="drawer-overlay"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={onClose}
            className="fixed inset-0 z-[9993] bg-black/60 backdrop-blur-sm md:hidden"
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer-panel"
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 left-0 z-[9994] h-full w-[280px] bg-surface-tile-2/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col md:hidden"
          >
            {/* Logo section */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06] shrink-0">
              <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={branding.name} className="w-4 h-4 object-contain" />
                ) : (
                  <Terminal className="w-4 h-4" style={{ color: branding.primaryColor }} />
                )}
                <span className="font-display font-semibold text-[14px] tracking-tight text-white">
                  {branding.name}
                </span>
              </Link>
            </div>

            {/* User profile card */}
            {user && (
              <div className="px-4 py-4 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[14px] font-semibold text-white shrink-0">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-semibold text-white truncate">{user.name}</span>
                    <span className="text-[11px] text-body-muted/50 truncate">{user.email}</span>
                    <div className="mt-1">
                      {user.role === 'INTERVIEWER' ? (
                        <Badge variant="primary" size="sm">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Interviewer
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          <Award className="w-2.5 h-2.5" />
                          Candidate
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="flex flex-col gap-1">
                <span className="px-3 py-1 text-[10px] font-mono font-semibold text-body-muted/50">
                  Navigation
                </span>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNav(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-primary/10 text-primary-on-dark border border-primary/20'
                          : 'text-body-muted/70 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Bottom actions */}
            <div className="border-t border-white/[0.06] px-3 py-3 shrink-0">
              {user && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleNav('/settings')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-body-muted/70 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="flex-1">Settings</span>
                    <ChevronRight className="w-3.5 h-3.5 text-body-muted/50" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title={`Sign out of ${branding.name}?`}
        description="You will be redirected to the login page and your active session will end."
        confirmText="Sign Out"
        variant="danger"
      />
    </AnimatePresence>
  );
};
