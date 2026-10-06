import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MapPin, Check, Trash2, Edit2, Droplets, Sprout } from 'lucide-react';
import { useActiveFarm, type Farm } from '../hooks/useActiveFarm';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { formatArea } from '../lib/formatters';

export const Farms: React.FC = () => {
  const { farms, activeFarmId, setActiveFarmId, refetchFarms } = useActiveFarm();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSetDefault = async (farm: Farm) => {
    try {
      await api.patch(`/farms/${farm.id}`, { is_default: true });
      setActiveFarmId(farm.id);
      await refetchFarms();
      success(`"${farm.name}" set as default active farm.`);
    } catch (err: any) {
      error(err.message || 'Failed to update default farm');
    }
  };

  const handleDelete = async () => {
    if (!farmToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/farms/${farmToDelete.id}`);
      await refetchFarms();
      success(`Farm "${farmToDelete.name}" deleted successfully.`);
      setFarmToDelete(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete farm');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Farms & Plots"
        subtitle="Manage your registered agricultural plots, soil attributes, and irrigation setups."
        actions={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/farms/new')}
          >
            Add New Farm
          </Button>
        }
      />

      {farms.length === 0 ? (
        <Card className="p-12 text-center bg-white border-dashed border-2 border-stone-200">
          <MapPin className="w-12 h-12 text-leaf-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900 font-display">No Plots Registered</h3>
          <p className="text-sm text-stone-600 max-w-sm mx-auto mb-6">
            Register your first farm plot to enable personalized AI advisories and weather alerts.
          </p>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/farms/new')}
          >
            Register Farm Now
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {farms.map((farm) => {
            const isSelected = activeFarmId === farm.id;

            return (
              <Card
                key={farm.id}
                className={`p-6 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-leaf-500 ring-2 ring-leaf-100 bg-white shadow-card'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-stone-900 font-display">
                          {farm.name}
                        </h3>
                        {farm.is_default && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-leaf-800 bg-leaf-100 px-2 py-0.5 rounded-full border border-leaf-200">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {farm.village ? `${farm.village}, ` : ''}
                        {farm.district}, {farm.state}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/farms/${farm.id}`)}
                        className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                        title="Edit Farm"
                        aria-label={`Edit ${farm.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setFarmToDelete(farm)}
                        className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Farm"
                        aria-label={`Delete ${farm.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-3 my-2 border-y border-stone-100">
                    <div>
                      <span className="text-stone-400 block">Area</span>
                      <span className="font-bold text-stone-800">
                        {farm.area_value} {farm.area_unit} ({farm.area_hectares} ha)
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block">Soil Type</span>
                      <span className="font-bold text-stone-800 capitalize">
                        {farm.soil_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block">Irrigation</span>
                      <span className="font-bold text-stone-800 capitalize">
                        {farm.irrigation_source.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block">Farming Practice</span>
                      <span className="font-bold text-stone-800 capitalize">
                        {farm.farming_practice}
                      </span>
                    </div>
                  </div>

                  {farm.soil_n !== undefined && farm.soil_n !== null && (
                    <div className="text-[11px] text-stone-500 flex items-center gap-2 mb-3">
                      <Sprout className="w-3.5 h-3.5 text-leaf-600" />
                      <span>
                        Soil Card: N: {farm.soil_n} | P: {farm.soil_p} | K: {farm.soil_k} kg/ha | pH:{' '}
                        {farm.soil_ph ?? 'NA'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  {isSelected ? (
                    <span className="text-xs font-bold text-leaf-700 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      <span>Currently Active Context</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveFarmId(farm.id)}
                      className="text-xs font-bold text-stone-600 hover:text-stone-900"
                    >
                      Set as Active
                    </button>
                  )}

                  {!farm.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(farm)}
                      className="text-xs font-semibold text-leaf-600 hover:text-leaf-800 underline"
                    >
                      Make Default
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!farmToDelete}
        onClose={() => setFarmToDelete(null)}
        title="Delete Farm Plot?"
        description={`Are you sure you want to delete "${farmToDelete?.name}"? All associated advisories and records will also be permanently deleted.`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setFarmToDelete(null)}>
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
