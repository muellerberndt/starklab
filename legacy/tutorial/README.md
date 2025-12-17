# Interactive ZKP Tutorial (Toy VM)

This folder is the start of a **slow, step-by-step** walkthrough that teaches the core ideas behind zero-knowledge proofs (ZKPs) using a small “teaching VM” and a tiny scripting language.

The goal is to make the first steps *feel concrete*:

1. Write a small program (e.g. Fibonacci).
2. Execute it to produce a **trace** (a table of states over time).
3. Turn the trace + program rules into **AIR constraints** (algebraic equations).
4. (Next) Commit to the trace (Merkle), derive challenges (Fiat–Shamir), and prove low-degree (FRI).

## Quick start (interactive prototype)

Open `docs/interactive/index.html` in your browser.

If your browser blocks local file imports, serve it:

```bash
cd docs/interactive
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Where to go next

- `docs/tutorial/01_dsl_and_vm.md` – the learning DSL and the toy VM semantics
- `docs/tutorial/02_trace_and_air.md` – how we generate a trace and AIR constraints
- `docs/tutorial/03_roadmap.md` – how this grows into “real” STARK-style proofs

