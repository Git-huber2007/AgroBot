import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from './AuthProvider';

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  state: string;
  district: string;
  village: string | null;
  latitude: number | null;
  longitude: number | null;
  area_value: number;
  area_unit: 'acre' | 'hectare' | 'bigha' | 'guntha';
  area_hectares: number;
  soil_type: string;
  irrigation_source: string;
  water_availability: 'scarce' | 'moderate' | 'adequate';
  farming_practice: 'conventional' | 'organic' | 'natural';
  soil_n?: number | null;
  soil_p?: number | null;
  soil_k?: number | null;
  soil_ph?: number | null;
  soil_oc?: number | null;
  soil_ec?: number | null;
  soil_test_date?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface ActiveFarmContextType {
  activeFarm: Farm | null;
  activeFarmId: string | null;
  setActiveFarmId: (id: string) => void;
  farms: Farm[];
  isLoading: boolean;
  refetchFarms: () => Promise<any>;
}

const ActiveFarmContext = createContext<ActiveFarmContextType>({
  activeFarm: null,
  activeFarmId: null,
  setActiveFarmId: () => {},
  farms: [],
  isLoading: false,
  refetchFarms: async () => {},
});

const STORAGE_KEY = 'cropsage_active_farm_id';

export const ActiveFarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [activeFarmId, setActiveFarmIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const {
    data: farms = [],
    isLoading,
    refetch,
  } = useQuery<Farm[]>({
    queryKey: queryKeys.farms,
    queryFn: () => api.get<Farm[]>('/farms'),
    enabled: !!session,
  });

  const setActiveFarmId = (id: string) => {
    setActiveFarmIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  useEffect(() => {
    if (farms.length > 0) {
      // If current activeFarmId is not in the list, or none selected, pick default or first
      const exists = farms.some((f) => f.id === activeFarmId);
      if (!exists) {
        const defaultFarm = farms.find((f) => f.is_default) || farms[0];
        if (defaultFarm) {
          setActiveFarmId(defaultFarm.id);
        }
      }
    } else {
      setActiveFarmIdState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [farms, activeFarmId]);

  const activeFarm = farms.find((f) => f.id === activeFarmId) || null;

  return (
    <ActiveFarmContext.Provider
      value={{
        activeFarm,
        activeFarmId,
        setActiveFarmId,
        farms,
        isLoading,
        refetchFarms: refetch,
      }}
    >
      {children}
    </ActiveFarmContext.Provider>
  );
};

export function useActiveFarm(): ActiveFarmContextType {
  return useContext(ActiveFarmContext);
}
