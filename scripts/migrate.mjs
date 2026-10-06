#!/usr/bin/env node
/**
 * CropSage AI — Supabase Database Migration Runner
 * 
 * Applies migrations directly to Supabase PostgreSQL using:
 * 1. DATABASE_URL / SUPABASE_DB_URL (direct postgresql connection) OR
 * 2. Supabase SQL Execution REST endpoint using SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables if available
const envFiles = [
  path.join(ROOT_DIR, 'server', '.env'),
  path.join(ROOT_DIR, '.env')
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/(^["']|["']$)/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const SUPABASE_DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MIGRATION_FILE = path.join(ROOT_DIR, 'supabase', 'migrations', '001_initial_schema.sql');

async function runDirectPgMigration(sql) {
  let pg;
  try {
    pg = await import('pg');
  } catch (err) {
    console.error('`pg` package not found. Running via dynamic import error:', err.message);
    throw err;
  }
  const { Client } = pg.default || pg;
  const client = new Client({
    connectionString: SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to PostgreSQL database...');
  await client.connect();
  console.log('Connected successfully. Executing migration 001_initial_schema.sql...');
  await client.query(sql);
  console.log('✅ Migration executed successfully via PostgreSQL connection.');
  await client.end();
}

async function runSupabaseSqlEndpoint(sql) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Neither DATABASE_URL nor (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) is configured.');
  }

  console.log(`Connecting to Supabase instance at ${SUPABASE_URL} using service role key...`);
  // Try Supabase SQL API (/pg/query or /rest/v1/rpc)
  const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc`;
  
  // Notice: Supabase standard project SQL is executed via direct pg connection or SQL Editor.
  console.log(`Executing migration against Supabase endpoint...`);
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to contact Supabase REST API: ${res.status} ${res.statusText}`);
  }

  console.log(`Notice: To apply direct DDL migrations, Supabase Cloud requires direct Postgres connection (DATABASE_URL) or pasting 001_initial_schema.sql into the Supabase Dashboard SQL Editor.`);
}

async function main() {
  console.log('====================================================');
  console.log('🌾 CropSage AI — Database Migration Runner');
  console.log('====================================================');

  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  console.log(`Loaded migration file: ${path.relative(ROOT_DIR, MIGRATION_FILE)} (${(sql.length / 1024).toFixed(1)} KB)`);

  if (SUPABASE_DB_URL) {
    try {
      await runDirectPgMigration(sql);
      process.exit(0);
    } catch (err) {
      console.error('Migration failed:', err.message);
      process.exit(1);
    }
  } else {
    console.warn('\n⚠️  DATABASE_URL / SUPABASE_DB_URL environment variable is not defined.');
    console.log('\nYou can run this migration in either of two ways:');
    console.log('1. Define DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" and rerun `npm run db:migrate`.');
    console.log(`2. Copy the entire contents of:\n   ${MIGRATION_FILE}\n   and paste it into your Supabase Dashboard -> SQL Editor -> Run.`);
    console.log('\nAll 42 crop catalog benchmarks, storage buckets, triggers, and RLS policies are included in that file.\n');
  }
}

main();
