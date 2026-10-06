import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { PageHeader } from '../components/layout/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { AdvisoryReportView, type AdvisoryRecord } from '../components/advisory/AdvisoryReportView';

export const AdvisoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: advisory,
    isLoading,
    isError,
  } = useQuery<AdvisoryRecord>({
    queryKey: queryKeys.advisoryDetail(id || ''),
    queryFn: () => api.get<AdvisoryRecord>(`/advisories/${id}`),
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

  if (isError || !advisory) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 font-display">Advisory Not Found</h2>
        <p className="text-sm text-stone-600">
          The requested advisory could not be found or you do not have permission to view it.
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
        title={`Crop Advisory: ${advisory.crop?.name_en || 'Crop'}`}
        subtitle={`Stage: ${advisory.result.crop_stage.name} • Plot: ${advisory.farm?.name}`}
        breadcrumbs={[
          { label: 'Advisories', to: '/history' },
          { label: advisory.crop?.name_en || 'Report' },
        ]}
      />

      <AdvisoryReportView advisory={advisory} />
    </div>
  );
};
