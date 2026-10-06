import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Plus, Check } from 'lucide-react';
import { useActiveFarm } from '../../hooks/useActiveFarm';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const FarmSwitcher: React.FC = () => {
  const { activeFarm, farms, setActiveFarmId } = useActiveFarm();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (farms.length === 0) {
    return (
      <button
        onClick={() => navigate('/farms/new')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-leaf-800 bg-leaf-50 hover:bg-leaf-100 rounded-lg border border-leaf-200 transition-colors min-h-[44px]"
      >
        <Plus className="w-4 h-4" />
        <span>{t('farms.addNew', 'Add Farm')}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-100/80 hover:bg-stone-200/80 rounded-lg border border-stone-200 transition-colors min-h-[44px]"
      >
        <MapPin className="w-4 h-4 text-leaf-600 shrink-0" />
        <span className="truncate max-w-[130px] sm:max-w-[180px] text-left">
          {activeFarm ? activeFarm.name : t('farms.select', 'Select Farm')}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-floating border border-stone-200 py-1.5 z-40 animate-fadeIn">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase text-stone-400">
            {t('farms.title', 'My Farms')}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {farms.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFarmId(f.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-stone-50 transition-colors ${
                  activeFarm?.id === f.id ? 'bg-leaf-50/60 font-semibold text-leaf-900' : 'text-stone-700'
                }`}
              >
                <div className="truncate mr-2">
                  <p className="truncate">{f.name}</p>
                  <p className="text-xs text-stone-500 truncate">
                    {f.district}, {f.state}
                  </p>
                </div>
                {activeFarm?.id === f.id && <Check className="w-4 h-4 text-leaf-600 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="border-t border-stone-100 mt-1 pt-1">
            <button
              onClick={() => {
                navigate('/farms/new');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-leaf-700 hover:bg-leaf-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('farms.addNew', 'Add New Farm')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
