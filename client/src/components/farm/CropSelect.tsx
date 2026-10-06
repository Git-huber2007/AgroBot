import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { Search } from 'lucide-react';

export interface Crop {
  id: number;
  name_en: string;
  name_hi: string;
  scientific_name: string | null;
  category: string;
  seasons: string[];
  duration_days_min: number;
  duration_days_max: number;
  growth_stages: Array<{
    key: string;
    label_en: string;
    day_start: number;
    day_end: number;
  }>;
  water_requirement: string;
  npk_recommendation_kg_ha: {
    N: number;
    P2O5: number;
    K2O: number;
  };
}

export interface CropSelectProps {
  value?: number;
  onChange: (cropId: number, crop: Crop) => void;
  category?: string;
  season?: string;
  hasError?: boolean;
}

export const CropSelect: React.FC<CropSelectProps> = ({
  value,
  onChange,
  category,
  season,
  hasError,
}) => {
  const [search, setSearch] = useState('');

  const { data: crops = [], isLoading } = useQuery<Crop[]>({
    queryKey: queryKeys.crops({ category, season }),
    queryFn: () => api.get<Crop[]>('/crops', { params: { category, season } }),
  });

  const filteredCrops = crops.filter(
    (c) =>
      c.name_en.toLowerCase().includes(search.toLowerCase()) ||
      c.name_hi.includes(search) ||
      (c.scientific_name && c.scientific_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter crops (e.g. Paddy, Wheat, Tomato)..."
          className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-leaf-200 focus:border-leaf-600"
        />
      </div>

      <select
        value={value ?? ''}
        onChange={(e) => {
          const selectedId = Number(e.target.value);
          const found = crops.find((c) => c.id === selectedId);
          if (found) onChange(selectedId, found);
        }}
        disabled={isLoading}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[44px] transition-colors ${
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/20'
            : 'border-stone-300 focus:border-leaf-600 focus:ring-leaf-200 bg-white'
        }`}
      >
        <option value="">-- Choose a crop --</option>
        {filteredCrops.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name_en} ({c.name_hi}) — {c.category}
          </option>
        ))}
      </select>
    </div>
  );
};
