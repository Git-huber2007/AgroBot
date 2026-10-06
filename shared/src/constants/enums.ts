export const CROP_CATEGORIES = [
  'cereal',
  'pulse',
  'oilseed',
  'vegetable',
  'fruit',
  'spice',
  'fibre',
  'sugar',
  'plantation',
  'fodder',
  'flower',
  'medicinal',
] as const;
export type CropCategory = (typeof CROP_CATEGORIES)[number];

export const SOIL_TYPES = [
  'alluvial',
  'black_cotton',
  'red',
  'laterite',
  'sandy',
  'loamy',
  'clay',
  'saline_alkaline',
  'forest_mountain',
  'desert',
  'unknown',
] as const;
export type SoilType = (typeof SOIL_TYPES)[number];

export const IRRIGATION_SOURCES = [
  'rainfed',
  'canal',
  'borewell',
  'open_well',
  'tank_pond',
  'river_lift',
  'drip',
  'sprinkler',
] as const;
export type IrrigationSource = (typeof IRRIGATION_SOURCES)[number];

export const SEASONS = ['kharif', 'rabi', 'zaid', 'perennial'] as const;
export type Season = (typeof SEASONS)[number];

export const WATER_LEVELS = ['scarce', 'moderate', 'adequate'] as const;
export type WaterLevel = (typeof WATER_LEVELS)[number];

export const FARMING_PRACTICES = ['conventional', 'organic', 'natural'] as const;
export type FarmingPractice = (typeof FARMING_PRACTICES)[number];

export const AREA_UNITS = ['acre', 'hectare', 'bigha', 'guntha'] as const;
export type AreaUnit = (typeof AREA_UNITS)[number];

export const RECORD_TYPES = [
  'crop_advisory',
  'crop_recommendation',
  'pest_diagnosis',
  'fertilizer_plan',
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const AFFECTED_PARTS = [
  'leaf',
  'stem',
  'root',
  'fruit',
  'flower',
  'seed',
  'whole_plant',
] as const;
export type AffectedPart = (typeof AFFECTED_PARTS)[number];

export const AI_FEATURES = [
  'crop_advisory',
  'crop_recommendation',
  'pest_diagnosis',
  'fertilizer_plan',
  'chat',
] as const;
export type AiFeature = (typeof AI_FEATURES)[number];

export const AI_STATUSES = [
  'success',
  'schema_error',
  'api_error',
  'timeout',
  'blocked',
  'quota_exceeded',
] as const;
export type AiStatus = (typeof AI_STATUSES)[number];

export const CHAT_ROLES = ['user', 'model'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export const TASK_PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const SEVERITY_LEVELS = ['none', 'low', 'moderate', 'high', 'critical'] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const DIAGNOSIS_CATEGORIES = [
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
] as const;
export type DiagnosisCategory = (typeof DIAGNOSIS_CATEGORIES)[number];
