import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { PageHeader } from '../components/layout/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import {
  FertilizerPlanView,
  type FertilizerRecord,
} from '../components/fertilizer/FertilizerPlanView';

export const FertilizerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery<FertilizerRecord>({
    queryKey: queryKeys.fertilizerDetail(id || ''),
    queryFn: () => api.get<FertilizerRecord>(`/fertilizer-plans/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 font-display">Fertilizer Plan Not Found</h2>
        <p className="text-sm text-stone-600">
          The requested fertilizer plan could not be found or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/history')}
          className="px-4 py-2 bg-leaf-600 text-white rounded-lg text-sm font-bold"
        >
          View Advisory History
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Fertilizer Plan: ${plan.crop?.name_en || 'Crop'}`}
        subtitle={`Farm: ${plan.farm?.name} • Area: ${plan.area_hectares} ha`}
        breadcrumbs={[
          { label: 'Fertilizers', to: '/history' },
          { label: `${plan.crop?.name_en || 'Plan'} Schedule` },
        ]}
      />

      <FertilizerPlanView plan={plan} />
    </div>
  );
};
