import { type Schema, Type } from '@google/genai';

export const pestDiagnosisGeminiSchema: Schema = {
  type: Type.OBJECT,
  required: [
    'image_assessment',
    'primary_diagnosis',
    'differential_diagnoses',
    'treatment',
    'prevention',
    'when_to_consult_expert',
    'retake_photo_tips',
    'confidence_note',
  ],
  properties: {
    image_assessment: {
      type: Type.OBJECT,
      required: ['is_plant', 'quality', 'issues'],
      properties: {
        is_plant: { type: Type.BOOLEAN },
        quality: { type: Type.STRING, enum: ['good', 'acceptable', 'poor', 'not_applicable'] },
        issues: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    primary_diagnosis: {
      type: Type.OBJECT,
      required: [
        'name',
        'local_name',
        'category',
        'confidence',
        'severity',
        'observed_symptoms',
        'cause',
        'spread_risk',
      ],
      properties: {
        name: { type: Type.STRING },
        local_name: { type: Type.STRING },
        category: {
          type: Type.STRING,
          enum: [
            'fungal_disease',
            'bacterial_disease',
            'viral_disease',
            'insect_pest',
            'mite_pest',
            'nematode',
            'nutrient_deficiency',
            'abiotic_stress',
            'weed',
            'healthy',
            'unknown',
          ],
        },
        confidence: { type: Type.NUMBER },
        severity: { type: Type.STRING, enum: ['none', 'low', 'moderate', 'high', 'critical'] },
        observed_symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
        cause: { type: Type.STRING },
        spread_risk: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
      },
    },
    differential_diagnoses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['name', 'category', 'confidence', 'distinguishing_features'],
        properties: {
          name: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: [
              'fungal_disease',
              'bacterial_disease',
              'viral_disease',
              'insect_pest',
              'mite_pest',
              'nematode',
              'nutrient_deficiency',
              'abiotic_stress',
              'weed',
              'healthy',
              'unknown',
            ],
          },
          confidence: { type: Type.NUMBER },
          distinguishing_features: { type: Type.STRING },
        },
      },
    },
    treatment: {
      type: Type.OBJECT,
      required: ['urgency', 'cultural', 'biological_organic', 'chemical'],
      properties: {
        urgency: {
          type: Type.STRING,
          enum: ['immediate', 'within_3_days', 'within_week', 'monitor_only'],
        },
        cultural: { type: Type.ARRAY, items: { type: Type.STRING } },
        biological_organic: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['name', 'dose', 'method'],
            properties: {
              name: { type: Type.STRING },
              dose: { type: Type.STRING },
              method: { type: Type.STRING },
            },
          },
        },
        chemical: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: [
              'active_ingredient',
              'formulation',
              'dose_per_litre',
              'dose_per_acre',
              'application_method',
              'pre_harvest_interval_days',
              'safety_precautions',
            ],
            properties: {
              active_ingredient: { type: Type.STRING },
              formulation: { type: Type.STRING },
              dose_per_litre: { type: Type.STRING },
              dose_per_acre: { type: Type.STRING },
              application_method: { type: Type.STRING },
              pre_harvest_interval_days: { type: Type.INTEGER, nullable: true },
              safety_precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      },
    },
    prevention: { type: Type.ARRAY, items: { type: Type.STRING } },
    when_to_consult_expert: { type: Type.STRING },
    retake_photo_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidence_note: { type: Type.STRING },
  },
};
