import React, { useState } from 'react';
import { ShieldCheck, Sprout, AlertTriangle, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export interface TreatmentLadderProps {
  urgency: 'immediate' | 'within_3_days' | 'within_week' | 'monitor_only';
  cultural: string[];
  biologicalOrganic: Array<{ name: string; dose: string; method: string }>;
  chemical: Array<{
    active_ingredient: string;
    formulation: string;
    dose_per_litre: string;
    dose_per_acre: string;
    application_method: string;
    pre_harvest_interval_days: number | null;
    safety_precautions: string[];
  }>;
  isOrganicPractice?: boolean;
}

export const TreatmentLadder: React.FC<TreatmentLadderProps> = ({
  urgency,
  cultural,
  biologicalOrganic,
  chemical,
  isOrganicPractice = false,
}) => {
  const [showChemical, setShowChemical] = useState(false);

  const urgencyLabels = {
    immediate: { label: 'Immediate Action Required', color: 'bg-red-100 text-red-800 border-red-200' },
    within_3_days: { label: 'Act Within 3 Days', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    within_week: { label: 'Action Within 1 Week', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    monitor_only: { label: 'Routine Monitoring Only', color: 'bg-leaf-100 text-leaf-800 border-leaf-200' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-stone-900 font-display">
          Integrated Pest Management (IPM) Ladder
        </h3>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            urgencyLabels[urgency]?.color || 'bg-stone-100 text-stone-800'
          }`}
        >
          {urgencyLabels[urgency]?.label || urgency}
        </span>
      </div>

      {/* Tier 1: Cultural & Mechanical */}
      <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-subtle space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h4 className="text-sm font-bold text-stone-900">Cultural & Mechanical Practices</h4>
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-stone-700 pl-2">
          {cultural.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Tier 2: Biological & Organic */}
      <div className="p-4 rounded-xl border border-leaf-200 bg-leaf-50/40 shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-leaf-600 text-white flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div className="flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-leaf-600" />
            <h4 className="text-sm font-bold text-leaf-950">Biological & Organic Solutions</h4>
          </div>
        </div>

        {biologicalOrganic.length === 0 ? (
          <p className="text-xs text-stone-500 italic pl-2">No specific biological agent recommended for this stage.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {biologicalOrganic.map((bio, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-leaf-200/80 space-y-1">
                <p className="text-sm font-bold text-stone-900">{bio.name}</p>
                <p className="text-xs text-stone-600">
                  <span className="font-semibold text-stone-800">Dose:</span> {bio.dose}
                </p>
                <p className="text-xs text-stone-500">{bio.method}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tier 3: Chemical (Strictly Last Resort & Collapsed by Default) */}
      {!isOrganicPractice && (
        <div className="p-4 rounded-xl border border-red-200/80 bg-red-50/20 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h4 className="text-sm font-bold text-red-950">Chemical Treatments (Last Resort Only)</h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowChemical(!showChemical)}
              className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 px-2.5 py-1 rounded border border-red-200 bg-white min-h-[44px]"
            >
              <span>{showChemical ? 'Hide chemical guidance' : 'Review chemical options'}</span>
              {showChemical ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-xs text-stone-600">
            Chemicals should strictly only be used when economic threshold levels are breached and biological measures have proven inadequate.
          </p>

          {showChemical && (
            <div className="pt-2 space-y-3 animate-fadeIn">
              <div className="p-3 bg-sun-50 border border-sun-200 rounded-lg text-xs text-sun-900 font-medium">
                Mandatory Safety Notice: Always use PPE (mask, gloves, rubber boots). Do not spray during high winds or rain. Observe Pre-Harvest Intervals (PHI).
              </div>

              {chemical.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No chemical treatments indicated for this condition.</p>
              ) : (
                <div className="space-y-3">
                  {chemical.map((chem, idx) => (
                    <div key={idx} className="p-3.5 bg-white rounded-lg border border-red-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-stone-900">
                          {chem.active_ingredient} ({chem.formulation})
                        </span>
                        {chem.pre_harvest_interval_days !== null && (
                          <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                            PHI: {chem.pre_harvest_interval_days} days
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                        <p>
                          <span className="font-semibold text-stone-800">Dose/Litre:</span> {chem.dose_per_litre}
                        </p>
                        <p>
                          <span className="font-semibold text-stone-800">Dose/Acre:</span> {chem.dose_per_acre}
                        </p>
                        <p className="sm:col-span-2">
                          <span className="font-semibold text-stone-800">Method:</span> {chem.application_method}
                        </p>
                      </div>

                      {chem.safety_precautions && chem.safety_precautions.length > 0 && (
                        <div className="pt-1.5 border-t border-stone-100">
                          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                            Required Safety Precautions
                          </p>
                          <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">
                            {chem.safety_precautions.map((p, pIdx) => (
                              <li key={pIdx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isOrganicPractice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-leaf-50 border border-leaf-200 text-xs font-semibold text-leaf-800">
          <Lock className="w-4 h-4 text-leaf-600 shrink-0" />
          <span>Farm practice is set to Organic/Natural: Synthetic chemicals are completely excluded.</span>
        </div>
      )}
    </div>
  );
};
