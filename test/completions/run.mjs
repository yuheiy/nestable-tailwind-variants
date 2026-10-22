import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { API } from 'typescript/unstable/sync';

const fixture = readFileSync(new URL('./fixture.tsx', import.meta.url), 'utf8');
const directory = mkdtempSync(join(tmpdir(), 'ntv-completions-'));
const config = join(directory, 'tsconfig.json');
const file = join(directory, 'fixture.tsx');
writeFileSync(join(directory, 'package.json'), JSON.stringify({ type: 'module' }));
writeFileSync(
  config,
  JSON.stringify({
    compilerOptions: {
      strict: true,
      exactOptionalPropertyTypes: true,
      target: 'ESNext',
      module: 'NodeNext',
      jsx: 'preserve',
      noEmit: true,
    },
    files: ['fixture.tsx'],
  }),
);

try {
  for (const entry of ['src/index.js', 'dist/index.js']) {
    const target = fileURLToPath(new URL(`../../${entry}`, import.meta.url));
    const source = fixture.replace('../../src/index.js', target);
    writeFileSync(file, source);
    const api = new API({ cwd: directory });
    try {
      const snapshot = api.updateSnapshot({ openProjects: [config] });
      try {
        const project = snapshot.getProject(config);
        assert(project, `${entry} project is available`);
        const diagnostics = [
          ...project.program.getConfigFileParsingDiagnostics(),
          ...project.program.getProgramDiagnostics(),
          ...project.program.getGlobalDiagnostics(),
          ...project.program.getSyntacticDiagnostics(),
          ...project.program.getBindDiagnostics(),
          ...project.program.getSemanticDiagnostics(),
        ];
        assert.deepEqual(diagnostics, [], `${entry} fixture has no diagnostics`);
        const stateKeys = ['isDisabled', 'isFocused', 'tone'];
        const cases = {
          'direct-choice': stateKeys,
          'extended-default': [...stateKeys, 'size'],
          inherited: ['size'],
          'choice-values': ['primary', 'secondary', '$default'],
          'direct-jsx': stateKeys,
          'extended-jsx': [...stateKeys, 'size'],
          'optional-callback': [...stateKeys, 'size'],
        };
        for (const [marker, expected] of Object.entries(cases)) {
          const position = source.indexOf(`/* ${marker} */`);
          assert(position >= 0, `${marker} cursor exists`);
          const result = project.checker.getCompletionsAtPosition(file, position, {});
          const names = result?.entries.map((item) => item.name.replace(/\?$/, '')) ?? [];
          for (const name of expected)
            assert(names.includes(name), `${entry} ${marker} is missing ${name}`);
        }
      } finally {
        snapshot.dispose();
      }
    } finally {
      api.close();
    }
    console.log(`Nested contextual completions passed for ${entry}.`);
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
