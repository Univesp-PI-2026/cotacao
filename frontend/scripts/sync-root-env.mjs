import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '..');
const outputPath = path.join(projectRoot, 'src/environments/environment.shared.ts');
const envPath = path.join(repoRoot, '.env');

function parseEnvFile(content) {
  const variables = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    variables[key] = value;
  }

  return variables;
}

function resolveApiUrl(envVariables) {
  if (envVariables.FRONTEND_API_URL) {
    return envVariables.FRONTEND_API_URL;
  }

  if (envVariables.API_URL) {
    return envVariables.API_URL;
  }

  const backendPort = envVariables.BACKEND_PORT || envVariables.API_PORT || '3000';
  return `http://localhost:${backendPort}`;
}

let envVariables = {};

if (fs.existsSync(envPath)) {
  envVariables = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
}

const apiUrl = resolveApiUrl(envVariables);
const fileContents = `export const sharedEnvironment = {
  apiUrl: ${JSON.stringify(apiUrl)},
  productionApiUrl: '/api',
};
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileContents);
