import { Router } from 'express';
import { FarmCreateSchema, FarmUpdateSchema, IdParamSchema } from '@cropsage/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { convertToHectares } from '../utils/units.js';
import { WeatherService } from '../services/weather.service.js';
import { NotFoundError } from '../utils/errors.js';

export const farmsRouter = Router();

// GET /farms
farmsRouter.get('/farms', requireAuth, async (req, res, next) => {
  try {
    const { data: farms, error } = await req.supabase!
      .from('farms')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch farms: ${error.message}`);
    }

    res.json({ data: farms });
  } catch (err) {
    next(err);
  }
});

// POST /farms
farmsRouter.post('/farms', requireAuth, validate({ body: FarmCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body;
    const areaHectares = convertToHectares(body.area_value, body.area_unit);

    const { count } = await req.supabase!
      .from('farms')
      .select('id', { count: 'exact', head: true });

    const isFirstFarm = (count ?? 0) === 0;
    const shouldBeDefault = body.is_default || isFirstFarm;

    const { data: farm, error } = await req.supabase!
      .from('farms')
      .insert({
        user_id: req.user!.id,
        name: body.name,
        state: body.state,
        district: body.district,
        village: body.village || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        area_value: body.area_value,
        area_unit: body.area_unit,
        area_hectares: areaHectares,
        soil_type: body.soil_type,
        irrigation_source: body.irrigation_source,
        water_availability: body.water_availability,
        farming_practice: body.farming_practice,
        soil_n: body.soil_n || null,
        soil_p: body.soil_p || null,
        soil_k: body.soil_k || null,
        soil_ph: body.soil_ph || null,
        soil_oc: body.soil_oc || null,
        soil_ec: body.soil_ec || null,
        soil_test_date: body.soil_test_date || null,
        is_default: shouldBeDefault,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create farm: ${error.message}`);
    }

    if (shouldBeDefault && !isFirstFarm) {
      await req.supabase!.rpc('set_default_farm', { fid: farm.id });
    }

    res.status(201).json({ data: farm });
  } catch (err) {
    next(err);
  }
});

// GET /farms/:id
farmsRouter.get('/farms/:id', requireAuth, validate({ params: IdParamSchema }), async (req, res, next) => {
  try {
    const { data: farm, error } = await req.supabase!
      .from('farms')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !farm) {
      throw new NotFoundError('Farm not found.');
    }

    res.json({ data: farm });
  } catch (err) {
    next(err);
  }
});

// PATCH /farms/:id
farmsRouter.patch(
  '/farms/:id',
  requireAuth,
  validate({ params: IdParamSchema, body: FarmUpdateSchema }),
  async (req, res, next) => {
    try {
      const farmId = req.params.id;
      const body = req.body;

      if (body.area_value !== undefined || body.area_unit !== undefined) {
        const { data: existing } = await req.supabase!
          .from('farms')
          .select('area_value, area_unit')
          .eq('id', farmId)
          .maybeSingle();

        if (!existing) {
          throw new NotFoundError('Farm not found.');
        }

        const finalVal = body.area_value ?? existing.area_value;
        const finalUnit = body.area_unit ?? existing.area_unit;
        body.area_hectares = convertToHectares(finalVal, finalUnit);
      }

      const isDefaultRequested = body.is_default;
      delete body.is_default;

      const { data: updated, error } = await req.supabase!
        .from('farms')
        .update(body)
        .eq('id', farmId)
        .select('*')
        .maybeSingle();

      if (error || !updated) {
        throw new NotFoundError('Farm not found or update failed.');
      }

      if (isDefaultRequested === true) {
        await req.supabase!.rpc('set_default_farm', { fid: farmId });
        updated.is_default = true;
      }

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /farms/:id
farmsRouter.delete('/farms/:id', requireAuth, validate({ params: IdParamSchema }), async (req, res, next) => {
  try {
    const { error } = await req.supabase!
      .from('farms')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw new Error(`Failed to delete farm: ${error.message}`);
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /farms/:id/weather
farmsRouter.get(
  '/farms/:id/weather',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const { data: farm, error } = await req.supabase!
        .from('farms')
        .select('latitude, longitude, district, state')
        .eq('id', req.params.id)
        .maybeSingle();

      if (error || !farm) {
        throw new NotFoundError('Farm not found.');
      }

      if (farm.latitude === null || farm.longitude === null) {
        res.json({
          data: {
            unavailable: true,
            message: 'Farm does not have coordinates configured. Update farm location to see weather forecast.',
            current: { temperature: 28, relativeHumidity: 60, windSpeedKmH: 10, weatherCode: 1, isDay: true },
            daily: [],
            alerts: [],
          },
        });
        return;
      }

      const weather = await WeatherService.getForecast(
        Number(farm.latitude),
        Number(farm.longitude),
      );

      res.json({ data: weather });
    } catch (err) {
      next(err);
    }
  },
);
