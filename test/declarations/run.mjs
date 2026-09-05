import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const consumer = mkdtempSync(join(tmpdir(), 'ntv-declarations-'));
const compiler = fileURLToPath(new URL('../../node_modules/typescript/bin/tsc', import.meta.url));

try {
  const modules = join(consumer, 'node_modules');
  const installed = join(modules, 'nestable-tailwind-variants');
  mkdirSync(installed, { recursive: true });
  cpSync(new URL('../../dist', import.meta.url), join(installed, 'dist'), { recursive: true });
  cpSync(new URL('../../package.json', import.meta.url), join(installed, 'package.json'));
  symlinkSync(
    realpathSync(new URL('../../node_modules/tailwind-merge', import.meta.url)),
    join(modules, 'tailwind-merge'),
    'junction',
  );
  cpSync(new URL('./fixtures', import.meta.url), consumer, { recursive: true });
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));

  for (const [module, resolution] of [
    ['nodenext', 'nodenext'],
    ['preserve', 'bundler'],
  ]) {
    const flags = [
      compiler,
      '--ignoreConfig',
      '--strict',
      '--exactOptionalPropertyTypes',
      '--skipLibCheck',
      'false',
      '--module',
      module,
      '--moduleResolution',
      resolution,
      '--target',
      'esnext',
    ];
    execFileSync(
      process.execPath,
      [...flags, '--declaration', '--emitDeclarationOnly', '--outDir', 'types', 'producer.ts'],
      { cwd: consumer, stdio: 'inherit' },
    );
    execFileSync(process.execPath, [...flags, '--noEmit', 'consumer.ts'], {
      cwd: consumer,
      stdio: 'inherit',
    });
    console.log(
      `Consumer declaration generation and downstream types passed with ${resolution} resolution.`,
    );
  }
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
