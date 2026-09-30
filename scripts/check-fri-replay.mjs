import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const temporary = await mkdtemp(path.join(tmpdir(), 'starklab-fri-replay-'));
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext };

try {
    // Run the actual lesson callback, so a change to its challenge or layer replay
    // is checked against the independent prover output below.
    const page = await readFile(path.join(root, 'src/pages/Fri.tsx'), 'utf8');
    const syntax = ts.createSourceFile('Fri.tsx', page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let callback;
    function visit(node) {
        if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)) {
            const names = node.name.elements.map(element => element.name.getText(syntax));
            if (names.includes('layers') && names.includes('betas') &&
                node.initializer && ts.isCallExpression(node.initializer)) {
                callback = node.initializer.arguments[0]?.getText(syntax);
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(syntax);
    assert.ok(callback, 'FRI lesson replay callback must exist');
    const callbackJs = ts.transpileModule(`const replay = ${callback};`, { compilerOptions }).outputText;
    const replay = new Function('proofData', 'Transcript', `${callbackJs}\nreturn replay();`);

    // The core stays unchanged. Transpile its TypeScript into a disposable directory
    // using the project's existing TypeScript dependency, with no browser required.
    for (const filename of await readdir(path.join(root, 'src/core'))) {
        if (!filename.endsWith('.ts')) continue;
        const source = await readFile(path.join(root, 'src/core', filename), 'utf8');
        const output = ts.transpileModule(source, { compilerOptions }).outputText
            .replace(/from (['"])(\.\/[^'"]+)\1/g, 'from $1$2.mjs$1');
        await writeFile(path.join(temporary, filename.replace(/\.ts$/, '.mjs')), output);
    }
    const load = name => import(pathToFileURL(path.join(temporary, `${name}.mjs`)).href);
    const { parseProgram, compileProgram } = await load('dsl');
    const { execute, collectRegisters } = await load('vm');
    const { buildAir, summarize } = await load('air');
    const { prove } = await load('prover');
    const { verify } = await load('verifier');
    const { Transcript, commit } = await load('transcript');
    const { add, mul, mod } = await load('math');
    const context = await readFile(path.join(root, 'src/contexts/StarkContext.tsx'), 'utf8');
    const source = context.match(/const DEFAULT_CODE = `([\s\S]*?)`;/)?.[1];
    assert.ok(source, 'Default lesson program must exist');
    const program = compileProgram(parseProgram(source));
    const registers = collectRegisters(program.steps);
    const trace = execute(program.steps, program.prime, registers);

    function checkReplay(proof, label) {
        const { layers, betas } = replay(proof, Transcript);
        assert.equal(layers.length, proof.friLayers.length + 1);
        assert.equal(betas.length, proof.friLayers.length);
        assert.deepEqual(layers[0], proof.quotientLDE);
        for (let index = 0; index < proof.friLayers.length; index++) {
            const values = layers[index];
            const half = values.length / 2;
            assert.equal(commit(values), proof.friLayers[index].commitment);
            const folded = values.slice(0, half).map((value, i) =>
                add(value, mul(betas[index], values[i + half], program.prime), program.prime));
            assert.deepEqual(folded, layers[index + 1], `${label}: fold ${index}`);
            for (const opening of proof.friQueryOpenings[index]) {
                assert.equal(folded[opening.index % half], opening.foldedValue);
            }
        }
        assert.deepEqual(layers.at(-1), [proof.friFinalValue]);
        console.log(`${label}: ${betas.length} challenges, layer commitments and half-offset folds match the proof`);
    }

    const air = buildAir(program.steps, trace, program.prime, registers);
    assert.equal(summarize(air).failures.length, 0);
    const validProof = prove(trace, air, program.prime, registers);
    assert.equal(verify(validProof).valid, true);
    checkReplay(validProof, 'Default program');

    // Valid traces produce a zero quotient in this toy prover, which would hide
    // incorrect pairing or challenges. A deliberately invalid trace supplies a
    // nonzero replay fixture; this check makes no acceptance claim about that trace.
    const changed = structuredClone(trace);
    changed[1].regs[registers[0]] = mod(changed[1].regs[registers[0]] + 1, program.prime);
    const changedAir = buildAir(program.steps, changed, program.prime, registers);
    assert.ok(summarize(changedAir).failures.length > 0);
    const nonzeroProof = prove(changed, changedAir, program.prime, registers);
    assert.ok(nonzeroProof.quotientLDE.some(value => value !== 0));
    checkReplay(nonzeroProof, 'Nonzero replay fixture');
} finally {
    await rm(temporary, { recursive: true, force: true });
}
