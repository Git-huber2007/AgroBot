import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { NotFoundError } from '../utils/errors.js';

export const cropsRouter = Router();

// GET /crops
cropsRouter.get('/crops', requireAuth, async (req, res, next) => {
  try {
    const { category, season, q } = req.query;

    let query = req.supabase!
      .from('crops')
      .select('*')
      .eq('is_active', true)
      .order('name_en', { ascending: true });

    if (category && typeof category === 'string') {
      query = query.eq('category', category);
    }

    if (season && typeof season === 'string') {
      query = query.contains('seasons', [season]);
    }

    if (q && typeof q === 'string') {
      query = query.or(`name_en.ilike.%${q}%,name_hi.ilike.%${q}%,scientific_name.ilike.%${q}%`);
    }

    const { data: crops, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch crop catalog: ${error.message}`);
    }

    // Set Cache-Control header: 1 hour (§12)
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({ data: crops });
  } catch (err) {
    next(err);
  }
});

// GET /crops/:id
cropsRouter.get('/crops/:id', requireAuth, async (req, res, next) => {
  try {
    const cropId = Number.parseInt(req.params.id || '', 10);
    if (Number.isNaN(cropId)) {
      throw new NotFoundError('Invalid crop ID.');
    }

    const { data: crop, error } = await req.supabase!
      .from('crops')
      .select('*')
      .eq('id', cropId)
      .maybeSingle();

    if (error || !crop) {
      throw new NotFoundError('Crop not found in catalog.');
    }

    res.json({ data: crop });
  } catch (err) {
    next(err);
  }
});
