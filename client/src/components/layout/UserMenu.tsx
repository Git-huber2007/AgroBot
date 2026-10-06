import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const UserMenu: React.FC = () => {
  const { profile, user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Farmer';

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 p-1.5 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors min-h-[44px]"
      >
        <div className="w-8 h-8 rounded-full bg-leaf-100 text-leaf-800 font-bold flex items-center justify-center text-sm border border-leaf-200">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:inline text-sm font-semibold text-stone-800 max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-floating border border-stone-200 py-1.5 z-40 animate-fadeIn">
          <div className="px-3.5 py-2 border-b border-stone-100">
            <p className="text-sm font-bold text-stone-900 truncate">{displayName}</p>
            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                navigate('/settings');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-stone-500" />
              <span>{t('nav.settings', 'Settings')}</span>
            </button>
          </div>

          <div className="border-t border-stone-100 pt-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>{t('nav.logout', 'Sign Out')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
