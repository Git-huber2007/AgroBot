import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PestDiagnosisResultSchema,
  PROMPT_VERSION,
  type DiagnosisRequestInput,
  type PestDiagnosisResult,
} from '@cropsage/shared';
import { AI_CONFIGS } from '../config/ai.js';
import { generateStructured } from '../ai/generateStructured.js';
import { pestDiagnosisGeminiSchema } from '../ai/schemas/pestDiagnosis.schema.js';
import { buildPestDiagnosisPrompt } from '../ai/prompts/pestDiagnosis.js';
import { checkPesticideSafety, sanitizeChemicalTreatments } from '../ai/safety/pesticideGuard.js';
import { StorageService } from './storage.service.js';
import { sanitizeAndProcessImage } from '../middleware/upload.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { WeatherService } from './weather.service.js';

export interface UploadedFileWithBuffer {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export class DiagnosisService {
  public static async diagnose(
    userClient: SupabaseClient,
    userId: string,
    requestId: string,
    input: DiagnosisRequestInput,
    rawFiles: UploadedFileWithBuffer[] = [],
  ) {
    const diagnosisId = crypto.randomUUID();
    const uploadedStoragePaths: string[] = [];

    try {
      // 1. Fetch Crop details
      const { data: crop, error: cropErr } = await userClient
        .from('crops')
        .select('*')
        .eq('id', input.crop_id)
        .maybeSingle();

      if (cropErr || !crop) {
        throw new NotFoundError('Selected crop not found in catalog.');
      }

      // 2. Fetch Farm & Weather context if farm_id supplied
      let district: string | null = null;
      let state: string | null = null;
      let farmingPractice: 'conventional' | 'organic' | 'natural' = 'conventional';
      let weatherShort: string | null = null;

      if (input.farm_id) {
        const { data: farm } = await userClient
          .from('farms')
          .select('*')
          .eq('id', input.farm_id)
          .maybeSingle();

        if (farm) {
          district = farm.district;
          state = farm.state;
          farmingPractice = farm.farming_practice;
          if (farm.latitude !== null && farm.longitude !== null) {
            const weather = await WeatherService.getForecast(
              Number(farm.latitude),
              Number(farm.longitude),
            );
            if (weather && !weather.unavailable) {
              weatherShort = `Temp ${weather.current.temperature}°C, Humidity ${weather.current.relativeHumidity}%, 7-day rain ${weather.daily.reduce((sum, d) => sum + d.precipitationMm, 0).toFixed(0)}mm`;
            }
          }
        }
      }

      // 3. Process, sanitize & upload images
      const processedImages: Array<{ buffer: Buffer; mimeType: 'image/webp'; sizeBytes: number }> = [];
      const imageGeminiParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];

      for (let i = 0; i < rawFiles.length; i++) {
        const file = rawFiles[i]!;
        const processed = await sanitizeAndProcessImage(file.buffer);
        processedImages.push(processed);

        const storagePath = await StorageService.uploadDiagnosisImage(
          userClient,
          userId,
          diagnosisId,
          i + 1,
          processed.buffer,
        );
        uploadedStoragePaths.push(storagePath);

        imageGeminiParts.push({
          inlineData: {
            mimeType: 'image/webp',
            data: processed.buffer.toString('base64'),
          },
        });
      }

      // 4. Build prompt
      const promptText = buildPestDiagnosisPrompt({
        crop_name_en: crop.name_en,
        scientific_name: crop.scientific_name,
        affected_part: input.affected_part,
        district,
        state,
        current_month: new Date().toLocaleString('en-US', { month: 'long' }),
        season_guess: 'Current Season',
        weather_short: weatherShort,
        farming_practice: farmingPractice,
        image_count: processedImages.length,
        symptoms: input.symptoms,
        language: input.language,
      });

      const config = AI_CONFIGS.pest_diagnosis;

      // 5. Generate structured diagnosis with Gemini
      const geminiResult = await generateStructured<PestDiagnosisResult>({
        feature: 'pest_diagnosis',
        userId,
        requestId,
        model: config.model,
        systemInstruction: 'You are CropSage plant health pathologist and entomologist. Follow the IPM ladder strictly.',
        parts: [{ text: promptText }, ...imageGeminiParts],
        responseSchema: pestDiagnosisGeminiSchema,
        zodSchema: PestDiagnosisResultSchema,
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
        timeoutMs: config.timeoutMs,
        maxRetries: config.maxRetries,
        postValidate: data => {
          // Banned pesticides guard (§13.6)
          for (const chem of data.treatment.chemical) {
            const check = checkPesticideSafety(chem);
            if (check.hasBanned) {
              return `Safety violation: chemical contains banned or restricted pesticide (${chem.active_ingredient})`;
            }
            if (check.hasBrandName) {
              return `Brand names and trademarks are forbidden: (${chem.active_ingredient})`;
            }
          }

          // If not a plant, verify confidence and chemical restriction
          if (!data.image_assessment.is_plant) {
            if (data.primary_diagnosis.confidence > 0.25) {
              return 'Confidence must be <= 0.2 for non-plant images';
            }
            if (data.treatment.chemical.length > 0) {
              return 'Chemical treatments must not be provided for non-plant images';
            }
          }

          // If organic/natural farm, synthetic chemicals forbidden
          if (farmingPractice === 'organic' || farmingPractice === 'natural') {
            if (data.treatment.chemical.length > 0) {
              return 'Chemical pesticides are prohibited for organic/natural farming practice';
            }
          }

          // If severity none or low, chemical treatments forbidden
          if (
            data.primary_diagnosis.severity === 'none' ||
            data.primary_diagnosis.severity === 'low'
          ) {
            if (data.treatment.chemical.length > 0) {
              return 'Chemical treatments cannot be recommended for none or low severity issues';
            }
          }

          return null;
        },
      });

      // 6. Secondary safety pass on chemicals
      const sanitizedChemicals = sanitizeChemicalTreatments(
        geminiResult.data.treatment.chemical,
      );

      const finalData: PestDiagnosisResult = {
        ...geminiResult.data,
        treatment: {
          ...geminiResult.data.treatment,
          chemical: sanitizedChemicals.cleanList,
        },
        prevention: [
          ...geminiResult.data.prevention,
          ...sanitizedChemicals.removedWarnings,
        ],
      };

      // 7. Insert diagnosis row
      const { data: savedDiag, error: diagSaveErr } = await userClient
        .from('pest_diagnoses')
        .insert({
          id: diagnosisId,
          user_id: userId,
          farm_id: input.farm_id || null,
          crop_id: crop.id,
          affected_part: input.affected_part,
          symptoms: input.symptoms || null,
          language: input.language,
          result: finalData,
          top_confidence: finalData.primary_diagnosis.confidence,
          model: geminiResult.model,
          prompt_version: PROMPT_VERSION,
        })
        .select('*')
        .single();

      if (diagSaveErr) {
        throw new Error(`Failed to save diagnosis: ${diagSaveErr.message}`);
      }

      // 8. Insert diagnosis images rows and sign URLs
      const signedImages: Array<{ storage_path: string; signed_url: string; size_bytes: number }> = [];

      for (let i = 0; i < uploadedStoragePaths.length; i++) {
        const path = uploadedStoragePaths[i]!;
        const procImg = processedImages[i]!;

        await userClient.from('diagnosis_images').insert({
          diagnosis_id: diagnosisId,
          user_id: userId,
          storage_path: path,
          mime_type: 'image/webp',
          size_bytes: procImg.sizeBytes,
        });

        const signedUrl = await StorageService.getSignedUrl(userClient, path, 600);
        signedImages.push({
          storage_path: path,
          signed_url: signedUrl,
          size_bytes: procImg.sizeBytes,
        });
      }

      return {
        ...savedDiag,
        crop_name: crop.name_en,
        images: signedImages,
      };
    } catch (err) {
      // Compensating cleanup on failure (§15.3)
      if (uploadedStoragePaths.length > 0) {
        logger.warn({ uploadedStoragePaths }, 'Diagnosis failed, performing compensating cleanup on storage objects');
        await StorageService.deleteObjects(uploadedStoragePaths);
      }
      throw err;
    }
  }

  public static async getDiagnosisById(userClient: SupabaseClient, id: string) {
    const { data: diag, error: diagErr } = await userClient
      .from('pest_diagnoses')
      .select('*, crops(name_en), farms(name)')
      .eq('id', id)
      .maybeSingle();

    if (diagErr || !diag) {
      throw new NotFoundError('Diagnosis not found or you do not have permission to view it.');
    }

    const { data: dbImages } = await userClient
      .from('diagnosis_images')
      .select('*')
      .eq('diagnosis_id', id);

    const signedImages = await Promise.all(
      (dbImages || []).map(async img => ({
        ...img,
        signed_url: await StorageService.getSignedUrl(userClient, img.storage_path, 600),
      })),
    );

    return {
      ...diag,
      images: signedImages,
    };
  }
}
