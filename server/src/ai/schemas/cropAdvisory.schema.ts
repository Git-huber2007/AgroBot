import { type Schema, Type } from '@google/genai';

export const cropAdvisoryGeminiSchema: Schema = {
  type: Type.OBJECT,
  required: [
    'summary',
    'crop_stage',
    'priority_tasks',
    'irrigation_plan',
    'nutrient_plan',
    'pest_disease_watch',
    'weather_alerts',
    'dos',
    'donts',
    'estimated_cost',
    'confidence',
    'consult_expert_when',
    'assumptions',
  ],
  properties: {
    summary: { type: Type.STRING, description: '2–4 sentence overview' },
    crop_stage: {
      type: Type.OBJECT,
      required: ['key', 'name', 'days_after_sowing', 'stage_description'],
      properties: {
        key: { type: Type.STRING },
        name: { type: Type.STRING },
        days_after_sowing: { type: Type.INTEGER },
        stage_description: { type: Type.STRING },
      },
    },
    priority_tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['title', 'description', 'priority', 'timing', 'category'],
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['urgent', 'high', 'medium', 'low'] },
          timing: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: [
              'irrigation',
              'nutrition',
              'pest_management',
              'disease_management',
              'weed_management',
              'field_operation',
              'harvest',
              'other',
            ],
          },
        },
      },
    },
    irrigation_plan: {
      type: Type.OBJECT,
      required: ['recommendation', 'frequency', 'quantity_guidance', 'weather_adjustment'],
      properties: {
        recommendation: { type: Type.STRING },
        frequency: { type: Type.STRING },
        quantity_guidance: { type: Type.STRING },
        weather_adjustment: { type: Type.STRING },
      },
    },
    nutrient_plan: {
      type: Type.OBJECT,
      required: ['recommendation', 'items'],
      properties: {
        recommendation: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['product', 'dose_per_acre', 'method', 'timing'],
            properties: {
              product: { type: Type.STRING },
              dose_per_acre: { type: Type.STRING },
              method: { type: Type.STRING },
              timing: { type: Type.STRING },
            },
          },
        },
      },
    },
    pest_disease_watch: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['name', 'type', 'risk_level', 'symptoms_to_watch', 'preventive_action'],
        properties: {
          name: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ['insect_pest', 'disease', 'weed', 'nutrient_disorder', 'other'],
          },
          risk_level: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          symptoms_to_watch: { type: Type.STRING },
          preventive_action: { type: Type.STRING },
        },
      },
    },
    weather_alerts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['alert', 'impact', 'action'],
        properties: {
          alert: { type: Type.STRING },
          impact: { type: Type.STRING },
          action: { type: Type.STRING },
        },
      },
    },
    dos: { type: Type.ARRAY, items: { type: Type.STRING } },
    donts: { type: Type.ARRAY, items: { type: Type.STRING } },
    estimated_cost: {
      type: Type.OBJECT,
      required: ['min_inr_per_acre', 'max_inr_per_acre', 'notes'],
      properties: {
        min_inr_per_acre: { type: Type.INTEGER },
        max_inr_per_acre: { type: Type.INTEGER },
        notes: { type: Type.STRING },
      },
    },
    confidence: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
    consult_expert_when: { type: Type.ARRAY, items: { type: Type.STRING } },
    assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
};
