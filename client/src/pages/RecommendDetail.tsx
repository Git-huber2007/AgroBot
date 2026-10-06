import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { PageHeader } from '../components/layout/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import {
  RecommendationResultView,
  type RecommendationRecord,
} from '../components/recommendation/RecommendationResultView';

export const RecommendDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: recommendation,
    isLoading,
    isError,
  } = useQuery<RecommendationRecord>({
    queryKey: queryKeys.recommendationDetail(id || ''),
    queryFn: () => api.get<RecommendationRecord>(`/recommendations/${id}`),
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

  if (isError || !recommendation) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 font-display">
          Recommendation Not Found
        </h2>
        <p className="text-sm text-stone-600">
          The requested recommendation record could not be found.
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
        title={`Crop Plan: ${recommendation.season.toUpperCase()}`}
        subtitle={`Target Farm: ${recommendation.farm?.name} • Sowing Month: ${recommendation.sowing_month}`}
        breadcrumbs={[
          { label: 'Recommendations', to: '/history' },
          { label: `${recommendation.season.toUpperCase()} Plan` },
        ]}
      />

      <RecommendationResultView recommendation={recommendation} />
    </div>
  );
};
