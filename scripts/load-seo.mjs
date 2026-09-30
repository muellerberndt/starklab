import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// The browser and static lesson pages use the same metadata and URL rules.
export async function loadSeo() {
  const source = await readFile(new URL('../src/seo.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
