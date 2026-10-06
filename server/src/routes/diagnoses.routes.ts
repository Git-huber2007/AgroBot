import { Router } from 'express';
import { DiagnosisRequestSchema, IdParamSchema } from '@cropsage/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { aiHourlyLimiter } from '../middleware/rateLimiters.js';
import { checkAiDailyQuota } from '../middleware/aiQuota.js';
import { uploadImages } from '../middleware/upload.js';
import { DiagnosisService } from '../services/diagnosis.service.js';
import { StorageService } from '../services/storage.service.js';
import { ValidationError } from '../utils/errors.js';

export const diagnosesRouter = Router();

// POST /diagnoses
diagnosesRouter.post(
  '/diagnoses',
  requireAuth,
  aiHourlyLimiter,
  checkAiDailyQuota,
  uploadImages.array('images', 3),
  async (req, res, next) => {
    try {
      const rawPayload = req.body.payload;
      if (!rawPayload) {
        throw new ValidationError('Missing multipart field "payload"');
      }

      let parsedPayload: unknown;
      try {
        parsedPayload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
      } catch {
        throw new ValidationError('Field "payload" must be a valid JSON string');
      }

      const files = (req.files as Express.Multer.File[]) || [];
      const validationInput = {
        ...(parsedPayload as object),
        imageCount: files.length,
      };

      const validated = await DiagnosisRequestSchema.parseAsync(validationInput);

      const fileBuffers = files.map(f => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
        size: f.size,
      }));

      const result = await DiagnosisService.diagnose(
        req.supabase!,
        req.user!.id,
        req.requestId || 'req-' + Date.now(),
        validated,
        fileBuffers,
      );

      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// GET /diagnoses/:id
diagnosesRouter.get(
  '/diagnoses/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const result = await DiagnosisService.getDiagnosisById(req.supabase!, req.params.id as string);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /diagnoses/:id
diagnosesRouter.delete(
  '/diagnoses/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const { data: images } = await req.supabase!
        .from('diagnosis_images')
        .select('storage_path')
        .eq('diagnosis_id', id);

      if (images && images.length > 0) {
        const paths = images.map(i => i.storage_path);
        await StorageService.deleteObjects(paths);
      }

      const { error } = await req.supabase!
        .from('pest_diagnoses')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete diagnosis: ${error.message}`);
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
