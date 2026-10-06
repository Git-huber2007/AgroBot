import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { FarmForm } from '../components/farm/FarmForm';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useActiveFarm, type Farm } from '../hooks/useActiveFarm';
import { useToast } from '../components/ui/Toast';
import type { FarmCreateInput } from '@cropsage/shared';

export const FarmDetail: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { refetchFarms } = useActiveFarm();
  const { success, error } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    data: farm,
    isLoading,
    isError,
  } = useQuery<Farm>({
    queryKey: queryKeys.farmDetail(farmId || ''),
    queryFn: () => api.get<Farm>(`/farms/${farmId}`),
    enabled: !!farmId,
  });

  const handleSubmit = async (data: FarmCreateInput) => {
    if (!farmId) return;
    setIsUpdating(true);
    try {
      await api.patch(`/farms/${farmId}`, data);
      await refetchFarms();
      success('Farm attributes updated successfully.');
      navigate('/farms');
    } catch (err: any) {
      error(err.message || 'Failed to update farm');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !farm) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-stone-900 font-display">Farm Not Found</h2>
        <p className="text-sm text-stone-600 mt-1 mb-6">
          The requested farm plot does not exist or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/farms')}
          className="px-4 py-2 bg-leaf-600 text-white rounded-lg text-sm font-bold"
        >
          Return to My Farms
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title={`Edit: ${farm.name}`}
        subtitle={`Location: ${farm.district}, ${farm.state}`}
        breadcrumbs={[
          { label: 'My Farms', to: '/farms' },
          { label: farm.name },
        ]}
      />

      <Card className="p-6 sm:p-8">
        <FarmForm initialValues={farm} onSubmit={handleSubmit} isLoading={isUpdating} />
      </Card>
    </div>
  );
};
