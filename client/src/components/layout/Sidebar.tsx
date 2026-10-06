import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  FileText,
  Compass,
  AlertCircle,
  Calculator,
  MessageSquare,
  History,
  Settings,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { to: '/farms', label: t('nav.farms', 'My Farms'), icon: MapPin },
    { to: '/advisory/new', label: t('nav.advisory', 'Crop Advisory'), icon: FileText },
    { to: '/recommend', label: t('nav.recommend', 'Recommend Crops'), icon: Compass },
    { to: '/diagnose', label: t('nav.diagnose', 'Pest & Disease'), icon: AlertCircle },
    { to: '/fertilizer', label: t('nav.fertilizer', 'Fertilizer Calculator'), icon: Calculator },
    { to: '/assistant', label: t('nav.assistant', 'AI Assistant'), icon: MessageSquare },
    { to: '/history', label: t('nav.history', 'History'), icon: History },
    { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-stone-50 border-r border-stone-200/80 p-4">
      <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b border-stone-200">
        <span className="font-display font-bold text-stone-900 text-sm">Navigation</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-stone-500 hover:bg-stone-200 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                  isActive
                    ? 'bg-leaf-600 text-white shadow-sm'
                    : 'text-stone-750 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-stone-200/80">
        <div className="bg-leaf-50/70 rounded-xl p-3 border border-leaf-100">
          <p className="text-xs font-semibold text-leaf-900 mb-0.5">Need field assistance?</p>
          <p className="text-[11px] text-leaf-700 leading-tight">
            Call Kisan Call Centre at <span className="font-bold">1800-180-1551</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-slideRight">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
