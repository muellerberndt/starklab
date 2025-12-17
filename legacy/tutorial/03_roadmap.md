# 3) Roadmap: from AIR to a real proof

The interactive prototype currently focuses on the **first big idea**:

> Program → Trace → AIR constraints

The next steps to turn “constraints exist” into a real STARK-style proof are:

1. **Commit to big tables (Merkle trees)**  
   Commit to the whole trace so the prover can’t change answers later.

2. **Make randomness non-interactive (Fiat–Shamir)**  
   Replace verifier randomness with `challenge = H(transcript)`.

3. **Reduce many constraints to one (composition)**  
   Combine many equations into one random linear combination.

4. **Prove low-degree without revealing everything (FRI)**  
   FRI lets you check that a function is “close to a low-degree polynomial” using a few random queries.

5. **Add zero-knowledge (masking/blinding)**  
   Soundness isn’t enough — we add randomness so openings don’t leak private trace data.

Later we’ll add a “mapping to ZP1” chapter that shows where each concept lives in the real codebase:

- Trace columns: `crates/trace/src/columns.rs:335`
- AIR constraints: `crates/air/src/rv32im.rs:320`
- Prover pipeline: `crates/prover/src/stark.rs:245`
- FRI folding: `crates/prover/src/fri.rs:176`

