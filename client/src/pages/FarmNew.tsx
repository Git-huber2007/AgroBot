import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { FarmForm } from '../components/farm/FarmForm';
import { api } from '../lib/api';
import { useActiveFarm, type Farm } from '../hooks/useActiveFarm';
import { useToast } from '../components/ui/Toast';
import type { FarmCreateInput } from '@cropsage/shared';

export const FarmNew: React.FC = () => {
  const navigate = useNavigate();
  const { refetchFarms, setActiveFarmId } = useActiveFarm();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: FarmCreateInput) => {
    setIsLoading(true);
    try {
      const created = await api.post<Farm>('/farms', data);
      await refetchFarms();
      setActiveFarmId(created.id);
      success(`Farm "${created.name}" created successfully!`);
      navigate('/farms');
    } catch (err: any) {
      error(err.message || 'Failed to create farm');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Add New Farm Plot"
        subtitle="Provide plot location, area, and soil characteristics."
        breadcrumbs={[
          { label: 'My Farms', to: '/farms' },
          { label: 'New Farm' },
        ]}
      />

      <Card className="p-6 sm:p-8">
        <FarmForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
};
