import React from 'react';
import { Calculator, FlaskConical, AlertTriangle, Info, Sprout } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ReadAloudButton } from '../ui/ReadAloudButton';
import { PrintButton } from '../ui/PrintButton';
import { AIDisclaimer } from '../ui/AIDisclaimer';
import { FeedbackWidget } from '../farm/FeedbackWidget';
import type { FertilizerScheduleResult } from '@cropsage/shared';

export interface FertilizerRecord {
  id: string;
  farm_id: string;
  farm?: { name: string; district: string; state: string; area_hectares: number };
  crop_id: number;
  crop?: { name_en: string; name_hi: string };
  area_hectares: number;
  target_yield_t_ha: number | null;
  inputs: any;
  computed_quantities: {
    nutrients_required_kg_ha: { N: number; P2O5: number; K2O: number };
    soil_ratings: { N: string; P: string; K: string };
    products: Array<{
      product: string;
      kg_per_ha: number;
      kg_total: number;
      kg_per_acre: number;
      bags_50kg: number;
    }>;
  };
  ai_schedule: FertilizerScheduleResult & { fallback?: boolean };
  language: string;
  created_at: string;
}

export const FertilizerPlanView: React.FC<{ plan: FertilizerRecord }> = ({ plan }) => {
  const schedule = plan.ai_schedule;
  const computed = plan.computed_quantities;
  const areaAcres = (plan.area_hectares / 0.40468564).toFixed(2);

  const ttsText = `${schedule.summary}. Calculated fertilizers for ${areaAcres} acres of ${plan.crop?.name_en || 'crop'}.`;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Badge variant="leaf" size="md">
            {plan.crop?.name_en || 'Crop'} • {areaAcres} Acres ({plan.area_hectares} ha)
          </Badge>
          <span className="text-xs text-stone-500">
            Soil-adjusted calculation for {plan.farm?.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ReadAloudButton text={ttsText} lang={plan.language} />
          <PrintButton />
        </div>
      </div>

      {/* Fallback Notice if AI failed and deterministic rule was used */}
      {schedule.fallback && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Split application schedule generated using university agronomic rules (deterministic
            fallback).
          </span>
        </div>
      )}

      {/* Summary Card */}
      <Card className="card-print p-6 bg-gradient-to-br from-white to-stone-50 border-stone-200">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-5 h-5 text-leaf-600" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-display">
            Targeted Fertilizer & Nutrient Management Plan
          </h2>
        </div>
        <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-normal">
          {schedule.summary}
        </p>

        {/* Soil Ratings Badge Strip */}
        <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-stone-200/70 text-xs">
          <span className="font-semibold text-stone-600">Soil fertility ratings:</span>
          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
            N: {computed.soil_ratings.N.toUpperCase()}
          </span>
          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
            P: {computed.soil_ratings.P.toUpperCase()}
          </span>
          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
            K: {computed.soil_ratings.K.toUpperCase()}
          </span>
        </div>
      </Card>

      {/* Deterministic Quantities Table */}
      <Card className="card-print p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-stone-900 font-display">
            Exact Required Product Quantities (Deterministic Calculation)
          </h3>
          <span className="text-xs text-stone-500">Total area: {areaAcres} acres</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500 font-semibold bg-stone-50/70">
                <th className="py-2.5 px-3">Fertilizer Product</th>
                <th className="py-2.5 px-3">Kg / Hectare</th>
                <th className="py-2.5 px-3">Kg / Acre</th>
                <th className="py-2.5 px-3">Total for Farm</th>
                <th className="py-2.5 px-3">50-kg Bags (approx)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {computed.products.map((prod, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50">
                  <td className="py-3 px-3 font-bold text-stone-900">{prod.product}</td>
                  <td className="py-3 px-3 text-stone-700">{prod.kg_per_ha} kg</td>
                  <td className="py-3 px-3 text-stone-700">{prod.kg_per_acre} kg</td>
                  <td className="py-3 px-3 font-extrabold text-leaf-700">{prod.kg_total} kg</td>
                  <td className="py-3 px-3">
                    <span className="bg-leaf-50 text-leaf-900 border border-leaf-200 px-2 py-0.5 rounded text-xs font-bold">
                      {prod.bags_50kg} bags
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Split Application Schedule */}
      <Card className="card-print p-6 space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-stone-900 font-display">
          Recommended Split Application Schedule
        </h3>

        <div className="space-y-4">
          {schedule.splits.map((split, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-stone-200 bg-white space-y-2 relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-leaf-600 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h4 className="text-base font-bold text-stone-900">{split.stage}</h4>
                </div>
                <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded">
                  Timing: {split.days_after_sowing}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {split.products.map((p, pIdx) => (
                  <span
                    key={pIdx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-leaf-50 text-leaf-900 border border-leaf-200 text-xs font-bold"
                  >
                    <span>{p.product}:</span>
                    <span className="text-leaf-700">{p.kg_total} kg</span>
                  </span>
                ))}
              </div>

              <div className="text-xs text-stone-600 space-y-0.5 pt-1">
                <p>
                  <span className="font-semibold text-stone-800">Application Method:</span>{' '}
                  {split.method}
                </p>
                {split.notes && <p className="text-stone-500 italic">{split.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Organic & Micronutrients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedule.organic_supplements && schedule.organic_supplements.length > 0 && (
          <Card className="card-print p-5 space-y-2">
            <h4 className="text-sm font-bold text-stone-900 font-display flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-leaf-600" />
              Organic & Soil Conditioning
            </h4>
            <ul className="list-disc list-inside text-xs sm:text-sm text-stone-700 space-y-1">
              {schedule.organic_supplements.map((org, idx) => (
                <li key={idx}>{org}</li>
              ))}
            </ul>
          </Card>
        )}

        {schedule.micronutrient_advice && schedule.micronutrient_advice.length > 0 && (
          <Card className="card-print p-5 space-y-2">
            <h4 className="text-sm font-bold text-stone-900 font-display flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-purple-600" />
              Micronutrient Advisory
            </h4>
            <ul className="list-disc list-inside text-xs sm:text-sm text-stone-700 space-y-1">
              {schedule.micronutrient_advice.map((micro, idx) => (
                <li key={idx}>{micro}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Warnings & Tips */}
      {schedule.warnings && schedule.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-sun-50 border border-sun-200 text-xs text-sun-900 space-y-1">
          <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-sun-800">
            <AlertTriangle className="w-4 h-4" />
            Important Field Precautions
          </span>
          <ul className="list-disc list-inside space-y-0.5 pt-1">
            {schedule.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <AIDisclaimer />

      <FeedbackWidget recordType="fertilizer_plan" recordId={plan.id} />
    </div>
  );
};
