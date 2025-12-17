# 2) From Program → Trace → AIR

This is the first “real” ZKP idea:

- a program defines **allowed transitions** between states
- a trace claims “here are the states I visited”
- AIR constraints are algebraic equations that check the trace follows the rules

We’ll do this over a small prime field Fₚ so you can see numbers wrap around.

## The trace

For a program with `T` instructions, we build `T + 1` trace rows:

- Row `0`: initial state
- For each step `i` (0-based), executing instruction `i` produces row `i+1`

Each row contains:

- `pc`
- `halted`
- registers `r0..rk`

## AIR (Algebraic Intermediate Representation)

AIR constraints are equations that must equal **0** (mod `p`).

We split them into two types:

### Boundary constraints (row 0)
These fix the starting point, for example:

- `pc(0) - 0 = 0`
- `halted(0) - 0 = 0`
- `r0(0) - 0 = 0`, `r1(0) - 0 = 0`, …

### Transition constraints (row i → row i+1)
Each instruction gives a set of equations linking the “before” row `i` and the “after” row `i+1`.

Example: if the instruction is `r2 = r0 + r1`, then we enforce:

- `pc(i+1) - (pc(i) + 1) = 0`
- `r2(i+1) - (r0(i) + r1(i)) = 0`
- `r0(i+1) - r0(i) = 0`
- `r1(i+1) - r1(i) = 0`
- (and so on for registers that should not change)

All equations are evaluated **mod p**.

## Why this is useful for ZK proofs

If a prover can convince a verifier that:

1) there exists some trace, and  
2) all AIR constraints are satisfied,

then the verifier learns “the program was executed correctly” without needing to re-run it step-by-step.

The remaining work (Merkle commitments, Fiat–Shamir, FRI) makes this check *succinct* and *verifiable with only a few random openings*.

