import React from 'react';
import { AlertCircle, HelpCircle, CheckCircle, ShieldAlert, Camera, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TreatmentLadder } from './TreatmentLadder';
import { AIDisclaimer } from '../ui/AIDisclaimer';
import { ReadAloudButton } from '../ui/ReadAloudButton';
import { PrintButton } from '../ui/PrintButton';
import { FeedbackWidget } from '../farm/FeedbackWidget';

export interface DiagnosisResultData {
  image_assessment: {
    is_plant: boolean;
    quality: string;
    issues: string[];
  };
  primary_diagnosis: {
    name: string;
    local_name: string;
    category: string;
    confidence: number;
    severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
    observed_symptoms: string[];
    cause: string;
    spread_risk: 'low' | 'medium' | 'high';
  };
  differential_diagnoses: Array<{
    name: string;
    category: string;
    confidence: number;
    distinguishing_features: string;
  }>;
  treatment: {
    urgency: 'immediate' | 'within_3_days' | 'within_week' | 'monitor_only';
    cultural: string[];
    biological_organic: Array<{ name: string; dose: string; method: string }>;
    chemical: Array<{
      active_ingredient: string;
      formulation: string;
      dose_per_litre: string;
      dose_per_acre: string;
      application_method: string;
      pre_harvest_interval_days: number | null;
      safety_precautions: string[];
    }>;
  };
  prevention: string[];
  when_to_consult_expert: string;
  retake_photo_tips: string[];
  confidence_note: string;
}

export interface DiagnosisRecord {
  id: string;
  crop_id: number;
  crop?: { name_en: string; name_hi: string };
  affected_part: string;
  symptoms: string | null;
  language: string;
  result: DiagnosisResultData;
  top_confidence: number;
  signed_images?: string[];
  created_at: string;
}

export const DiagnosisResultView: React.FC<{
  diagnosis: DiagnosisRecord;
  isOrganicPractice?: boolean;
}> = ({ diagnosis, isOrganicPractice = false }) => {
  const result = diagnosis.result;
  const isLowConfidence =
    !result.image_assessment.is_plant || result.primary_diagnosis.confidence < 0.5;

  const severityColors = {
    none: 'bg-leaf-100 text-leaf-800 border-leaf-200',
    low: 'bg-leaf-100 text-leaf-800 border-leaf-200',
    moderate: 'bg-amber-100 text-amber-900 border-amber-200',
    high: 'bg-orange-100 text-orange-900 border-orange-200',
    critical: 'bg-red-100 text-red-900 border-red-200',
  };

  const confidencePercentage = Math.round(result.primary_diagnosis.confidence * 100);

  const ttsText = `${result.primary_diagnosis.name}. ${result.primary_diagnosis.cause}. Urgency: ${result.treatment.urgency}.`;

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Badge variant="soil" size="md">
            {diagnosis.crop?.name_en || 'Crop'} • {diagnosis.affected_part.replace(/_/g, ' ')}
          </Badge>
          <span className="text-xs text-stone-500">
            Diagnosed on {new Date(diagnosis.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ReadAloudButton text={ttsText} lang={diagnosis.language} />
          <PrintButton />
        </div>
      </div>

      {/* Uploaded Photos Gallery */}
      {diagnosis.signed_images && diagnosis.signed_images.length > 0 && (
        <Card className="p-4 bg-white/80 border-stone-200 space-y-2">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-leaf-600" />
            Analyzed Photos ({diagnosis.signed_images.length})
          </h4>
          <div className="flex flex-wrap gap-3 pt-1">
            {diagnosis.signed_images.map((imgUrl, idx) => (
              <a
                key={idx}
                href={imgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-stone-200 shadow-xs bg-stone-100 hover:ring-2 hover:ring-leaf-500 transition-all group"
              >
                <img
                  src={imgUrl}
                  alt={`Plant photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1 right-1 bg-stone-900/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-xs">
                  Photo {idx + 1}
                </span>
              </a>
            ))}
          </div>
        </Card>
      )}


      {/* Low Confidence State */}
      {isLowConfidence ? (
        <Card className="border-sun-300 bg-sun-50/70 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-sun-100 rounded-xl text-sun-700 shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-sun-950 font-display">
                Low Confidence Identification ({confidencePercentage}%)
              </h3>
              <p className="text-sm text-sun-900 mt-1">
                {!result.image_assessment.is_plant
                  ? 'Our vision system could not verify a clear plant leaf or stem in the provided photos.'
                  : result.confidence_note ||
                    'The visual symptoms match multiple conditions or the photo lacks fine detail.'}
              </p>
            </div>
          </div>

          {result.retake_photo_tips && result.retake_photo_tips.length > 0 && (
            <div className="bg-white/80 p-4 rounded-xl border border-sun-200 space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-leaf-600" />
                Tips for retaking a diagnostic photo
              </h4>
              <ul className="list-disc list-inside text-sm text-stone-700 space-y-1">
                {result.retake_photo_tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3.5 bg-white/80 rounded-xl border border-sun-200 text-xs sm:text-sm text-stone-700">
            <strong>Recommended Step:</strong> {result.when_to_consult_expert}
          </div>
        </Card>
      ) : (
        /* Confident Primary Diagnosis */
        <Card className="card-print p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-leaf-700 bg-leaf-50 px-2 py-0.5 rounded border border-leaf-200">
                  {result.primary_diagnosis.category.replace(/_/g, ' ')}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    severityColors[result.primary_diagnosis.severity]
                  }`}
                >
                  Severity: {result.primary_diagnosis.severity.toUpperCase()}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-stone-900 font-display">
                {result.primary_diagnosis.name}
              </h2>
              {result.primary_diagnosis.local_name && (
                <p className="text-sm font-semibold text-stone-600 mt-0.5">
                  Local name: {result.primary_diagnosis.local_name}
                </p>
              )}
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
              <span className="text-xs text-stone-500 font-medium">Confidence</span>
              <div className="flex items-center gap-1.5">
                <div className="w-24 bg-stone-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-leaf-600 h-2.5 rounded-full"
                    style={{ width: `${confidencePercentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-stone-800">{confidencePercentage}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-bold text-stone-900 mb-1">Underlying Cause</h4>
              <p className="text-stone-700 leading-relaxed">{result.primary_diagnosis.cause}</p>
            </div>

            <div>
              <h4 className="font-bold text-stone-900 mb-1">Observed Symptoms</h4>
              <ul className="list-disc list-inside text-stone-700 space-y-0.5">
                {result.primary_diagnosis.observed_symptoms.map((sym, idx) => (
                  <li key={idx}>{sym}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Differential Diagnoses */}
      {!isLowConfidence && result.differential_diagnoses && result.differential_diagnoses.length > 0 && (
        <Card className="card-print p-5 space-y-3">
          <h3 className="text-base font-bold text-stone-900 font-display">
            Other Differential Diagnoses Considered
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.differential_diagnoses.map((diff, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-800">{diff.name}</h4>
                  <span className="text-xs font-semibold text-stone-500">
                    {Math.round(diff.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  <span className="font-semibold text-stone-700">Distinguishing feature:</span>{' '}
                  {diff.distinguishing_features}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* IPM Treatment Ladder */}
      {!isLowConfidence && (
        <Card className="card-print p-6">
          <TreatmentLadder
            urgency={result.treatment.urgency}
            cultural={result.treatment.cultural}
            biologicalOrganic={result.treatment.biological_organic}
            chemical={result.treatment.chemical}
            isOrganicPractice={isOrganicPractice}
          />
        </Card>
      )}

      {/* Future Prevention */}
      {!isLowConfidence && result.prevention && result.prevention.length > 0 && (
        <Card className="card-print p-5 space-y-3">
          <h3 className="text-base font-bold text-stone-900 font-display">
            Future Prevention Checklist
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-stone-700">
            {result.prevention.map((prev, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-leaf-600 shrink-0 mt-0.5" />
                <span>{prev}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Expert Escalation */}
      <Card className="card-print p-4 bg-stone-50 border-stone-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-stone-700">
            <span className="font-bold text-stone-900 block mb-0.5">When to consult an expert:</span>
            <p>{result.when_to_consult_expert}</p>
          </div>
        </div>
      </Card>

      <AIDisclaimer />

      <FeedbackWidget recordType="pest_diagnosis" recordId={diagnosis.id} />
    </div>
  );
};
