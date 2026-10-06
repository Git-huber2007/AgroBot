-- =====================================================================
-- CropSage AI — Crop Catalog Seed Data (seed.sql)
-- Complete National Advisory & Agronomy Benchmark Dataset (42 Crops)
-- =====================================================================

insert into public.crops (
  name_en, name_hi, scientific_name, category, seasons, duration_days_min, duration_days_max, growth_stages, water_requirement, npk_recommendation_kg_ha
) values
-- 1. Paddy (Rice)
(
  'Paddy (Rice)', 'धान (चावल)', 'Oryza sativa', 'cereal', array['kharif','rabi']::season[], 110, 150,
  '[
    {"key": "germination", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 20},
    {"key": "tillering", "label_en": "Tillering", "day_start": 21, "day_end": 45},
    {"key": "panicle_initiation", "label_en": "Panicle Initiation & Stem Elongation", "day_start": 46, "day_end": 75},
    {"key": "flowering", "label_en": "Booting & Flowering", "day_start": 76, "day_end": 95},
    {"key": "grain_filling", "label_en": "Milk & Dough Stage", "day_start": 96, "day_end": 120},
    {"key": "maturity", "label_en": "Maturity & Harvest", "day_start": 121, "day_end": 150}
  ]'::jsonb,
  'high', '{"N": 120, "P2O5": 60, "K2O": 40}'::jsonb
),
-- 2. Wheat
(
  'Wheat', 'गेहूं', 'Triticum aestivum', 'cereal', array['rabi']::season[], 115, 140,
  '[
    {"key": "crown_root_initiation", "label_en": "Crown Root Initiation (CRI)", "day_start": 0, "day_end": 25},
    {"key": "tillering", "label_en": "Tillering", "day_start": 26, "day_end": 45},
    {"key": "jointing", "label_en": "Jointing", "day_start": 46, "day_end": 65},
    {"key": "booting_heading", "label_en": "Booting & Heading", "day_start": 66, "day_end": 85},
    {"key": "grain_milking", "label_en": "Milk & Dough Grain Filling", "day_start": 86, "day_end": 115},
    {"key": "maturity", "label_en": "Maturity & Ripening", "day_start": 116, "day_end": 140}
  ]'::jsonb,
  'moderate', '{"N": 120, "P2O5": 60, "K2O": 40}'::jsonb
),
-- 3. Maize
(
  'Maize', 'मक्का', 'Zea mays', 'cereal', array['kharif','rabi','zaid']::season[], 90, 120,
  '[
    {"key": "emergence", "label_en": "Emergence & Seedling (V2-V4)", "day_start": 0, "day_end": 20},
    {"key": "knee_high", "label_en": "Knee High (V6-V8)", "day_start": 21, "day_end": 40},
    {"key": "tasseling_silking", "label_en": "Tasseling & Silking", "day_start": 41, "day_end": 65},
    {"key": "grain_filling", "label_en": "Blister & Dough Stage", "day_start": 66, "day_end": 90},
    {"key": "physiological_maturity", "label_en": "Physiological Maturity", "day_start": 91, "day_end": 120}
  ]'::jsonb,
  'moderate', '{"N": 120, "P2O5": 60, "K2O": 50}'::jsonb
),
-- 4. Sorghum (Jowar)
(
  'Sorghum (Jowar)', 'ज्वार', 'Sorghum bicolor', 'cereal', array['kharif','rabi']::season[], 95, 125,
  '[
    {"key": "seedling", "label_en": "Seedling Establishment", "day_start": 0, "day_end": 20},
    {"key": "vegetative", "label_en": "Vegetative Growth", "day_start": 21, "day_end": 45},
    {"key": "booting_flowering", "label_en": "Booting & Flowering", "day_start": 46, "day_end": 70},
    {"key": "grain_filling", "label_en": "Grain Development", "day_start": 71, "day_end": 95},
    {"key": "maturity", "label_en": "Harvest Maturity", "day_start": 96, "day_end": 125}
  ]'::jsonb,
  'scarce', '{"N": 80, "P2O5": 40, "K2O": 40}'::jsonb
),
-- 5. Pearl Millet (Bajra)
(
  'Pearl Millet (Bajra)', 'बाजरा', 'Pennisetum glaucum', 'cereal', array['kharif','zaid']::season[], 75, 95,
  '[
    {"key": "seedling", "label_en": "Seedling Emergence", "day_start": 0, "day_end": 18},
    {"key": "tillering", "label_en": "Tillering & Stem Elongation", "day_start": 19, "day_end": 40},
    {"key": "flowering", "label_en": "Heading & Flowering", "day_start": 41, "day_end": 55},
    {"key": "grain_filling", "label_en": "Grain Filling", "day_start": 56, "day_end": 75},
    {"key": "maturity", "label_en": "Maturity & Harvesting", "day_start": 76, "day_end": 95}
  ]'::jsonb,
  'scarce', '{"N": 60, "P2O5": 30, "K2O": 20}'::jsonb
),
-- 6. Finger Millet (Ragi)
(
  'Finger Millet (Ragi)', 'रागी', 'Eleusine coracana', 'cereal', array['kharif','rabi']::season[], 105, 130,
  '[
    {"key": "nursery_seedling", "label_en": "Nursery & Seedling", "day_start": 0, "day_end": 25},
    {"key": "tillering", "label_en": "Tillering", "day_start": 26, "day_end": 50},
    {"key": "heading", "label_en": "Heading & Flowering", "day_start": 51, "day_end": 75},
    {"key": "grain_formation", "label_en": "Grain Development", "day_start": 76, "day_end": 105},
    {"key": "maturity", "label_en": "Maturity", "day_start": 106, "day_end": 130}
  ]'::jsonb,
  'scarce', '{"N": 50, "P2O5": 40, "K2O": 25}'::jsonb
),
-- 7. Chickpea (Gram)
(
  'Chickpea (Gram)', 'चना', 'Cicer arietinum', 'pulse', array['rabi']::season[], 90, 120,
  '[
    {"key": "germination", "label_en": "Germination & Early Vegetative", "day_start": 0, "day_end": 25},
    {"key": "branching", "label_en": "Branching", "day_start": 26, "day_end": 50},
    {"key": "flowering", "label_en": "Flowering & Pod Initiation", "day_start": 51, "day_end": 75},
    {"key": "pod_filling", "label_en": "Pod Filling & Seed Development", "day_start": 76, "day_end": 100},
    {"key": "maturity", "label_en": "Harvest Maturity", "day_start": 101, "day_end": 120}
  ]'::jsonb,
  'scarce', '{"N": 20, "P2O5": 40, "K2O": 20}'::jsonb
),
-- 8. Pigeon Pea (Tur/Arhar)
(
  'Pigeon Pea (Tur/Arhar)', 'अरहर (तूर)', 'Cajanus cajan', 'pulse', array['kharif']::season[], 150, 200,
  '[
    {"key": "seedling", "label_en": "Seedling Emergence", "day_start": 0, "day_end": 30},
    {"key": "vegetative", "label_en": "Active Vegetative & Branching", "day_start": 31, "day_end": 80},
    {"key": "flowering", "label_en": "Flower Bud & Flowering", "day_start": 81, "day_end": 125},
    {"key": "pod_development", "label_en": "Pod Development", "day_start": 126, "day_end": 165},
    {"key": "maturity", "label_en": "Pod Ripening & Harvest", "day_start": 166, "day_end": 200}
  ]'::jsonb,
  'scarce', '{"N": 25, "P2O5": 50, "K2O": 20}'::jsonb
),
-- 9. Green Gram (Moong)
(
  'Green Gram (Moong)', 'मूंग', 'Vigna radiata', 'pulse', array['kharif','zaid']::season[], 60, 75,
  '[
    {"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 15},
    {"key": "vegetative", "label_en": "Branching & Vegetative", "day_start": 16, "day_end": 30},
    {"key": "flowering", "label_en": "Flowering", "day_start": 31, "day_end": 45},
    {"key": "pod_filling", "label_en": "Pod Maturation", "day_start": 46, "day_end": 60},
    {"key": "maturity", "label_en": "Harvest", "day_start": 61, "day_end": 75}
  ]'::jsonb,
  'scarce', '{"N": 20, "P2O5": 40, "K2O": 20}'::jsonb
),
-- 10. Black Gram (Urad)
(
  'Black Gram (Urad)', 'उड़द', 'Vigna mungo', 'pulse', array['kharif','zaid']::season[], 70, 85,
  '[
    {"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 18},
    {"key": "vegetative", "label_en": "Vegetative & Branching", "day_start": 19, "day_end": 35},
    {"key": "flowering", "label_en": "Flowering & Pod Setting", "day_start": 36, "day_end": 55},
    {"key": "pod_filling", "label_en": "Pod Development", "day_start": 56, "day_end": 70},
    {"key": "maturity", "label_en": "Harvesting", "day_start": 71, "day_end": 85}
  ]'::jsonb,
  'scarce', '{"N": 20, "P2O5": 40, "K2O": 20}'::jsonb
),
-- 11. Lentil (Masoor)
(
  'Lentil (Masoor)', 'मसूर', 'Lens culinaris', 'pulse', array['rabi']::season[], 110, 130,
  '[
    {"key": "seedling", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 25},
    {"key": "vegetative", "label_en": "Branching", "day_start": 26, "day_end": 55},
    {"key": "flowering", "label_en": "Flowering", "day_start": 56, "day_end": 85},
    {"key": "pod_filling", "label_en": "Pod Filling", "day_start": 86, "day_end": 110},
    {"key": "maturity", "label_en": "Maturity", "day_start": 111, "day_end": 130}
  ]'::jsonb,
  'scarce', '{"N": 20, "P2O5": 40, "K2O": 20}'::jsonb
),
-- 12. Groundnut
(
  'Groundnut', 'मूंगफली', 'Arachis hypogaea', 'oilseed', array['kharif','zaid']::season[], 105, 125,
  '[
    {"key": "seedling", "label_en": "Emergence & Seedling", "day_start": 0, "day_end": 20},
    {"key": "vegetative", "label_en": "Vegetative & Flowering", "day_start": 21, "day_end": 40},
    {"key": "pegging", "label_en": "Pegging (Crucial Stage)", "day_start": 41, "day_end": 65},
    {"key": "pod_development", "label_en": "Pod Development", "day_start": 66, "day_end": 95},
    {"key": "maturity", "label_en": "Harvest Maturity", "day_start": 96, "day_end": 125}
  ]'::jsonb,
  'moderate', '{"N": 25, "P2O5": 50, "K2O": 40}'::jsonb
),
-- 13. Soybean
(
  'Soybean', 'सोयाबीन', 'Glycine max', 'oilseed', array['kharif']::season[], 90, 110,
  '[
    {"key": "seedling", "label_en": "Emergence (VE-V2)", "day_start": 0, "day_end": 18},
    {"key": "vegetative", "label_en": "Vegetative (V3-V5)", "day_start": 19, "day_end": 35},
    {"key": "flowering", "label_en": "Flowering (R1-R2)", "day_start": 36, "day_end": 55},
    {"key": "pod_development", "label_en": "Pod Development (R3-R5)", "day_start": 56, "day_end": 85},
    {"key": "maturity", "label_en": "Full Maturity (R7-R8)", "day_start": 86, "day_end": 110}
  ]'::jsonb,
  'moderate', '{"N": 30, "P2O5": 60, "K2O": 40}'::jsonb
),
-- 14. Mustard
(
  'Mustard', 'सरसों', 'Brassica juncea', 'oilseed', array['rabi']::season[], 105, 130,
  '[
    {"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 25},
    {"key": "rosette_stem", "label_en": "Rosette & Stem Elongation", "day_start": 26, "day_end": 50},
    {"key": "flowering", "label_en": "Flowering", "day_start": 51, "day_end": 75},
    {"key": "siliqua_development", "label_en": "Siliqua (Pod) Formation", "day_start": 76, "day_end": 105},
    {"key": "maturity", "label_en": "Maturity", "day_start": 106, "day_end": 130}
  ]'::jsonb,
  'moderate', '{"N": 80, "P2O5": 40, "K2O": 40}'::jsonb
),
-- 15. Sunflower
(
  'Sunflower', 'सूरजमुखी', 'Helianthus annuus', 'oilseed', array['kharif','rabi','zaid']::season[], 85, 100,
  '[
    {"key": "seedling", "label_en": "Emergence & Seedling", "day_start": 0, "day_end": 20},
    {"key": "vegetative", "label_en": "Stem & Foliage Development", "day_start": 21, "day_end": 40},
    {"key": "star_bud_flowering", "label_en": "Star Bud & Flowering (Anthesis)", "day_start": 41, "day_end": 65},
    {"key": "seed_filling", "label_en": "Achene (Seed) Filling", "day_start": 66, "day_end": 85},
    {"key": "maturity", "label_en": "Harvest Maturity", "day_start": 86, "day_end": 100}
  ]'::jsonb,
  'moderate', '{"N": 60, "P2O5": 60, "K2O": 40}'::jsonb
),
-- 16. Sesame
(
  'Sesame', 'तिल', 'Sesamum indicum', 'oilseed', array['kharif','zaid']::season[], 80, 95,
  '[
    {"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 20},
    {"key": "vegetative", "label_en": "Branching & Leaf Growth", "day_start": 21, "day_end": 40},
    {"key": "flowering", "label_en": "Flowering & Capsule Initiation", "day_start": 41, "day_end": 65},
    {"key": "capsule_maturation", "label_en": "Capsule Maturation", "day_start": 66, "day_end": 80},
    {"key": "maturity", "label_en": "Harvesting", "day_start": 81, "day_end": 95}
  ]'::jsonb,
  'scarce', '{"N": 40, "P2O5": 30, "K2O": 20}'::jsonb
),
-- 17. Cotton
(
  'Cotton', 'कपास', 'Gossypium hirsutum', 'fibre', array['kharif']::season[], 150, 180,
  '[
    {"key": "seedling", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 30},
    {"key": "squaring", "label_en": "Vegetative & Squaring (Square Formation)", "day_start": 31, "day_end": 65},
    {"key": "flowering_boll", "label_en": "Flowering & Early Boll Setting", "day_start": 66, "day_end": 105},
    {"key": "boll_development", "label_en": "Boll Development & Maturation", "day_start": 106, "day_end": 140},
    {"key": "boll_bursting", "label_en": "Boll Bursting & Picking", "day_start": 141, "day_end": 180}
  ]'::jsonb,
  'moderate', '{"N": 120, "P2O5": 60, "K2O": 60}'::jsonb
),
-- 18. Jute
(
  'Jute', 'जूट / पटसन', 'Corchorus olitorius', 'fibre', array['kharif','zaid']::season[], 110, 135,
  '[
    {"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 25},
    {"key": "vegetative", "label_en": "Active Vegetative & Fibre Elongation", "day_start": 26, "day_end": 80},
    {"key": "small_pod", "label_en": "Small Pod / Pre-Flowering", "day_start": 81, "day_end": 110},
    {"key": "maturity_harvest", "label_en": "Harvest (Optimal Fibre Quality)", "day_start": 111, "day_end": 135}
  ]'::jsonb,
  'high', '{"N": 60, "P2O5": 30, "K2O": 30}'::jsonb
),
-- 19. Sugarcane
(
  'Sugarcane', 'गन्ना', 'Saccharum officinarum', 'sugar', array['perennial']::season[], 300, 365,
  '[
    {"key": "germination", "label_en": "Germination Phase", "day_start": 0, "day_end": 45},
    {"key": "formative", "label_en": "Formative & Tillering Phase", "day_start": 46, "day_end": 120},
    {"key": "grand_growth", "label_en": "Grand Growth Phase (Cane Elongation)", "day_start": 121, "day_end": 250},
    {"key": "ripening", "label_en": "Ripening & Sugar Accumulation", "day_start": 251, "day_end": 365}
  ]'::jsonb,
  'high', '{"N": 250, "P2O5": 100, "K2O": 120}'::jsonb
),
-- 20. Tomato
(
  'Tomato', 'टमाटर', 'Solanum lycopersicum', 'vegetable', array['kharif','rabi','zaid']::season[], 90, 130,
  '[
    {"key": "nursery_transplanting", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 25},
    {"key": "vegetative", "label_en": "Early Vegetative Growth", "day_start": 26, "day_end": 45},
    {"key": "flowering_fruit_set", "label_en": "Flowering & Fruit Setting", "day_start": 46, "day_end": 75},
    {"key": "fruit_development", "label_en": "Fruit Enlargement", "day_start": 76, "day_end": 100},
    {"key": "harvesting", "label_en": "Fruit Ripening & Multiple Pickings", "day_start": 101, "day_end": 130}
  ]'::jsonb,
  'moderate', '{"N": 100, "P2O5": 60, "K2O": 60}'::jsonb
),
-- 21. Potato
(
  'Potato', 'आलू', 'Solanum tuberosum', 'vegetable', array['rabi']::season[], 90, 120,
  '[
    {"key": "sprouting", "label_en": "Sprout Emergence", "day_start": 0, "day_end": 20},
    {"key": "vegetative", "label_en": "Vegetative & Canopy Growth", "day_start": 21, "day_end": 45},
    {"key": "tuber_initiation", "label_en": "Tuber Initiation", "day_start": 46, "day_end": 65},
    {"key": "tuber_bulking", "label_en": "Tuber Bulking", "day_start": 66, "day_end": 95},
    {"key": "maturity", "label_en": "Maturity & Skin Hardening", "day_start": 96, "day_end": 120}
  ]'::jsonb,
  'moderate', '{"N": 150, "P2O5": 100, "K2O": 120}'::jsonb
),
-- 22. Onion
(
  'Onion', 'प्याज', 'Allium cepa', 'vegetable', array['kharif','rabi']::season[], 120, 150,
  '[
    {"key": "nursery_seedling", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 45},
    {"key": "vegetative", "label_en": "Vegetative Leaf Growth", "day_start": 46, "day_end": 80},
    {"key": "bulb_initiation", "label_en": "Bulb Initiation & Development", "day_start": 81, "day_end": 115},
    {"key": "maturity_harvest", "label_en": "Neck Fall & Harvest Maturity", "day_start": 116, "day_end": 150}
  ]'::jsonb,
  'moderate', '{"N": 100, "P2O5": 50, "K2O": 80}'::jsonb
),
-- 23. Brinjal (Eggplant)
(
  'Brinjal (Eggplant)', 'बैंगन', 'Solanum melongena', 'vegetable', array['kharif','rabi','zaid']::season[], 120, 160,
  '[
    {"key": "nursery", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 30},
    {"key": "vegetative", "label_en": "Vegetative & Branching", "day_start": 31, "day_end": 60},
    {"key": "flowering_fruit_set", "label_en": "Flowering & Fruit Set", "day_start": 61, "day_end": 90},
    {"key": "fruiting_picking", "label_en": "Continuous Fruit Pickings", "day_start": 91, "day_end": 160}
  ]'::jsonb,
  'moderate', '{"N": 100, "P2O5": 50, "K2O": 50}'::jsonb
),
-- 24. Chilli
(
  'Chilli', 'मिर्च', 'Capsicum annuum', 'spice', array['kharif','rabi','zaid']::season[], 120, 180,
  '[
    {"key": "nursery", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 35},
    {"key": "vegetative", "label_en": "Vegetative Growth", "day_start": 36, "day_end": 65},
    {"key": "flowering", "label_en": "Flowering & Pod Initiation", "day_start": 66, "day_end": 95},
    {"key": "fruiting_picking", "label_en": "Fruit Ripening & Pickings", "day_start": 96, "day_end": 180}
  ]'::jsonb,
  'moderate', '{"N": 120, "P2O5": 60, "K2O": 60}'::jsonb
),
-- 25. Okra (Bhindi)
(
  'Okra (Bhindi)', 'भिंडी', 'Abelmoschus esculentus', 'vegetable', array['kharif','zaid']::season[], 80, 100,
  '[
    {"key": "seedling", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 18},
    {"key": "vegetative", "label_en": "Vegetative Growth", "day_start": 19, "day_end": 35},
    {"key": "flowering", "label_en": "Flowering & Pod Set", "day_start": 36, "day_end": 50},
    {"key": "fruiting_picking", "label_en": "Regular Pod Picking", "day_start": 51, "day_end": 100}
  ]'::jsonb,
  'moderate', '{"N": 80, "P2O5": 50, "K2O": 50}'::jsonb
),
-- 26. Cabbage
(
  'Cabbage', 'पत्तागोभी', 'Brassica oleracea var. capitata', 'vegetable', array['rabi']::season[], 85, 110,
  '[
    {"key": "nursery", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 25},
    {"key": "vegetative", "label_en": "Vegetative & Foliage Development", "day_start": 26, "day_end": 50},
    {"key": "head_formation", "label_en": "Head Formation & Cupping", "day_start": 51, "day_end": 80},
    {"key": "maturity", "label_en": "Head Firmness & Harvest", "day_start": 81, "day_end": 110}
  ]'::jsonb,
  'moderate', '{"N": 120, "P2O5": 60, "K2O": 60}'::jsonb
),
-- 27. Cauliflower
(
  'Cauliflower', 'फूलगोभी', 'Brassica oleracea var. botrytis', 'vegetable', array['rabi']::season[], 85, 115,
  '[
    {"key": "nursery", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 28},
    {"key": "vegetative", "label_en": "Vegetative Growth", "day_start": 29, "day_end": 55},
    {"key": "curd_initiation", "label_en": "Curd Initiation & Blanching", "day_start": 56, "day_end": 85},
    {"key": "maturity", "label_en": "Curd Harvest", "day_start": 86, "day_end": 115}
  ]'::jsonb,
  'moderate', '{"N": 120, "P2O5": 80, "K2O": 60}'::jsonb
),
-- 28. Cucumber
(
  'Cucumber', 'खीरा', 'Cucumis sativus', 'vegetable', array['zaid','kharif']::season[], 60, 80,
  '[
    {"key": "seedling", "label_en": "Emergence & Seedling", "day_start": 0, "day_end": 15},
    {"key": "vining", "label_en": "Vine Growth & Trellising", "day_start": 16, "day_end": 35},
    {"key": "flowering_fruit_set", "label_en": "Flowering & Fruit Setting", "day_start": 36, "day_end": 50},
    {"key": "harvesting", "label_en": "Fruit Picking", "day_start": 51, "day_end": 80}
  ]'::jsonb,
  'moderate', '{"N": 80, "P2O5": 50, "K2O": 50}'::jsonb
),
-- 29. Banana
(
  'Banana', 'केला', 'Musa acuminata', 'fruit', array['perennial']::season[], 300, 365,
  '[
    {"key": "establishment", "label_en": "Sucker / Plantlet Establishment", "day_start": 0, "day_end": 90},
    {"key": "vegetative", "label_en": "Active Vegetative (Shooting Phase)", "day_start": 91, "day_end": 210},
    {"key": "flowering_shooting", "label_en": "Inflorescence & Bunch Emergence", "day_start": 211, "day_end": 270},
    {"key": "bunch_development", "label_en": "Bunch Maturation & Harvest", "day_start": 271, "day_end": 365}
  ]'::jsonb,
  'high', '{"N": 200, "P2O5": 60, "K2O": 300}'::jsonb
),
-- 30. Mango
(
  'Mango', 'आम', 'Mangifera indica', 'fruit', array['perennial']::season[], 365, 365,
  '[
    {"key": "dormancy", "label_en": "Post-Monsoon Dormancy", "day_start": 0, "day_end": 60},
    {"key": "panicle_bloom", "label_en": "Panicle Emergence & Flowering", "day_start": 61, "day_end": 120},
    {"key": "fruit_set", "label_en": "Fruit Setting & Pea/Marble Stage", "day_start": 121, "day_end": 180},
    {"key": "fruit_development", "label_en": "Fruit Enlargement & Maturation", "day_start": 181, "day_end": 270},
    {"key": "harvest", "label_en": "Harvesting & Post-Harvest Flush", "day_start": 271, "day_end": 365}
  ]'::jsonb,
  'moderate', '{"N": 100, "P2O5": 50, "K2O": 100}'::jsonb
),
-- 31. Papaya
(
  'Papaya', 'पपीता', 'Carica papaya', 'fruit', array['perennial']::season[], 240, 330,
  '[
    {"key": "nursery_establishment", "label_en": "Transplanting & Establishment", "day_start": 0, "day_end": 45},
    {"key": "vegetative", "label_en": "Rapid Vegetative Growth", "day_start": 46, "day_end": 105},
    {"key": "flowering_fruiting", "label_en": "Flowering & Fruit Setting", "day_start": 106, "day_end": 180},
    {"key": "fruit_maturation", "label_en": "Fruit Development & Harvest", "day_start": 181, "day_end": 330}
  ]'::jsonb,
  'high', '{"N": 150, "P2O5": 150, "K2O": 200}'::jsonb
),
-- 32. Pomegranate
(
  'Pomegranate', 'अनार', 'Punica granatum', 'fruit', array['perennial']::season[], 300, 365,
  '[
    {"key": "defoliation_bahar", "label_en": "Bahar Treatment & Pruning", "day_start": 0, "day_end": 30},
    {"key": "flowering", "label_en": "Flushing & Flowering", "day_start": 31, "day_end": 90},
    {"key": "fruit_development", "label_en": "Fruit Setting & Growth", "day_start": 91, "day_end": 210},
    {"key": "maturity", "label_en": "Fruit Maturation & Coloration", "day_start": 211, "day_end": 365}
  ]'::jsonb,
  'moderate', '{"N": 125, "P2O5": 50, "K2O": 125}'::jsonb
),
-- 33. Grapes
(
  'Grapes', 'अंगूर', 'Vitis vinifera', 'fruit', array['perennial']::season[], 300, 365,
  '[
    {"key": "pruning_bud_burst", "label_en": "Foundation/Fruit Pruning & Bud Burst", "day_start": 0, "day_end": 40},
    {"key": "shoot_bloom", "label_en": "Shoot Elongation & Flowering", "day_start": 41, "day_end": 90},
    {"key": "berry_setting", "label_en": "Berry Setting & Thinning", "day_start": 91, "day_end": 140},
    {"key": "veraison", "label_en": "Veraison (Berry Softening & Color)", "day_start": 141, "day_end": 200},
    {"key": "harvest", "label_en": "Harvesting", "day_start": 201, "day_end": 365}
  ]'::jsonb,
  'moderate', '{"N": 150, "P2O5": 80, "K2O": 200}'::jsonb
),
-- 34. Coconut
(
  'Coconut', 'नारियल', 'Cocos nucifera', 'plantation', array['perennial']::season[], 365, 365,
  '[
    {"key": "inflorescence", "label_en": "Spathe Opening & Button Setting", "day_start": 0, "day_end": 90},
    {"key": "nut_development", "label_en": "Tender Nut Phase", "day_start": 91, "day_end": 240},
    {"key": "kernel_maturation", "label_en": "Copra & Shell Hardening", "day_start": 241, "day_end": 365}
  ]'::jsonb,
  'high', '{"N": 100, "P2O5": 50, "K2O": 150}'::jsonb
),
-- 35. Arecanut
(
  'Arecanut', 'सुपारी', 'Areca catechu', 'plantation', array['perennial']::season[], 365, 365,
  '[
    {"key": "spathe_opening", "label_en": "Spathe Opening & Pollination", "day_start": 0, "day_end": 80},
    {"key": "nut_setting", "label_en": "Nut Setting & Growth", "day_start": 81, "day_end": 220},
    {"key": "harvest", "label_en": "Nut Maturation & Harvesting", "day_start": 221, "day_end": 365}
  ]'::jsonb,
  'high', '{"N": 100, "P2O5": 40, "K2O": 140}'::jsonb
),
-- 36. Coffee
(
  'Coffee', 'कॉफ़ी', 'Coffea arabica', 'plantation', array['perennial']::season[], 300, 365,
  '[
    {"key": "blossom", "label_en": "Blossom & Backing Shower", "day_start": 0, "day_end": 45},
    {"key": "berry_development", "label_en": "Berry Expansion & Bean Filling", "day_start": 46, "day_end": 200},
    {"key": "ripening_picking", "label_en": "Ripening & Fly Picking", "day_start": 201, "day_end": 365}
  ]'::jsonb,
  'moderate', '{"N": 120, "P2O5": 90, "K2O": 120}'::jsonb
),
-- 37. Tea
(
  'Tea', 'चाय', 'Camellia sinensis', 'plantation', array['perennial']::season[], 300, 365,
  '[
    {"key": "dormancy_pruning", "label_en": "Dormancy & Pruning", "day_start": 0, "day_end": 60},
    {"key": "first_flush", "label_en": "First Flush (Early Spring Plucking)", "day_start": 61, "day_end": 140},
    {"key": "monsoon_flush", "label_en": "Monsoon Flush & Active Foliage", "day_start": 141, "day_end": 250},
    {"key": "autumn_flush", "label_en": "Autumn Flush Plucking", "day_start": 251, "day_end": 365}
  ]'::jsonb,
  'high', '{"N": 140, "P2O5": 40, "K2O": 80}'::jsonb
),
-- 38. Turmeric
(
  'Turmeric', 'हल्दी', 'Curcuma longa', 'spice', array['kharif']::season[], 240, 270,
  '[
    {"key": "sprouting", "label_en": "Rhizome Sprouting", "day_start": 0, "day_end": 30},
    {"key": "vegetative", "label_en": "Tillering & Leaf Development", "day_start": 31, "day_end": 90},
    {"key": "rhizome_development", "label_en": "Rhizome Bulking", "day_start": 91, "day_end": 180},
    {"key": "maturity", "label_en": "Leaf Senescence & Harvest", "day_start": 181, "day_end": 270}
  ]'::jsonb,
  'moderate', '{"N": 120, "P2O5": 60, "K2O": 120}'::jsonb
),
-- 39. Ginger
(
  'Ginger', 'अदरक', 'Zingiber officinale', 'spice', array['kharif']::season[], 210, 240,
  '[
    {"key": "sprouting", "label_en": "Sprouting & Establishment", "day_start": 0, "day_end": 35},
    {"key": "tillering", "label_en": "Tillering & Canopy Growth", "day_start": 36, "day_end": 95},
    {"key": "rhizome_bulking", "label_en": "Rhizome Enlargement", "day_start": 96, "day_end": 175},
    {"key": "maturity", "label_en": "Maturity & Harvesting", "day_start": 176, "day_end": 240}
  ]'::jsonb,
  'moderate', '{"N": 100, "P2O5": 50, "K2O": 80}'::jsonb
),
-- 40. Garlic
(
  'Garlic', 'लहसुन', 'Allium sativum', 'spice', array['rabi']::season[], 120, 150,
  '[
    {"key": "germination", "label_en": "Clove Sprouting", "day_start": 0, "day_end": 20},
    {"key": "vegetative", "label_en": "Vegetative Foliage Growth", "day_start": 21, "day_end": 60},
    {"key": "clove_initiation", "label_en": "Clove Initiation & Bulb Growth", "day_start": 61, "day_end": 105},
    {"key": "maturity", "label_en": "Maturity & Drying", "day_start": 106, "day_end": 150}
  ]'::jsonb,
  'moderate', '{"N": 100, "P2O5": 50, "K2O": 50}'::jsonb
),
-- 41. Coriander
(
  'Coriander', 'धनिया', 'Coriandrum sativum', 'spice', array['rabi','kharif']::season[], 75, 90,
  '[
    {"key": "seedling", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 20},
    {"key": "vegetative", "label_en": "Rosette & Foliage Growth", "day_start": 21, "day_end": 45},
    {"key": "flowering", "label_en": "Bolting & Umbel Flowering", "day_start": 46, "day_end": 65},
    {"key": "seed_formation", "label_en": "Seed Ripening & Harvest", "day_start": 66, "day_end": 90}
  ]'::jsonb,
  'scarce', '{"N": 40, "P2O5": 30, "K2O": 20}'::jsonb
),
-- 42. Marigold
(
  'Marigold', 'गेंदा', 'Tagetes erecta', 'flower', array['kharif','rabi','zaid']::season[], 70, 90,
  '[
    {"key": "nursery", "label_en": "Nursery & Seedling Establishment", "day_start": 0, "day_end": 20},
    {"key": "vegetative_pinch", "label_en": "Vegetative & Terminal Pinching", "day_start": 21, "day_end": 40},
    {"key": "budding_bloom", "label_en": "Bud Initiation & Flowering", "day_start": 41, "day_end": 65},
    {"key": "multiple_pickings", "label_en": "Flower Plucking & Harvest", "day_start": 66, "day_end": 90}
  ]'::jsonb,
  'scarce', '{"N": 60, "P2O5": 60, "K2O": 40}'::jsonb
)
on conflict (name_en) do update set
  name_hi = excluded.name_hi,
  scientific_name = excluded.scientific_name,
  category = excluded.category,
  seasons = excluded.seasons,
  duration_days_min = excluded.duration_days_min,
  duration_days_max = excluded.duration_days_max,
  growth_stages = excluded.growth_stages,
  water_requirement = excluded.water_requirement,
  npk_recommendation_kg_ha = excluded.npk_recommendation_kg_ha;
