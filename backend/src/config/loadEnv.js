const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const repoRoot = path.resolve(__dirname, "../../../");

function buildCandidatePaths() {
  const envFile = process.env.ENV_FILE;

  if (!envFile) {
    return [path.join(repoRoot, ".env")];
  }

  if (path.isAbsolute(envFile)) {
    return [envFile, path.join(repoRoot, ".env")];
  }

  return [
    path.resolve(process.cwd(), envFile),
    path.resolve(repoRoot, envFile),
    path.join(repoRoot, ".env")
  ];
}

for (const candidatePath of buildCandidatePaths()) {
  if (!fs.existsSync(candidatePath)) {
    continue;
  }

  dotenv.config({
    path: candidatePath
  });
  break;
}
