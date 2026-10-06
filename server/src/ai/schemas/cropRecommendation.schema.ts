import { type Schema, Type } from '@google/genai';

export const cropRecommendationGeminiSchema: Schema = {
  type: Type.OBJECT,
  required: ['summary', 'recommendations', 'general_tips', 'confidence', 'assumptions'],
  properties: {
    summary: { type: Type.STRING },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: [
          'rank',
          'crop_name',
          'suitability_score',
          'reasons',
          'duration_days',
          'water_requirement',
          'input_cost_inr_per_acre',
          'expected_yield',
          'key_risks',
          'rotation_benefit',
          'suggested_varieties',
          'sowing_window',
        ],
        properties: {
          rank: { type: Type.INTEGER },
          crop_name: { type: Type.STRING },
          suitability_score: { type: Type.INTEGER },
          reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
          duration_days: { type: Type.STRING },
          water_requirement: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          input_cost_inr_per_acre: {
            type: Type.OBJECT,
            required: ['min', 'max'],
            properties: {
              min: { type: Type.INTEGER },
              max: { type: Type.INTEGER },
            },
          },
          expected_yield: { type: Type.STRING },
          key_risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          rotation_benefit: { type: Type.STRING },
          suggested_varieties: { type: Type.ARRAY, items: { type: Type.STRING } },
          sowing_window: { type: Type.STRING },
        },
      },
    },
    general_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidence: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
    assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
};
