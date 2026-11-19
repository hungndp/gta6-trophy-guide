// Vice City Trophy Atlas — entry program for make.fun's gta6-trophy-guide-01.
// Copies app/ and screenshots/ into the output directory and writes dossier.json
// with the kit's buildDossier. The output directory itself is NEVER deleted:
// the grader makes /output writable but not its parent, so removing it would
// fail with EACCES. Only the directory's CONTENTS are cleared, then rebuilt.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const rootDir = new URL('.', import.meta.url).pathname;

function clearContents(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else cpSync(from, to);
  }
}

function main(): void {
  mkdirSync(outDir, { recursive: true });
  clearContents(outDir);
  copyTree(join(rootDir, 'app'), join(outDir, 'app'));
  copyTree(join(rootDir, 'screenshots'), join(outDir, 'screenshots'));
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 48 * 1024 * 1024,
    app_path_max_bytes: 1000
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

main();
