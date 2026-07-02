'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface TableContextValue {
  striped?: boolean;
  hover?: boolean;
}

const TableContext = createContext<TableContextValue>({});

function useTableContext() {
  return useContext(TableContext);
}

export interface TableProps {
  className?: string;
  children: React.ReactNode;
  striped?: boolean;
  hover?: boolean;
}

export function Table({ className, children, striped = false, hover = false }: TableProps) {
  return (
    <TableContext.Provider value={{ striped, hover }}>
      <div className="w-full overflow-auto">
        <table
          className={twMerge('w-full border-collapse font-sans text-[13px]', className)}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export interface TableHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function TableHeader({ className, children }: TableHeaderProps) {
  return (
    <thead className={twMerge('border-b border-white/[0.06]', className)}>
      {children}
    </thead>
  );
}

export interface TableBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function TableBody({ className, children }: TableBodyProps) {
  const { striped } = useTableContext();
  const items = React.Children.toArray(children);

  return (
    <tbody className={twMerge(
      striped && '[&>*:nth-child(even)]:bg-white/[0.01]',
      className,
    )}>
      {items}
    </tbody>
  );
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string;
  children: React.ReactNode;
}

export function TableRow({ className, children, ...props }: TableRowProps) {
  const { hover } = useTableContext();

  return (
    <tr
      className={twMerge(
        'transition-colors duration-150',
        hover && 'hover:bg-white/[0.03]',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | false;
  onSort?: () => void;
  children: React.ReactNode;
}

export function TableHead({ className, sortable, sortDirection, onSort, children }: TableHeadProps) {
  const Component = sortable ? 'button' : 'div';
  const handleClick = useCallback(() => {
    if (sortable && onSort) onSort();
  }, [sortable, onSort]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (sortable && onSort && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSort();
    }
  }, [sortable, onSort]);

  return (
    <th
      className={twMerge(
        'px-4 py-2.5 text-left text-[11px] font-semibold tracking-tight text-body-muted/55 font-mono select-none',
        sortable && 'p-0',
        className,
      )}
      aria-sort={sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : undefined}
    >
      <Component
        role={sortable ? 'columnheader' : undefined}
        tabIndex={sortable ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={clsx(
          'flex items-center gap-1.5',
          sortable && 'w-full cursor-pointer px-4 py-2.5 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-inset rounded',
          !sortable && 'w-full',
        )}
      >
        <span className="truncate">{children}</span>
        {sortable && (
          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 shrink-0" />
            : sortDirection === 'desc' ? <ArrowDown className="h-3 w-3 shrink-0" />
            : <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40" />
        )}
      </Component>
    </th>
  );
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  className?: string;
  children: React.ReactNode;
}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td
      className={twMerge('px-4 py-2.5 text-white/80 align-middle', className)}
      {...props}
    >
      {children}
    </td>
  );
}

export interface TableCaptionProps {
  className?: string;
  children: React.ReactNode;
}

export function TableCaption({ className, children }: TableCaptionProps) {
  return (
    <caption className={twMerge('mt-2 text-[11px] text-body-muted/50 font-mono text-left', className)}>
      {children}
    </caption>
  );
}
