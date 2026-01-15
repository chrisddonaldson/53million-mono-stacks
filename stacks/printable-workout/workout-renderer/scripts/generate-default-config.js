import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const sourcePath = path.resolve('../workout-yaml-package/data/upper-lower.yaml');
const targetPath = path.resolve('./src/defaultConfig.ts');

if (!fs.existsSync(sourcePath)) {
  console.error(`Cannot find YAML at ${sourcePath}`);
  process.exit(1);
}

const raw = fs.readFileSync(sourcePath, 'utf8');
const data = YAML.parse(raw);
const content = `// Auto-generated from ${path.relative(process.cwd(), sourcePath)}\nexport default ${JSON.stringify(data, null, 2)} as const;\n`;
fs.writeFileSync(targetPath, content, 'utf8');
console.log(`Wrote default config to ${targetPath}`);
