import { type Schema, Type } from '@google/genai';

export const chatTitleGeminiSchema: Schema = {
  type: Type.OBJECT,
  required: ['title'],
  properties: {
    title: { type: Type.STRING, description: '≤ 6 words, in output language' },
  },
};

export const chatSummaryGeminiSchema: Schema = {
  type: Type.OBJECT,
  required: ['summary'],
  properties: {
    summary: {
      type: Type.STRING,
      description: '≤ 120 words; key facts about the farmer’s crops, problems, and advice already given',
    },
  },
};
