import React from 'react';
import {
  Calendar,
  Clock,
  Droplets,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ReadAloudButton } from '../ui/ReadAloudButton';
import { PrintButton } from '../ui/PrintButton';
import { AIDisclaimer } from '../ui/AIDisclaimer';
import { FeedbackWidget } from '../farm/FeedbackWidget';
import type { CropAdvisoryResult } from '@cropsage/shared';

export interface AdvisoryRecord {
  id: string;
  farm_id: string;
  farm?: { name: string; district: string; state: string };
  crop_id: number;
  crop?: { name_en: string; name_hi: string };
  variety: string | null;
  sowing_date: string;
  growth_stage: string;
  season: string;
  concern: string | null;
  language: string;
  weather_snapshot: any;
  result: CropAdvisoryResult;
  model: string;
  created_at: string;
}

export const AdvisoryReportView: React.FC<{ advisory: AdvisoryRecord }> = ({ advisory }) => {
  const result = advisory.result;

  const priorityColors = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-sun-100 text-sun-900 border-sun-200',
    low: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const ttsText = `${result.summary}. Crop stage: ${result.crop_stage.name}. Priority tasks: ${result.priority_tasks
    .map((t) => t.title)
    .join(', ')}.`;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Badge variant="leaf" size="md">
            {advisory.crop?.name_en || 'Crop'} • Stage: {result.crop_stage.name}
          </Badge>
          <span className="text-xs text-stone-500">
            Generated on {new Date(advisory.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ReadAloudButton text={ttsText} lang={advisory.language} />
          <PrintButton />
        </div>
      </div>

      {/* Summary Card */}
      <Card className="card-print p-6 bg-gradient-to-br from-white to-leaf-50/20 border-leaf-200/80">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-200/70">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-leaf-700 bg-leaf-50 px-2 py-0.5 rounded border border-leaf-200">
              Stage Advisory • {result.crop_stage.days_after_sowing} Days After Sowing
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-display mt-2">
              {result.crop_stage.name} ({result.crop_stage.stage_description})
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Farm: <strong>{advisory.farm?.name}</strong> ({advisory.farm?.district},{' '}
              {advisory.farm?.state})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Confidence:</span>
            <Badge variant="leaf">{result.confidence.toUpperCase()}</Badge>
          </div>
        </div>

        <p className="text-sm sm:text-base text-stone-800 leading-relaxed mt-4 font-normal">
          {result.summary}
        </p>
      </Card>

      {/* Priority Tasks */}
      <Card className="card-print p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900 font-display flex items-center gap-2">
            <Clock className="w-5 h-5 text-leaf-600" />
            <span>Priority Action Items (Next 7–10 Days)</span>
          </h3>
          <span className="text-xs text-stone-500">{result.priority_tasks.length} tasks scheduled</span>
        </div>

        <div className="space-y-3">
          {result.priority_tasks.map((task, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-colors space-y-1.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      priorityColors[task.priority]
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    {task.timing}
                  </span>
                </div>
                <span className="text-xs text-stone-400 capitalize">
                  {task.category.replace(/_/g, ' ')}
                </span>
              </div>

              <h4 className="text-base font-bold text-stone-900">{task.title}</h4>
              <p className="text-sm text-stone-700 leading-relaxed">{task.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Irrigation & Nutrition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Irrigation Plan */}
        <Card className="card-print p-5 space-y-3">
          <h3 className="text-base font-bold text-stone-900 font-display flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <span>Irrigation Schedule</span>
          </h3>
          <p className="text-sm text-stone-700 leading-relaxed">
            {result.irrigation_plan.recommendation}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-100">
            <div>
              <span className="font-semibold text-stone-500 block">Frequency:</span>
              <span className="text-stone-800 font-medium">{result.irrigation_plan.frequency}</span>
            </div>
            <div>
              <span className="font-semibold text-stone-500 block">Guidance:</span>
              <span className="text-stone-800 font-medium">{result.irrigation_plan.quantity_guidance}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 font-medium">
            <strong>Weather Adjustment:</strong> {result.irrigation_plan.weather_adjustment}
          </div>
        </Card>

        {/* Nutrient Plan */}
        <Card className="card-print p-5 space-y-3">
          <h3 className="text-base font-bold text-stone-900 font-display flex items-center gap-2">
            <Sprout className="w-5 h-5 text-leaf-600" />
            <span>Nutrient Management</span>
          </h3>
          <p className="text-sm text-stone-700 leading-relaxed">{result.nutrient_plan.recommendation}</p>

          {result.nutrient_plan.items.length > 0 && (
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-1.5 font-semibold">Product</th>
                    <th className="py-1.5 font-semibold">Dose / Acre</th>
                    <th className="py-1.5 font-semibold">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {result.nutrient_plan.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-bold text-stone-900">{it.product}</td>
                      <td className="py-2 text-stone-700">{it.dose_per_acre}</td>
                      <td className="py-2 text-stone-600">{it.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Pest & Disease Watchlist */}
      {result.pest_disease_watch && result.pest_disease_watch.length > 0 && (
        <Card className="card-print p-6 space-y-4">
          <h3 className="text-base font-bold text-stone-900 font-display flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-sun-600" />
            <span>Pest & Disease Watchlist for Current Weather</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.pest_disease_watch.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-900">{p.name}</h4>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      p.risk_level === 'high'
                        ? 'bg-red-100 text-red-800'
                        : p.risk_level === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-leaf-100 text-leaf-800'
                    }`}
                  >
                    {p.risk_level} Risk
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  <span className="font-semibold text-stone-800">Watch for:</span> {p.symptoms_to_watch}
                </p>
                <p className="text-xs text-leaf-800">
                  <span className="font-semibold">Preventive:</span> {p.preventive_action}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Do's & Don'ts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="card-print p-5 border-leaf-200/80 bg-leaf-50/20 space-y-3">
          <h4 className="text-sm font-bold text-leaf-950 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-leaf-600" />
            <span>Crucial Do's</span>
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-stone-700">
            {result.dos.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="card-print p-5 border-red-200/80 bg-red-50/20 space-y-3">
          <h4 className="text-sm font-bold text-red-950 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>Avoid (Don'ts)</span>
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-stone-700">
            {result.donts.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Cost Estimate & Escalation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="card-print p-4 space-y-2">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-stone-600" />
            Estimated Input Cost (Per Acre)
          </h4>
          <div className="text-2xl font-extrabold text-stone-900 font-display">
            ₹{result.estimated_cost.min_inr_per_acre.toLocaleString()} – ₹
            {result.estimated_cost.max_inr_per_acre.toLocaleString()}
          </div>
          <p className="text-xs text-stone-500">{result.estimated_cost.notes}</p>
        </Card>

        <Card className="card-print p-4 space-y-2 bg-stone-50">
          <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-stone-600" />
            When to Consult KVK Officer
          </h4>
          <ul className="list-disc list-inside text-xs text-stone-700 space-y-0.5">
            {result.consult_expert_when.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Assumptions */}
      {result.assumptions && result.assumptions.length > 0 && (
        <div className="p-3 bg-stone-100/70 rounded-xl text-xs text-stone-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-stone-600">Assumptions made in this advisory:</span>{' '}
            {result.assumptions.join(' • ')}
          </div>
        </div>
      )}

      <AIDisclaimer />

      <FeedbackWidget recordType="crop_advisory" recordId={advisory.id} />
    </div>
  );
};
