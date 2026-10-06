import { type Schema, Type } from '@google/genai';

export const fertilizerScheduleGeminiSchema: Schema = {
  type: Type.OBJECT,
  required: [
    'summary',
    'splits',
    'organic_supplements',
    'micronutrient_advice',
    'application_tips',
    'warnings',
  ],
  properties: {
    summary: { type: Type.STRING },
    splits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['stage', 'days_after_sowing', 'products', 'method', 'notes'],
        properties: {
          stage: { type: Type.STRING },
          days_after_sowing: { type: Type.STRING },
          products: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ['product', 'kg_total'],
              properties: {
                product: { type: Type.STRING },
                kg_total: { type: Type.NUMBER },
              },
            },
          },
          method: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
      },
    },
    organic_supplements: { type: Type.ARRAY, items: { type: Type.STRING } },
    micronutrient_advice: { type: Type.ARRAY, items: { type: Type.STRING } },
    application_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
};
