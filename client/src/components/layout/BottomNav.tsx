import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, AlertCircle, MessageSquare, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();

  const tabs = [
    { to: '/dashboard', label: t('nav.dashboard', 'Home'), icon: LayoutDashboard },
    { to: '/advisory/new', label: t('nav.advisory', 'Advise'), icon: FileText },
    { to: '/diagnose', label: t('nav.diagnose', 'Diagnose'), icon: AlertCircle },
    { to: '/assistant', label: t('nav.assistant', 'Assistant'), icon: MessageSquare },
    { to: '/history', label: t('nav.history', 'History'), icon: History },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1 flex items-center justify-around h-16 no-print"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors min-h-[44px] ${
                isActive ? 'text-leaf-600' : 'text-stone-500 hover:text-stone-900'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[64px]">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
