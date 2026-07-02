'use client';

import React, { createContext, useContext, useCallback, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TabsContextValue {
  value: string;
  onSelect: (value: string) => void;
  baseId: string;
  variant: 'underline' | 'pills';
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>');
  return ctx;
}

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, variant = 'underline', className, children }: TabsProps) {
  const baseId = useId();
  const ctx: TabsContextValue = { value, onSelect: onValueChange, baseId, variant };
  return (
    <TabsContext.Provider value={ctx}>
      <div className={twMerge('flex flex-col', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabListProps {
  className?: string;
  children: React.ReactNode;
}

export function TabList({ className, children }: TabListProps) {
  const { variant } = useTabsContext();

  return (
    <div
      role="tablist"
      className={twMerge(clsx(
        'flex shrink-0',
        variant === 'underline'
          ? 'gap-0 border-b border-white/[0.06]'
          : 'gap-1',
        className,
      ))}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps {
  value: string;
  disabled?: boolean;
  icon?: React.ElementType;
  badge?: number;
  className?: string;
  children: React.ReactNode;
}

export function TabTrigger({ value, disabled, icon: Icon, badge, className, children }: TabTriggerProps) {
  const ctx = useTabsContext();
  const isActive = ctx.value === value;

  const handleClick = useCallback(() => {
    if (!disabled) ctx.onSelect(value);
  }, [ctx, value, disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const list = e.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const tabs = list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])');
    const idx = Array.from(tabs).indexOf(e.currentTarget as HTMLButtonElement);

    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;

    e.preventDefault();
    tabs[next].click();
    tabs[next].focus();
  }, []);

  return (
    <button
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={twMerge(clsx(
        'flex items-center gap-1.5 font-sans font-medium transition-all duration-150 shrink-0',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-inset',
        ctx.variant === 'underline' && [
          'px-3 py-2 text-[13px] border-b-2 -mb-px',
          isActive
            ? 'text-white border-primary'
            : 'text-body-muted/55 border-transparent hover:text-body-muted hover:border-white/[0.12]',
        ],
        ctx.variant === 'pills' && [
          'px-3 py-1.5 text-[13px] rounded-md',
          isActive
            ? 'text-white bg-primary/10 border border-primary/20'
            : 'text-body-muted/55 border border-transparent hover:text-body-muted hover:bg-white/[0.04]',
        ],
        disabled && 'opacity-40 pointer-events-none',
        className,
      ))}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-pill bg-primary text-white leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}

export interface TabContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabContent({ value, className, children }: TabContentProps) {
  const ctx = useTabsContext();
  const isActive = ctx.value === value;

  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      hidden={!isActive}
      className={twMerge('flex-1 min-h-0', !isActive && 'hidden', className)}
    >
      {children}
    </div>
  );
}
