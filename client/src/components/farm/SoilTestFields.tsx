import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';
import { Input } from '../ui/Input';
import { FormField } from '../ui/FormField';

export interface SoilTestValues {
  soil_n?: number | null;
  soil_p?: number | null;
  soil_k?: number | null;
  soil_ph?: number | null;
  soil_oc?: number | null;
  soil_ec?: number | null;
  soil_test_date?: string | null;
}

export interface SoilTestFieldsProps {
  values: SoilTestValues;
  onChange: (values: Partial<SoilTestValues>) => void;
  errors?: Record<string, string>;
}

export const SoilTestFields: React.FC<SoilTestFieldsProps> = ({
  values,
  onChange,
  errors = {},
}) => {
  const [isExpanded, setIsExpanded] = useState(
    Boolean(
      values.soil_n ||
        values.soil_p ||
        values.soil_k ||
        values.soil_ph ||
        values.soil_oc ||
        values.soil_ec
    )
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-stone-50/70 hover:bg-stone-100/70 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-leaf-100 text-leaf-700">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900">Soil Health Card Parameters (Optional)</h4>
            <p className="text-xs text-stone-500">
              Provide lab values to unlock custom fertilizer recommendations
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-stone-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-stone-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-5 space-y-4 border-t border-stone-200 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Available N (kg/ha)" htmlFor="soil_n" error={errors.soil_n}>
              <Input
                id="soil_n"
                type="number"
                step="0.1"
                min="0"
                max="2000"
                placeholder="e.g. 250"
                value={values.soil_n ?? ''}
                onChange={(e) =>
                  onChange({ soil_n: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </FormField>

            <FormField label="Available P (kg/ha)" htmlFor="soil_p" error={errors.soil_p}>
              <Input
                id="soil_p"
                type="number"
                step="0.1"
                min="0"
                max="2000"
                placeholder="e.g. 18"
                value={values.soil_p ?? ''}
                onChange={(e) =>
                  onChange({ soil_p: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </FormField>

            <FormField label="Available K (kg/ha)" htmlFor="soil_k" error={errors.soil_k}>
              <Input
                id="soil_k"
                type="number"
                step="0.1"
                min="0"
                max="2000"
                placeholder="e.g. 180"
                value={values.soil_k ?? ''}
                onChange={(e) =>
                  onChange({ soil_k: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Soil pH (3.0 – 10.5)" htmlFor="soil_ph" error={errors.soil_ph}>
              <Input
                id="soil_ph"
                type="number"
                step="0.01"
                min="3"
                max="10.5"
                placeholder="e.g. 7.2"
                value={values.soil_ph ?? ''}
                onChange={(e) =>
                  onChange({ soil_ph: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </FormField>

            <FormField label="Organic Carbon (%)" htmlFor="soil_oc" error={errors.soil_oc}>
              <Input
                id="soil_oc"
                type="number"
                step="0.01"
                min="0"
                max="5"
                placeholder="e.g. 0.55"
                value={values.soil_oc ?? ''}
                onChange={(e) =>
                  onChange({ soil_oc: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </FormField>

            <FormField label="EC (dS/m)" htmlFor="soil_ec" error={errors.soil_ec}>
              <Input
                id="soil_ec"
                type="number"
                step="0.01"
                min="0"
                max="20"
                placeholder="e.g. 0.45"
                value={values.soil_ec ?? ''}
                onChange={(e) =>
                  onChange({ soil_ec: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </FormField>
          </div>

          <div className="max-w-xs">
            <FormField label="Soil Test Date" htmlFor="soil_test_date" error={errors.soil_test_date}>
              <Input
                id="soil_test_date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={values.soil_test_date ?? ''}
                onChange={(e) => onChange({ soil_test_date: e.target.value || null })}
              />
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
};
