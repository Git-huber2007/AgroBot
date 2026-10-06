import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { PageHeader } from '../components/layout/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import {
  DiagnosisResultView,
  type DiagnosisRecord,
} from '../components/diagnosis/DiagnosisResultView';
import { useActiveFarm } from '../hooks/useActiveFarm';

export const DiagnoseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeFarm } = useActiveFarm();

  const {
    data: diagnosis,
    isLoading,
    isError,
  } = useQuery<DiagnosisRecord>({
    queryKey: queryKeys.diagnosisDetail(id || ''),
    queryFn: () => api.get<DiagnosisRecord>(`/diagnoses/${id}`),
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

  if (isError || !diagnosis) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 font-display">Diagnosis Not Found</h2>
        <p className="text-sm text-stone-600">
          The requested diagnosis record could not be found or has expired.
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

  const isOrganic = activeFarm?.farming_practice === 'organic' || activeFarm?.farming_practice === 'natural';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Diagnosis: ${diagnosis.result.primary_diagnosis.name}`}
        subtitle={`Crop: ${diagnosis.crop?.name_en || 'Plant'} • Part: ${diagnosis.affected_part}`}
        breadcrumbs={[
          { label: 'Diagnoses', to: '/history' },
          { label: diagnosis.result.primary_diagnosis.name },
        ]}
      />

      <DiagnosisResultView diagnosis={diagnosis} isOrganicPractice={isOrganic} />
    </div>
  );
};
