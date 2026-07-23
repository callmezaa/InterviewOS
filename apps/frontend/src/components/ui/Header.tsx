'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useInterviewStore } from '../../store/useInterviewStore';
import { useCommandPalette } from '../../store/useCommandPaletteStore';
import { useBranding } from '../providers/BrandingProvider';
import { isGuest } from '../../lib/guest';
import { LogOut, Terminal, User, ChevronDown, ShieldCheck, Award, Settings, Command, Sparkles, LogIn, FileText, LifeBuoy, BarChart3, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MobileNavDrawer } from './MobileNavDrawer';
import { ThemeToggle } from './ThemeToggle';
import { ConfirmDialog } from './ConfirmDialog';
import { Badge } from './Badge';
import { Tooltip } from './Tooltip';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  subTitle?: string;
  subActions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ subTitle, subActions }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, dashboardMode, setDashboardMode } = useInterviewStore();
  const branding = useBranding();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setDropdownOpen(false);
    setShowLogoutConfirm(false);
    router.push('/auth/login');
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-600 border-blue-500/30',
      'bg-primary border-primary/30',
      'bg-ink border-white/20',
      'bg-surface-tile-2 border-white/10',
      'bg-blue-700 border-blue-600/30',
      'bg-primary-focus border-primary/30',
      'bg-surface-tile-3 border-white/10',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const avatarBg = user?.name ? getAvatarColor(user.name) : 'bg-surface-tile-2';

  return (
    <header className="w-full flex flex-col z-[9990]">
      {/* 1. Global Navigation Bar (Apple global-nav style) */}
      <nav className="w-full h-11 bg-surface-black border-b border-white/[0.06] text-white flex items-center justify-between px-4 md:px-12 relative">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile hamburger button */}
          <Tooltip content="Menu" side="bottom">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg hover:bg-white/[0.04] transition-colors duration-200"
              aria-label="Open navigation menu"
            >
            <div className="flex flex-col gap-1">
              <span className={`block w-[18px] h-px bg-white/70 transition-all duration-200 ${mobileNavOpen ? 'rotate-45 translate-y-[2.5px]' : ''}`} />
              <span className={`block w-[18px] h-px bg-white/70 transition-all duration-200 ${mobileNavOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-[18px] h-px bg-white/70 transition-all duration-200 ${mobileNavOpen ? '-rotate-45 -translate-y-[2.5px]' : ''}`} />
            </div>
          </button>
          </Tooltip>

          <Link href="/dashboard" className="flex items-center gap-2.5 select-none group/logo shrink-0">
            <img
              src="/logo/logo_white.png"
              alt="InterviewOS"
              className="w-[22px] h-[22px] block shrink-0"
            />
            <span className="font-display font-semibold text-[14px] tracking-tight text-white/90 group-hover/logo:text-white transition-colors duration-200">
              InterviewOS
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-5 text-[12px] font-normal text-body-muted/80 tracking-tight">
          {(['Dashboard', 'Questions', 'Templates', 'Recordings'] as const).map((label) => {
            const href = `/${label.toLowerCase()}`;
            const isActive = href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={label}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'text-white' : 'hover:text-white transition-colors'}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Dashboard mode switcher */}
        <div className="hidden md:flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          {(['INTERVIEWER', 'CANDIDATE'] as const).map((m) => {
            const active = dashboardMode === m;
            return (
              <button
                key={m}
                onClick={() => setDashboardMode(m)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-white/[0.08] text-white'
                    : 'text-body-muted/50 hover:text-white/70'
                }`}
              >
                {m === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Tooltip content="Command Palette" shortcut="⌘K" side="bottom">
            <button
              onClick={() => useCommandPalette.getState().toggle()}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-body-muted/50 hover:text-white hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.12]"
              aria-label="Open command palette"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cmd+K</span>
            </button>
          </Tooltip>
          <ThemeToggle />
          <NotificationBell />

          {/* Help dropdown */}
          <div className="relative">
            <Tooltip content="Help & resources" side="bottom">
              <button
                onClick={() => setHelpOpen(!helpOpen)}
                className="w-7 h-7 rounded-lg text-[14px] font-semibold text-body-muted/50 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center justify-center"
                aria-label="Help and resources"
                aria-haspopup="true"
                aria-expanded={helpOpen}
              >
                ?
              </button>
            </Tooltip>
            <AnimatePresence>
              {helpOpen && (
                <>
                  <div onClick={() => setHelpOpen(false)} className="fixed inset-0 z-[9991]" />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-2 w-[180px] origin-top-right rounded-lg border border-white/[0.06] bg-surface-tile-2/95 backdrop-blur-md shadow-[var(--shadow-dropdown-lg)] z-[9992] overflow-hidden"
                  >
                    <div className="p-1.5 flex flex-col gap-0.5">
                      <Link
                        href="/docs"
                        onClick={() => setHelpOpen(false)}
                        className="w-full px-3 py-2 flex items-center gap-2.5 rounded-lg text-[12px] text-body-muted/80 hover:bg-white/[0.04] transition-colors duration-150"
                      >
                        <FileText className="w-3.5 h-3.5 text-body-muted/55" />
                        <span>Documentation</span>
                      </Link>
                      <Link
                        href="/support"
                        onClick={() => setHelpOpen(false)}
                        className="w-full px-3 py-2 flex items-center gap-2.5 rounded-lg text-[12px] text-body-muted/80 hover:bg-white/[0.04] transition-colors duration-150"
                      >
                        <LifeBuoy className="w-3.5 h-3.5 text-body-muted/55" />
                        <span>Support</span>
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {isGuest(user) ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group"
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-primary-on-dark">
                  <Sparkles className="w-3 h-3" />
                </div>
                <span className="hidden sm:inline text-[12px] text-primary-on-dark/80 font-medium">
                  Guest
                </span>
                <ChevronDown className="w-3 h-3 text-primary-on-dark/55 transition-transform duration-200 group-hover:text-primary-on-dark/80" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-[9991]" />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-2 w-[260px] origin-top-right rounded-lg border border-white/[0.06] bg-surface-tile-2/95 backdrop-blur-md shadow-[var(--shadow-dropdown-lg)] z-[9992] overflow-hidden"
                    >
                      <div className="px-4 py-4 border-b border-white/[0.06] flex flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary-on-dark" />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-white leading-none">Demo Mode</p>
                            <p className="text-[10px] text-body-muted/40 leading-none mt-0.5">Exploring as guest</p>
                          </div>
                        </div>
                        <Link
                          href="/auth/register"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-on-primary text-[12px] font-medium hover:bg-primary-focus transition-colors"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Create Free Account</span>
                        </Link>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full px-3 py-2 flex items-center justify-between text-left rounded-lg text-[12px] text-body-muted/60 hover:bg-white/[0.04] transition-colors duration-150"
                        >
                          <span>Exit Demo</span>
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                className="flex items-center gap-2.5 px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-5.5 h-5.5 rounded-full object-cover" />
                ) : (
                  <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-semibold border ${avatarBg}`}>
                    {initial}
                  </div>
                )}
                <span className="hidden sm:inline text-[12px] text-body-muted/80 font-medium">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-body-muted/55 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-[9991]" />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-2 w-[240px] origin-top-right rounded-lg border border-white/[0.06] bg-surface-tile-2/95 backdrop-blur-md shadow-[var(--shadow-dropdown-lg)] z-[9992] overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/[0.06] flex flex-col gap-1">
                        <p className="text-[13px] font-semibold text-white leading-none">{user.name}</p>
                        <p className="text-[11px] text-body-muted/50 leading-none">{user.email || 'user@interviewos.com'}</p>
                        <div className="mt-2 flex">
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
                      <div className="p-1.5 flex flex-col gap-0.5 border-b border-white/[0.06]">
                        <Link
                          href="/analytics"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full px-3 py-2 flex items-center justify-between text-left rounded-lg text-[12px] text-body-muted/80 hover:bg-white/[0.04] transition-colors duration-150"
                        >
                          <span>Analytics</span>
                          <BarChart3 className="w-3.5 h-3.5 text-body-muted/55" />
                        </Link>
                        <Link
                          href="/team"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full px-3 py-2 flex items-center justify-between text-left rounded-lg text-[12px] text-body-muted/80 hover:bg-white/[0.04] transition-colors duration-150"
                        >
                          <span>Team</span>
                          <Users className="w-3.5 h-3.5 text-body-muted/55" />
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full px-3 py-2 flex items-center justify-between text-left rounded-lg text-[12px] text-body-muted/80 hover:bg-white/[0.04] transition-colors duration-150"
                        >
                          <span>System Settings</span>
                          <Settings className="w-3.5 h-3.5 text-body-muted/55" />
                        </Link>
                      </div>
                      <div className="p-1.5 flex flex-col gap-0.5">
                        <button
                          onClick={handleLogout}
                          className="w-full px-3 py-2 flex items-center justify-between text-left rounded-lg text-[12px] text-red-400 hover:bg-red-500/10 transition-colors duration-150"
                        >
                          <span>Sign Out</span>
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/auth/login" className="text-[12px] text-primary-on-dark hover:underline">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* 2. Sub Navigation Bar (Apple sub-nav-frosted style) */}
      {subTitle && (
        <div className="w-full min-h-[48px] sm:h-[52px] sticky top-0 bg-surface-tile-3/80 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-3 sm:px-12 gap-2">
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <h2 className="font-sans font-semibold text-sm sm:text-h3 text-white truncate max-w-[120px] sm:max-w-none">
              {subTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-nowrap py-1.5 sm:py-0">
            {subActions}
          </div>
        </div>
      )}

      <MobileNavDrawer isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title={`Sign out of ${branding.name}?`}
        description="You will be redirected to the login page and your active session will end."
        confirmText="Sign Out"
        variant="danger"
      />
    </header>
  );
};

