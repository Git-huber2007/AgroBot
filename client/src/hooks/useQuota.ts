import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from './useAuth';

export interface UsageData {
  used: number;
  limit: number;
}

export function useQuota() {
  const { session } = useAuth();

  const { data, isLoading, refetch } = useQuery<UsageData>({
    queryKey: queryKeys.usageToday,
    queryFn: () => api.get<UsageData>('/usage/today'),
    enabled: !!session,
    refetchInterval: 1000 * 60, // Refresh every minute
  });

  const used = data?.used ?? 0;
  const limit = data?.limit ?? 60;
  const remaining = Math.max(0, limit - used);

  return {
    used,
    limit,
    remaining,
    isLoading,
    refetch,
  };
}
