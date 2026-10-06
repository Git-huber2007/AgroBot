import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Menu } from 'lucide-react';
import { FarmSwitcher } from './FarmSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { QuotaBadge } from './QuotaBadge';
import { UserMenu } from './UserMenu';

export interface TopBarProps {
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between gap-3">
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:p-3 focus:bg-leaf-700 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-leaf-600 flex items-center justify-center text-white shadow-sm group-hover:bg-leaf-700 transition-colors">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-lg sm:text-xl text-stone-900 tracking-tight">
            Crop<span className="text-leaf-600">Sage</span>
          </span>
        </Link>

        <div className="hidden sm:block h-5 w-[1px] bg-stone-200 mx-1" />

        <FarmSwitcher />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <QuotaBadge />
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
};
