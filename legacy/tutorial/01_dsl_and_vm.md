# 1) The Learning DSL and Toy VM

We use a tiny scripting language to keep the focus on the *ideas*, not on RISC‑V details.

Everything runs in a small prime field **Fₚ** (integers modulo a prime `p`, e.g. `p = 97`).

## The language (by example)

```text
prime 97

# Fibonacci in a tiny “machine”
r0 = 0
r1 = 1

repeat 8:
  r2 = r0 + r1
  r0 = r1
  r1 = r2

halt
```

## Supported statements

### `prime <p>`
Sets the field prime `p`. All arithmetic is done **mod p**.

Constraints:
- `p` must be prime (for now we do a lightweight check in the UI and show a warning if it’s not).

### Assignments: `rX = <expr>`
Registers are named `r0`, `r1`, … (the UI currently supports up to `r7`).

Expressions supported right now:
- literal integer: `5`
- register: `r1`
- addition: `r0 + r1` (you can chain, e.g. `r0 + r1 + 3`)

Semantics:
- The right hand side is evaluated in the **current state**
- The result is reduced modulo `p`
- Only the destination register changes (others remain the same)

### `repeat N: ...`
Repeats a block of statements `N` times.

In the current tutorial prototype, `repeat` is *expanded* (“unrolled”) into `N` copies during compilation. Later we’ll introduce explicit branches and show how that affects the trace/AIR.

### `halt`
Stops execution. In the trace, we still include one “next row” after `halt` so we can write clean transition constraints.

## The Toy VM (state and execution)

At each step `i`, the machine has a state:

- `pc`: program counter (step number)
- `halted`: `0` or `1`
- registers: `r0..rk`

Execution produces a **trace**:

- row `0` is the initial state (`pc = 0`, `halted = 0`, all registers `0`)
- row `i+1` is the result of executing instruction `i` starting from row `i`

This “row i → row i+1” shape is exactly what we need for AIR: it gives us a clean way to write algebraic transition rules.

