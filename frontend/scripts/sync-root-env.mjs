import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '..');
const outputPath = path.join(projectRoot, 'src/environments/environment.shared.ts');

function resolveEnvPath() {
  const envFile = process.env.ENV_FILE;

  if (!envFile) {
    const defaultPath = path.join(repoRoot, '.env');
    return fs.existsSync(defaultPath) ? defaultPath : null;
  }

  const candidatePaths = path.isAbsolute(envFile)
    ? [envFile]
    : [
        path.resolve(process.cwd(), envFile),
        path.resolve(repoRoot, envFile),
      ];

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

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

const envPath = resolveEnvPath();
let envVariables = {};

if (envPath) {
  envVariables = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
}

envVariables = {
  ...envVariables,
  ...process.env,
};

const apiUrl = resolveApiUrl(envVariables);
const fileContents = `export const sharedEnvironment = {
  apiUrl: ${JSON.stringify(apiUrl)},
  productionApiUrl: '/api',
};
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileContents);
