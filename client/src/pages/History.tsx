import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  History as HistoryIcon,
  Trash2,
  Filter,
  ArrowRight,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sprout,
} from 'lucide-react';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useActiveFarm } from '../hooks/useActiveFarm';
import { useToast } from '../components/ui/Toast';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Dialog } from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDateTime } from '../lib/formatters';

export const History: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { farms } = useActiveFarm();
  const { success, error } = useToast();

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [farmFilter, setFarmFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading } = useQuery<{
    items: Array<{
      id: string;
      record_type: string;
      farm_id: string | null;
      crop_id: number | null;
      title_hint: string | null;
      created_at: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }>({
    queryKey: queryKeys.history({ type: typeFilter, farmId: farmFilter, page }),
    queryFn: () =>
      api.get('/history', {
        params: {
          type: typeFilter || undefined,
          farmId: farmFilter || undefined,
          page,
          pageSize: 20,
        },
      }),
  });

  const items = Array.isArray(data) ? data : data?.items || [];
  const total = Array.isArray(data) ? data.length : data?.total || 0;
  const totalPages = Math.ceil(total / 20) || 1;

  const getRecordLink = (type: string, id: string) => {
    switch (type) {
      case 'crop_advisory':
        return `/advisory/${id}`;
      case 'crop_recommendation':
        return `/recommend/${id}`;
      case 'pest_diagnosis':
        return `/diagnose/${id}`;
      case 'fertilizer_plan':
        return `/fertilizer/${id}`;
      default:
        return `/history`;
    }
  };

  const getRecordBadge = (type: string) => {
    switch (type) {
      case 'crop_advisory':
        return <Badge variant="leaf">Advisory</Badge>;
      case 'crop_recommendation':
        return <Badge variant="sun">Recommendation</Badge>;
      case 'pest_diagnosis':
        return <Badge variant="red">Pest Diagnosis</Badge>;
      case 'fertilizer_plan':
        return <Badge variant="blue">Fertilizer Plan</Badge>;
      default:
        return <Badge variant="gray">{type}</Badge>;
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      let endpoint = '';
      switch (itemToDelete.type) {
        case 'crop_advisory':
          endpoint = `/advisories/${itemToDelete.id}`;
          break;
        case 'crop_recommendation':
          endpoint = `/recommendations/${itemToDelete.id}`;
          break;
        case 'pest_diagnosis':
          endpoint = `/diagnoses/${itemToDelete.id}`;
          break;
        case 'fertilizer_plan':
          endpoint = `/fertilizer-plans/${itemToDelete.id}`;
          break;
      }

      await api.delete(endpoint);
      queryClient.invalidateQueries({ queryKey: ['history'] });
      success('Record deleted.');
      setItemToDelete(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Advisory & Agronomy History"
        subtitle="Review past stage advisories, pest diagnoses, and soil-test fertilizer schedules."
      />

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3 bg-white">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase shrink-0">
          <Filter className="w-4 h-4 text-stone-400" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Record Types</option>
            <option value="crop_advisory">Crop Advisories</option>
            <option value="pest_diagnosis">Pest & Disease Diagnoses</option>
            <option value="fertilizer_plan">Fertilizer Plans</option>
            <option value="crop_recommendation">Seasonal Recommendations</option>
          </Select>

          <Select
            value={farmFilter}
            onChange={(e) => {
              setFarmFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Farm Plots</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.district})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Items Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center bg-white border-dashed border-2 border-stone-200">
          <HistoryIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900 font-display">No Records Found</h3>
          <p className="text-sm text-stone-600 max-w-sm mx-auto mt-1">
            No past advisories match your selected filters. Try changing or clearing filters.
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden divide-y divide-stone-100 bg-white shadow-subtle">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 sm:p-5 hover:bg-stone-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                {getRecordBadge(item.record_type)}
                <div className="min-w-0">
                  <Link
                    to={getRecordLink(item.record_type, item.id)}
                    className="text-base font-bold text-stone-900 hover:text-leaf-700 transition-colors line-clamp-1"
                  >
                    {item.title_hint || 'Agronomic Report'}
                  </Link>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={getRecordLink(item.record_type, item.id)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                  title="Open Report"
                  aria-label="Open report"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setItemToDelete({ id: item.id, type: item.record_type })}
                  className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete Record"
                  aria-label="Delete report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-stone-500">
            Page {page} of {totalPages} ({total} total records)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Record Dialog */}
      <Dialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Delete Record?"
        description="Are you sure you want to permanently delete this report from your history?"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setItemToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
            Delete Permanently
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
