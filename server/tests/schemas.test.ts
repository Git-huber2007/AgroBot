import { describe, it, expect } from 'vitest';
import {
  AdvisoryRequestSchema,
  CropAdvisoryResultSchema,
  FarmCreateSchema,
  FertilizerScheduleResultSchema,
  PestDiagnosisResultSchema,
  SignUpSchema,
} from '@cropsage/shared';

describe('Shared Zod Schemas Validation Fixtures', () => {
  it('validates SignUpSchema correctly', () => {
    const valid = SignUpSchema.safeParse({
      email: 'farmer@example.com',
      password: 'StrongPassword1',
      confirmPassword: 'StrongPassword1',
    });
    expect(valid.success).toBe(true);

    const mismatch = SignUpSchema.safeParse({
      email: 'farmer@example.com',
      password: 'StrongPassword1',
      confirmPassword: 'DifferentPassword1',
    });
    expect(mismatch.success).toBe(false);
  });

  it('validates FarmCreateSchema bounds and coordinate pairing', () => {
    const valid = FarmCreateSchema.safeParse({
      name: 'North Wheat Field',
      state: 'Punjab',
      district: 'Ludhiana',
      latitude: 30.9,
      longitude: 75.8,
      area_value: 5,
      area_unit: 'acre',
      soil_type: 'alluvial',
      irrigation_source: 'borewell',
      water_availability: 'adequate',
      farming_practice: 'conventional',
      is_default: true,
    });
    expect(valid.success).toBe(true);

    // Mismatched coordinates (lat provided without lng)
    const badCoords = FarmCreateSchema.safeParse({
      name: 'South Field',
      state: 'Punjab',
      district: 'Ludhiana',
      latitude: 30.9,
      area_value: 5,
      area_unit: 'acre',
      soil_type: 'alluvial',
      irrigation_source: 'borewell',
      water_availability: 'adequate',
      farming_practice: 'conventional',
      is_default: false,
    });
    expect(badCoords.success).toBe(false);
  });

  it('validates AdvisoryRequestSchema date bounds', () => {
    const valid = AdvisoryRequestSchema.safeParse({
      farm_id: '123e4567-e89b-12d3-a456-426614174000',
      crop_id: 1,
      sowing_date: '2026-03-01',
      growth_stage: 'tillering',
      season: 'kharif',
      language: 'hi',
    });
    expect(valid.success).toBe(true);
  });

  it('validates CropAdvisoryResultSchema fixture', () => {
    const fixture = {
      summary: 'Timely advisory for paddy during active tillering stage under favorable weather.',
      crop_stage: {
        key: 'tillering',
        name: 'Active Tillering',
        days_after_sowing: 30,
        stage_description: 'Rapid tiller production and nutrient uptake',
      },
      priority_tasks: [
        {
          title: 'Top-dress Nitrogen',
          description: 'Apply first split of urea',
          priority: 'urgent',
          timing: 'Within 2 days',
          category: 'nutrition',
        },
        {
          title: 'Weed Inspection',
          description: 'Remove broadleaf weeds',
          priority: 'high',
          timing: 'Day 3–4',
          category: 'weed_management',
        },
        {
          title: 'Maintain Shallow Water',
          description: 'Keep 2-3 cm standing water',
          priority: 'medium',
          timing: 'Ongoing',
          category: 'irrigation',
        },
      ],
      irrigation_plan: {
        recommendation: 'Maintain shallow standing water layer (2-3 cm)',
        frequency: 'Every 3 days if no rainfall',
        quantity_guidance: 'Shallow submergence',
        weather_adjustment: 'No rain expected; maintain irrigation schedule',
      },
      nutrient_plan: {
        recommendation: 'Top-dress nitrogen now',
        items: [
          {
            product: 'Urea',
            dose_per_acre: '35 kg',
            method: 'Broadcast',
            timing: 'Early morning',
          },
        ],
      },
      pest_disease_watch: [
        {
          name: 'Stem Borer',
          type: 'insect_pest',
          risk_level: 'medium',
          symptoms_to_watch: 'Dead hearts in young tillers',
          preventive_action: 'Install pheromone traps at 5 per acre',
        },
      ],
      weather_alerts: [],
      dos: ['Do inspect tiller count', 'Do irrigate before fertilizer'],
      donts: ['Do not apply fertilizer on dry soil', 'Do not flood deeply'],
      estimated_cost: {
        min_inr_per_acre: 300,
        max_inr_per_acre: 600,
        notes: 'Includes urea top-dressing and pheromone traps',
      },
      confidence: 'high',
      consult_expert_when: ['If yellowing extends to more than 20% tillers'],
      assumptions: ['Assumed medium soil fertility'],
    };

    const result = CropAdvisoryResultSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it('validates PestDiagnosisResultSchema and FertilizerScheduleResultSchema fixtures', () => {
    const fertFixture = {
      summary: 'Optimal fertilizer application schedule for 1 hectare wheat.',
      splits: [
        {
          stage: 'Basal',
          days_after_sowing: '0',
          products: [{ product: 'DAP (18-46-0)', kg_total: 130 }],
          method: 'Drill below seed',
          notes: 'Full phosphate at sowing',
        },
      ],
      organic_supplements: ['FYM 5 tonnes/ha'],
      micronutrient_advice: ['Zinc sulphate 25 kg/ha if deficient'],
      application_tips: ['Broadcast evenly'],
      warnings: ['Do not mix with lime'],
    };

    const fertResult = FertilizerScheduleResultSchema.safeParse(fertFixture);
    expect(fertResult.success).toBe(true);
  });
});
