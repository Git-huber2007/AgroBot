import React from 'react';
import { Compass, Award, Droplets, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ReadAloudButton } from '../ui/ReadAloudButton';
import { PrintButton } from '../ui/PrintButton';
import { AIDisclaimer } from '../ui/AIDisclaimer';
import { FeedbackWidget } from '../farm/FeedbackWidget';
import type { CropRecommendationResult } from '@cropsage/shared';

export interface RecommendationRecord {
  id: string;
  farm_id: string;
  farm?: { name: string; district: string; state: string };
  season: string;
  sowing_month: number;
  water_availability: string;
  budget_min_inr_per_acre: number;
  budget_max_inr_per_acre: number;
  risk_appetite: string;
  market_access: string;
  language: string;
  result: CropRecommendationResult;
  created_at: string;
}

export const RecommendationResultView: React.FC<{
  recommendation: RecommendationRecord;
}> = ({ recommendation }) => {
  const result = recommendation.result;

  const ttsText = `${result.summary}. Top recommended crops: ${result.recommendations
    .map((r) => `${r.rank}. ${r.crop_name} score ${r.suitability_score}%`)
    .join(', ')}.`;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Badge variant="sun" size="md">
            Season: {recommendation.season.toUpperCase()}
          </Badge>
          <span className="text-xs text-stone-500">
            Recommended for {recommendation.farm?.name} ({recommendation.farm?.district})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ReadAloudButton text={ttsText} lang={recommendation.language} />
          <PrintButton />
        </div>
      </div>

      {/* Summary Card */}
      <Card className="card-print p-6 bg-gradient-to-br from-white to-sun-50/20 border-sun-200/80">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5 text-sun-600" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-display">
            Seasonal Crop Planning Recommendations
          </h2>
        </div>
        <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-normal">
          {result.summary}
        </p>
      </Card>

      {/* Ranked Crops */}
      <div className="space-y-4">
        {result.recommendations.map((crop) => {
          return (
            <Card
              key={crop.rank}
              className={`card-print p-6 transition-all ${
                crop.rank === 1
                  ? 'border-leaf-300 ring-2 ring-leaf-200/60 shadow-md bg-white'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 ${
                      crop.rank === 1
                        ? 'bg-leaf-600 text-white'
                        : crop.rank === 2
                        ? 'bg-leaf-100 text-leaf-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    #{crop.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-stone-900 font-display">
                        {crop.crop_name}
                      </h3>
                      {crop.rank === 1 && (
                        <span className="text-[10px] font-bold text-leaf-800 bg-leaf-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Top Choice
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Sowing window: <strong>{crop.sowing_window}</strong> • Duration:{' '}
                      <strong>{crop.duration_days} days</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-stone-400 block">Suitability</span>
                    <span className="text-xl font-black text-leaf-700 font-display">
                      {crop.suitability_score}%
                    </span>
                  </div>
                  <div className="w-16 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-leaf-600 h-2.5 rounded-full"
                      style={{ width: `${crop.suitability_score}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-sm">
                <div>
                  <h4 className="font-bold text-stone-900 mb-1">Why this crop fits your farm</h4>
                  <ul className="list-disc list-inside space-y-1 text-stone-700">
                    {crop.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>

                  {crop.rotation_benefit && (
                    <div className="mt-3 p-2.5 bg-leaf-50/70 border border-leaf-100 rounded-lg text-xs text-leaf-900">
                      <strong>Crop Rotation Advantage:</strong> {crop.rotation_benefit}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-stone-50 rounded-lg">
                      <span className="text-stone-500 block">Expected Yield</span>
                      <span className="font-bold text-stone-900">{crop.expected_yield}</span>
                    </div>

                    <div className="p-2.5 bg-stone-50 rounded-lg">
                      <span className="text-stone-500 block">Est. Cost / Acre</span>
                      <span className="font-bold text-stone-900">
                        ₹{crop.input_cost_inr_per_acre.min.toLocaleString()} – ₹
                        {crop.input_cost_inr_per_acre.max.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2.5 bg-stone-50 rounded-lg col-span-2">
                      <span className="text-stone-500 block">Water Requirement</span>
                      <span className="font-bold text-stone-900 capitalize">
                        {crop.water_requirement} water demand
                      </span>
                    </div>
                  </div>

                  {crop.suggested_varieties && crop.suggested_varieties.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-stone-700 block mb-1">
                        Recommended public / state varieties:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {crop.suggested_varieties.map((v, idx) => (
                          <span
                            key={idx}
                            className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded font-medium"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {crop.key_risks && crop.key_risks.length > 0 && (
                    <div className="text-xs text-stone-600">
                      <span className="font-semibold text-stone-800 block mb-0.5">Key Risks:</span>
                      <span>{crop.key_risks.join(' • ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* General planning tips */}
      {result.general_tips && result.general_tips.length > 0 && (
        <Card className="card-print p-5 space-y-2">
          <h4 className="text-sm font-bold text-stone-900 font-display">General Agronomic Tips for the Season</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-stone-700">
            {result.general_tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </Card>
      )}

      <AIDisclaimer />

      <FeedbackWidget recordType="crop_recommendation" recordId={recommendation.id} />
    </div>
  );
};
