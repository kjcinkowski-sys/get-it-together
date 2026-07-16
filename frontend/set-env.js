// Bakes the API base URL into src/environments/environment.ts at build time.
//
// Angular resolves environment.* at build time, so the production API URL can't be
// read from the browser at runtime. This script lets the deploy host (Vercel) supply
// it as the API_URL environment variable instead of hardcoding it in the repo.
//
// Runs automatically before `npm run build` (npm "prebuild" lifecycle). When API_URL
// is not set — e.g. a plain local build — it leaves environment.ts untouched so the
// committed default value is used.

const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

const apiUrl = process.env.API_URL;

if (!apiUrl) {
  console.log('[set-env] API_URL not set — leaving environment.ts unchanged.');
  process.exit(0);
}

const contents = `export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(apiUrl)},
};
`;

const target = join(__dirname, 'src', 'environments', 'environment.ts');
writeFileSync(target, contents);
console.log(`[set-env] Wrote environment.ts with apiUrl=${apiUrl}`);
