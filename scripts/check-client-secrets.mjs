import fs from 'node:fs';
import path from 'node:path';

const CLIENT_DIR = path.resolve('client');
const FORBIDDEN_PATTERNS = [
  /GEMINI/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
];

let violations = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.vite') {
        continue;
      }
      scanDir(fullPath);
    } else if (entry.isFile()) {
      // Check file extensions
      if (/\.(ts|tsx|js|jsx|json|html|css|env.*)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(content)) {
            console.error(`❌ Security Violation in ${fullPath}: Detected forbidden secret pattern '${pattern}'`);
            violations++;
          }
        }
      }
    }
  }
}

console.log('🔒 Auditing client directory for server secrets...');
scanDir(CLIENT_DIR);

if (violations > 0) {
  console.error(`\n❌ Found ${violations} security violation(s) in client workspace! Secrets must NEVER leak to frontend.`);
  process.exit(1);
} else {
  console.log('✅ Client security audit passed. No server secrets detected.');
}
