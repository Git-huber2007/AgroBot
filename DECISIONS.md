# CropSage AI — Architectural & Technical Decisions

- **D-001**: Single centralized constant `APP_NAME = "CropSage AI"` defined in `shared/src/constants/common.ts` and loaded by both frontend and backend.
- **D-002**: Database migrations organized as both individual modular migrations (`0001_init.sql`, `0002_storage.sql`, `0003_rls.sql`, `seed.sql`) and a combined unified migration `001_initial_schema.sql` for 1-click cloud Supabase setup.
- **D-003**: Migration runner script `scripts/migrate.mjs` supports executing SQL directly against Supabase PostgreSQL via connection string or REST SQL endpoint using `SUPABASE_DB_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
- **D-004**: Official `@google/genai` SDK isolated strictly to `server/src/ai/client.ts`; forbidden in any `client/` code validated by `scripts/check-client-secrets.mjs`.
- **D-005**: All AI responses strictly constrained to JSON schemas and validated against Zod schemas with a 1-retry self-correction loop on validation failure.
- **D-006**: Open-Meteo weather forecast calls cached in Postgres `weather_cache` (30 min TTL) with coordinates rounded to 2 decimal places to minimize upstream API calls and preserve farmer privacy.
- **D-007**: Client-side image upload strips EXIF metadata and re-encodes image to WebP with max 1600px longest edge before uploading to private bucket `crop-images`.
- **D-008**: Banned pesticide list enforced via dual-check in `pesticideGuard.ts`: model postValidate rejection and fallback safety sanitization.
- **D-009**: Deterministic fertilizer calculation executes prior to AI split scheduling; AI is prohibited from altering calculated quantities.
- **D-010**: Chat streaming via Server-Sent Events (SSE) with client-side abort support; last 20 messages maintained in active context with automated session titling and periodic summarization.
- **D-011**: React 18 + Vite SPA using React Router v6 data router (`createBrowserRouter`) with strict route guards (`ProtectedRoute`, `OnboardingGuard`, `PublicOnlyRoute`).
- **D-012**: Full dual-language internationalization using `react-i18next` shipping complete `en` and `hi` localization files, with fallback to `en` for chrome while AI outputs generate in the user's selected Indian language with native script.
- **D-013**: Treatment ladder in pest diagnosis strictly defaults the chemical tier collapsed with mandatory PPE notice and Pre-Harvest Interval (PHI) guidance, completely omitting chemical treatments for organic/natural farming practices.
- **D-014**: Persistent disclaimer *"AI-generated guidance. Verify with your local KVK or agriculture officer before applying chemicals."* rendered across all advisory, diagnosis, recommendation, and fertilizer plan outputs.
- **D-015**: Client-side Web Speech API text-to-speech configured with Indian BCP-47 locale matching (`en-IN`, `hi-IN`, `mr-IN`, etc.) and slower playback rate (0.95x) for low-literacy clarity.
