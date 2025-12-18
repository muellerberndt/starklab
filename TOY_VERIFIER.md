# Toy STARK Verifier Plan (Implementation + UI)

This document describes a step-by-step plan to turn the current “Proof Check” page into a real **toy STARK** proof verifier.

The goal is:
- Implement an actual proof object (commitments + openings + FRI queries) and verify it.
- Keep the UI changes minimal: the existing Verifier page should “play back” the verification steps with small, inspectable artifacts.

Non-goal:
- Production security, performance, or complete STARK feature coverage.

---

## Simplify Further (Recommended v0)

We can simplify the first “real toy STARK” iteration substantially while still feeling realistic to end users:

- Fix parameters instead of making them user-configurable at first:
  - Prime: start with `p=97`.
  - Max trace length: cap to `N ≤ 32` (pad to next power of two).
  - Blowup: `B=4` (so `M = N*B ≤ 128`, and `128 | (97-1)` holds).
  - Queries: `q=2` (later increase to 4–8).
- Use “slow but simple” math:
  - Barycentric Lagrange interpolation for LDE (no FFT).
  - Small domains only; correctness > speed.
- Commit to fewer things:
  - A single Merkle commitment to a packed row-wise trace-LDE table (instead of per-column trees).
  - A single Merkle commitment to the quotient codeword `Q` (which is what we run FRI on).
- Keep AIR simple:
  - Only the current toy VM constraints.
  - Boundary constraints handled with a simple “only at step 0” mask (Lagrange basis evaluation).
- Keep FRI minimal but real:
  - Implement FRI only for `Q` (low-degree of the quotient).
  - Commit to each FRI layer (Merkle root), verify a couple of queries through the folding path.
- Keep transcript minimal but real:
  - Fiat–Shamir derives `α` (composition weights), `β_i` (FRI folds), and query indices.
  - Challenges are derived from Merkle roots (commitments).

This “v0 toy STARK” already delivers the four “coming soon” bullets in a meaningful way, without requiring production-grade optimizations or a complex UI.

---

## 0) Current State (Today)

What we do now:
- Run the DSL program to generate the full execution trace.
- Evaluate *all* AIR constraints on the full trace.
- “Commitment/FRI” steps are conceptual and not cryptographically verified.

What this means:
- Correctness is checked by recomputation (not succinct).
- There is no proof artifact that can be verified independently.

---

## 1) Target “Toy STARK” Scope

We will implement:
1. Fiat–Shamir transcript: derive challenges by hashing commitments.
2. Real commitments: Merkle roots + Merkle path verification for queried openings.
3. Low-degree verification:
   - Build a low-degree extension (LDE) domain.
   - Compute constraint composition and quotient evaluations over the LDE domain.
   - Prove low degree via a real FRI query phase.
4. Succinctness: verify using a few random queries instead of checking the entire trace.

We will simplify:
- Keep the field small (start with `p=97` and `N ≤ 32`), then generalize later.
- Keep AIR limited to the current toy VM (no selector columns / complex CPU AIR).
- O(n²) interpolation/evaluation is acceptable for small traces.
- No zero-knowledge masking initially.

---

## 2) High-Level Protocol Sketch (Toy)

Inputs:
- Trace rows (private to prover in “real” ZK; in this app we can still show them).
- AIR constraints defining valid transitions.

Parameters (toy defaults):
- Base trace length `N = nextPow2(trace.length)` (cap at 32 for `p=97`).
- Blowup factor `B` (e.g. 4).
- LDE domain size `M = N * B`.
- Number of queries `q` (e.g. 2–4).

Proof outline:
1. Prover builds LDE evaluations for each trace column on domain `D_lde` (size `M`).
2. Prover computes constraint composition evaluations `H(x)` on `D_lde`.
3. Prover computes vanishing polynomial evaluations `Z(x)` for base domain embedded in `D_lde`.
4. Prover computes quotient evaluations `Q(x) = H(x) / Z(x)` pointwise on `D_lde` (for points where `Z(x) ≠ 0`).
5. Prover commits (Merkle) to:
   - Trace column LDE tables (or a packed row-wise table)
   - Quotient table `Q`
   - FRI layers for `Q`
6. Fiat–Shamir derives:
   - random coefficients `α` for constraint composition
   - FRI folding challenges `β_i`
   - query indices `i_1..i_q`
7. Prover provides openings (decommitments) at those indices:
   - required trace column values for each queried index and its “next-step” index
   - `Q(i)`
   - all Merkle authentication paths
   - FRI openings along the query path
8. Verifier checks:
   - Merkle paths match roots
   - local constraint residuals at queried points
   - `H(i) == Q(i) * Z(i)` at queried points
   - FRI query consistency across layers

---

## 3) Engine Work Plan (Step-by-Step)

### Step 1 — Field utilities
Add a proper field module:
- `add/sub/mul`
- `pow`
- `inv` (Fermat since prime field)
- `div`

Acceptance:
- Unit tests for inverses and basic identities.

### Step 2 — Domain construction (roots of unity)
Implement:
- `nextPow2(n)`
- `findRootOfUnity(p, order)` where `order | (p-1)`
- `domainPoints(order)` returning `[g^0, g^1, ..., g^(order-1)]`
- Mapping between base domain and LDE domain:
  - `gN` has order `N`
  - `gM` has order `M`
  - base points are indices `{0, B, 2B, ...}`
  - “next-step shift” on LDE indices is `+B (mod M)`

Acceptance:
- For `p=97`, demonstrate `N≤32` works and `M=N*B` works when `M | (p-1)`.
- Clear error messages when the user’s chosen `prime` cannot support the domain.

### Step 3 — Lagrange evaluation helper (toy interpolation)
We need to evaluate “the unique degree < N polynomial matching samples on base domain” at arbitrary points.

Implement barycentric Lagrange:
- Precompute weights `w_i = 1 / ∏_{j≠i}(x_i - x_j)`
- Evaluate at `x`:
  - if `x == x_i`, return `y_i`
  - else return `(∑ w_i * y_i / (x - x_i)) / (∑ w_i / (x - x_i))`

Acceptance:
- Given samples on base domain, evaluation matches at base points.
- Works for small N (≤32).

### Step 4 — LDE of trace columns
For each trace column `T_col` (values length `N`):
- Interpret samples as values at base points `x_i = gN^i`.
- Evaluate the interpolant over the LDE domain points `x_j = gM^j` to produce `T_col_lde[j]`.

Acceptance:
- For indices `j = i*B`, `T_col_lde[j] == T_col[i]`.

### Step 5 — Constraint evaluation on the LDE domain
We need to compute constraint residuals on `D_lde` using “current” and “next” values:
- At LDE index `j`, current values come from `T_col_lde[j]`.
- Next-step values come from `T_col_lde[(j + B) % M]`.

For each AIR constraint, define an evaluator that consumes a small map of needed columns and returns the residual in `F_p`.

Acceptance:
- For honest trace, residuals are zero at base indices `j=i*B`.
- For a tampered trace, residuals become non-zero at a detectable fraction of queried indices.

### Step 6 — Composition polynomial `H`
Choose random `α_k` (from transcript) and combine constraints:
- `H(j) = Σ α_k * C_k(j)` over `D_lde`.

Boundary constraints:
- Minimal toy approach: multiply boundary residual by the Lagrange basis polynomial `L_0(x)` so it only “matters” at step 0.
  - We only need `L_0(x)` evaluated over `D_lde`.

Acceptance:
- `H` is zero on base indices if and only if trace satisfies constraints.

### Step 7 — Vanishing polynomial `Z` and quotient `Q`
Base subgroup vanishing polynomial for order `N`:
- `Z_N(x) = x^N - 1`

Evaluate on LDE domain points:
- `Z[j] = (x_j^N - 1) mod p`

Quotient:
- For points with `Z[j] != 0`: `Q[j] = H[j] / Z[j]`
- For points with `Z[j] == 0`: set `Q[j] = 0` (verifier never checks those points for quotient relation in the toy version)

Acceptance:
- For randomly chosen query indices outside the base subgroup, `H(j) == Q(j) * Z(j)` holds.

### Step 8 — Merkle commitments
Implement a real Merkle tree commitment over an array of field elements:
- Canonical encoding (e.g. `uint32` little-endian for small p) and SHA-256 hashing.
- Build root.
- Provide authentication path for an index.
- Verify path to root.

Acceptance:
- Unit tests: open/verify for random indices.

### Step 9 — Fiat–Shamir transcript
Implement a transcript that:
- absorbs: Merkle roots, parameters
- squeezes: challenges `α`, `β_i`, and query indices

Acceptance:
- Deterministic (same inputs → same challenges).

### Step 10 — FRI (toy but real query verification)
Implement a basic radix-2 FRI for a power-of-two domain:
- Prover:
  - commits to each layer codeword via Merkle root
  - folds with `β_i` to halve size each round
  - ends at a constant (or very small) layer, reveals it
- Verifier:
  - derives `β_i` from transcript
  - for each query index, checks openings are consistent across layers
  - verifies Merkle paths for each opened value

Degree bound:
- Keep a simple bound initially (“small enough”), then tighten later.

Acceptance:
- Verifier rejects if prover provides inconsistent folding openings.

### Step 11 — Proof object
Define a `ToyStarkProof` structure containing:
- parameters (`p`, `N`, `B`, `M`, `q`)
- trace commitments (one per column or one packed commitment)
- quotient commitment
- FRI commitments + final layer
- query openings (values + Merkle paths)

Acceptance:
- `prove(trace, air, params) -> proof`
- `verify(air, params, proof) -> { ok, steps }`

---

## 4) UI Work Plan (Keep It Minimal)

We’ll keep the Verifier UI as a list of steps with PASS/FAIL, and add “details” sections per step.

### Step A — Data plumbing
- Store a `proof` in context (or local state in Verifier page).
- Provide a single “Generate Proof” action (can live on Proof Check page initially).

### Step B — Step-by-step playback
Verifier page shows:
1. Parse parameters / domain selection
2. Read commitments (roots)
3. Derive transcript challenges
4. Verify Merkle openings at each query
5. Verify local constraints at queries
6. Verify quotient relation at queries
7. Verify FRI query consistency
8. Final accept/reject

Each step should show only a few concrete artifacts:
- roots (shortened)
- a small list of challenges (α, β)
- query indices
- one query’s opened values (expandable)

### Step C — Failure UX
If verification fails:
- show which step failed
- show which query index failed
- show the mismatched equation (e.g. `H != Q*Z`)

---

## 5) Suggested Implementation Milestones

Milestone 1 (v0 parameters + primitives):
- Fix `p=97`, `N≤32`, `B=4`, `q=2`.
- Implement SHA-256 Merkle tree + openings (real commitment verification).
- Implement a transcript that derives challenges from commitments.

Milestone 2 (LDE + quotient pipeline):
- Implement barycentric LDE for trace columns.
- Implement composition `H` and quotient `Q = H/Z` on the LDE domain.
- Commit to packed trace-LDE rows + `Q`.

Milestone 3 (query phase):
- Generate proof openings for a few indices (derived from transcript).
- Verify Merkle openings + local constraints + quotient relation at those indices.

Milestone 4 (FRI):
- Add FRI commitments for `Q` and query consistency verification.

Milestone 5 (docs + cleanup):
- Tighten error messages and add brief explanatory text to Proof Check.

---

## 6) What We Will Explicitly Leave Out (For Now)

- Zero-knowledge masking (random low-degree masks, blinded LDEs).
- DEEP composition / out-of-domain sampling.
- Optimized FFT/NTT implementations.
- Production hashing/performance/security hardening.
- A general-purpose AIR with selector columns for arbitrary instruction sets.
