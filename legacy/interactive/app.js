const DEFAULT_PROGRAMS = {
  fibonacci: `prime 97

# Fibonacci (toy VM)
# r0, r1 are the current pair; r2 is a temp
r0 = 0
r1 = 1

repeat 8:
  r2 = r0 + r1
  r0 = r1
  r1 = r2

halt
`,
  wraparound: `prime 17

# Wraparound demo: everything is mod p
r0 = 16
r1 = 3
r2 = r0 + r1

halt
`,
};

function mod(n, p) {
  const r = n % p;
  return r < 0 ? r + p : r;
}

function isProbablyPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) {
    if (n % d === 0) return false;
  }
  return true;
}

function parseProgram(text) {
  const lines = text.split(/\r?\n/);
  const root = { type: "block", indent: 0, stmts: [] };
  const stack = [root];
  let pendingRepeat = null;

  function currentBlock() {
    return stack[stack.length - 1];
  }

  function countIndent(raw) {
    const expanded = raw.replace(/\t/g, "    ");
    let i = 0;
    while (i < expanded.length && expanded[i] === " ") i += 1;
    return i;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const original = lines[i];
    const noComment = original.split("#")[0].replace(/\s+$/g, "");
    if (noComment.trim().length === 0) continue;

    const indent = countIndent(noComment);
    const content = noComment.trim();

    if (pendingRepeat) {
      if (indent <= pendingRepeat.parentIndent) {
        throw new Error(
          `Line ${i + 1}: expected an indented block after 'repeat ${pendingRepeat.times}:'`
        );
      }
      stack.push({ type: "block", indent, stmts: pendingRepeat.body });
      pendingRepeat = null;
      // continue parsing this line inside the new block
    } else {
      while (indent < currentBlock().indent) stack.pop();
      if (indent !== currentBlock().indent) {
        throw new Error(`Line ${i + 1}: unexpected indentation`);
      }
    }

    // (recompute after pendingRepeat push)
    while (indent < currentBlock().indent) stack.pop();
    if (indent !== currentBlock().indent) {
      throw new Error(`Line ${i + 1}: unexpected indentation`);
    }

    // Statements
    const repeatMatch = content.match(/^repeat\s+(\d+)\s*:\s*$/);
    if (repeatMatch) {
      const times = Number.parseInt(repeatMatch[1], 10);
      if (!Number.isFinite(times) || times < 0) {
        throw new Error(`Line ${i + 1}: invalid repeat count`);
      }
      const node = { type: "repeat", times, body: [], line: i + 1, text: content };
      currentBlock().stmts.push(node);
      pendingRepeat = { body: node.body, times, parentIndent: indent };
      continue;
    }

    if (content === "halt") {
      currentBlock().stmts.push({ type: "halt", line: i + 1, text: content });
      continue;
    }

    const primeMatch = content.match(/^prime\s*(?:=\s*)?(\d+)\s*$/);
    if (primeMatch) {
      const value = Number.parseInt(primeMatch[1], 10);
      if (!Number.isFinite(value) || value < 2) {
        throw new Error(`Line ${i + 1}: invalid prime`);
      }
      currentBlock().stmts.push({ type: "prime", value, line: i + 1, text: content });
      continue;
    }

    const assignMatch = content.match(/^(r\d+)\s*=\s*(.+)$/);
    if (!assignMatch) {
      throw new Error(`Line ${i + 1}: could not parse statement`);
    }
    const target = assignMatch[1];
    const exprText = assignMatch[2].trim();
    const expr = parseExpr(exprText, i + 1);
    currentBlock().stmts.push({ type: "assign", target, expr, line: i + 1, text: content });
  }

  if (pendingRepeat) {
    throw new Error(`Line ${lines.length}: repeat block has no body`);
  }

  return root.stmts;
}

function parseExpr(text, lineNo) {
  const parts = text.split("+").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) throw new Error(`Line ${lineNo}: empty expression`);
  const terms = parts.map((t) => parseTerm(t, lineNo));
  if (terms.length === 1) return terms[0];
  return { type: "add", terms, text };
}

function parseTerm(text, lineNo) {
  if (/^r\d+$/.test(text)) return { type: "reg", name: text, text };
  if (/^\d+$/.test(text)) return { type: "lit", value: Number.parseInt(text, 10), text };
  throw new Error(`Line ${lineNo}: invalid term '${text}'`);
}

function compileProgram(stmts) {
  let prime = 97;
  const steps = [];
  let seenHalt = false;

  function emitStep(step) {
    if (seenHalt) {
      throw new Error(`Line ${step.source.line}: code after halt is not allowed`);
    }
    steps.push(step);
    if (step.kind === "halt") seenHalt = true;
  }

  function walk(list) {
    for (const s of list) {
      if (s.type === "prime") {
        prime = s.value;
        continue;
      }
      if (s.type === "repeat") {
        for (let i = 0; i < s.times; i += 1) walk(s.body);
        continue;
      }
      if (s.type === "halt") {
        emitStep({ kind: "halt", source: { line: s.line, text: s.text } });
        continue;
      }
      if (s.type === "assign") {
        const kind = classifyAssign(s.expr);
        emitStep({
          kind,
          target: s.target,
          expr: s.expr,
          source: { line: s.line, text: s.text },
        });
        continue;
      }
      throw new Error(`Line ${s.line}: unknown statement type '${s.type}'`);
    }
  }

  walk(stmts);
  if (steps.length === 0) {
    throw new Error("Program is empty (no executable statements)");
  }
  return { prime, steps };
}

function classifyAssign(expr) {
  if (expr.type === "lit") return "set";
  if (expr.type === "reg") return "mov";
  if (expr.type === "add") return "add";
  return "assign";
}

function evalExpr(expr, regs, p) {
  if (expr.type === "lit") return mod(expr.value, p);
  if (expr.type === "reg") return regs[expr.name] ?? 0;
  if (expr.type === "add") {
    const sum = expr.terms.reduce((acc, t) => acc + evalExpr(t, regs, p), 0);
    return mod(sum, p);
  }
  throw new Error(`Unknown expr type '${expr.type}'`);
}

function collectRegisters(steps) {
  const names = new Set(["r0", "r1", "r2"]);
  function visitExpr(expr) {
    if (expr.type === "reg") names.add(expr.name);
    if (expr.type === "add") expr.terms.forEach(visitExpr);
  }
  for (const s of steps) {
    if (s.target) names.add(s.target);
    if (s.expr) visitExpr(s.expr);
  }
  const arr = [...names].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const capped = arr.filter((r) => Number(r.slice(1)) >= 0 && Number(r.slice(1)) <= 7);
  return capped;
}

function execute(steps, p, regNames) {
  const regs = {};
  for (const r of regNames) regs[r] = 0;

  const rows = [];
  let state = { pc: 0, halted: 0, regs: { ...regs } };
  rows.push(state);

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const next = {
      pc: state.pc + 1,
      halted: state.halted,
      regs: { ...state.regs },
    };

    if (state.halted !== 0) {
      throw new Error(`Step ${i}: attempted to execute while halted`);
    }

    if (step.kind === "halt") {
      next.halted = 1;
    } else {
      const target = step.target;
      if (!regNames.includes(target)) {
        throw new Error(`Line ${step.source.line}: unsupported register '${target}' (use r0..r7)`);
      }
      next.regs[target] = evalExpr(step.expr, state.regs, p);
    }

    rows.push(next);
    state = next;
  }

  return rows;
}

function buildAir(steps, rows, p, regNames) {
  const boundary = [];
  boundary.push({
    id: "pc0",
    expr: "pc(0) - 0 = 0",
    eval: () => mod(rows[0].pc - 0, p),
    why: "The trace starts at pc = 0.",
  });
  boundary.push({
    id: "halted0",
    expr: "halted(0) - 0 = 0",
    eval: () => mod(rows[0].halted - 0, p),
    why: "The machine starts unhalted.",
  });
  for (const r of regNames) {
    boundary.push({
      id: `init_${r}`,
      expr: `${r}(0) - 0 = 0`,
      eval: () => mod(rows[0].regs[r] - 0, p),
      why: `All registers start at 0 in this toy VM.`,
    });
  }

  const transitions = [];
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const curr = rows[i];
    const next = rows[i + 1];
    const constraints = [];

    constraints.push({
      id: `halted_curr_${i}`,
      expr: `halted(${i}) = 0`,
      eval: () => mod(curr.halted - 0, p),
      why: "We only execute instructions while halted=0.",
    });

    constraints.push({
      id: `pc_step_${i}`,
      expr: `pc(${i + 1}) - (pc(${i}) + 1) = 0`,
      eval: () => mod(next.pc - (curr.pc + 1), p),
      why: "Each step increments the program counter by 1.",
    });

    if (step.kind === "halt") {
      constraints.push({
        id: `halted_next_${i}`,
        expr: `halted(${i + 1}) - 1 = 0`,
        eval: () => mod(next.halted - 1, p),
        why: "HALT sets halted=1.",
      });
      for (const r of regNames) {
        constraints.push({
          id: `halt_keep_${r}_${i}`,
          expr: `${r}(${i + 1}) - ${r}(${i}) = 0`,
          eval: () => mod(next.regs[r] - curr.regs[r], p),
          why: "HALT does not change registers.",
        });
      }
    } else {
      constraints.push({
        id: `halted_next_${i}`,
        expr: `halted(${i + 1}) - 0 = 0`,
        eval: () => mod(next.halted - 0, p),
        why: "Normal instructions keep halted=0.",
      });

      const target = step.target;
      const exprValue = evalExpr(step.expr, curr.regs, p);
      constraints.push({
        id: `write_${target}_${i}`,
        expr: `${target}(${i + 1}) - (${prettyExpr(step.expr)}) = 0`,
        eval: () => mod(next.regs[target] - exprValue, p),
        why: `This enforces the assignment '${step.source.text}'.`,
      });

      for (const r of regNames) {
        if (r === target) continue;
        constraints.push({
          id: `keep_${r}_${i}`,
          expr: `${r}(${i + 1}) - ${r}(${i}) = 0`,
          eval: () => mod(next.regs[r] - curr.regs[r], p),
          why: "Registers not written by the instruction stay the same.",
        });
      }
    }

    transitions.push({
      stepIndex: i,
      source: step.source,
      kind: step.kind,
      constraints,
    });
  }

  return { boundary, transitions };
}

function prettyExpr(expr) {
  if (expr.type === "lit") return String(expr.value);
  if (expr.type === "reg") return expr.name;
  if (expr.type === "add") return expr.terms.map(prettyExpr).join(" + ");
  return "?";
}

function summarize(air) {
  let total = 0;
  let failing = 0;
  const failures = [];

  for (const c of air.boundary) {
    total += 1;
    const v = c.eval();
    if (v !== 0) {
      failing += 1;
      failures.push({ where: "boundary", expr: c.expr, value: v });
    }
  }

  for (const t of air.transitions) {
    for (const c of t.constraints) {
      total += 1;
      const v = c.eval();
      if (v !== 0) {
        failing += 1;
        failures.push({ where: `step ${t.stepIndex}`, expr: c.expr, value: v });
      }
    }
  }

  return { total, failing, failures };
}

// -----------------------------------------------------------------------------
// UI
// -----------------------------------------------------------------------------

const dom = {
  primeInput: document.getElementById("primeInput"),
  primeHint: document.getElementById("primeHint"),
  programInput: document.getElementById("programInput"),
  exampleSelect: document.getElementById("exampleSelect"),
  loadExampleBtn: document.getElementById("loadExampleBtn"),
  runBtn: document.getElementById("runBtn"),
  resetBtn: document.getElementById("resetBtn"),
  editTraceToggle: document.getElementById("editTraceToggle"),
  errorBox: document.getElementById("errorBox"),
  traceTableWrap: document.getElementById("traceTableWrap"),
  airWrap: document.getElementById("airWrap"),
  explainWrap: document.getElementById("explainWrap"),
  stepSlider: document.getElementById("stepSlider"),
  stepLabel: document.getElementById("stepLabel"),
  statusBadge: document.getElementById("statusBadge"),
  statusText: document.getElementById("statusText"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  contents: {
    trace: document.getElementById("tab-trace"),
    air: document.getElementById("tab-air"),
    explain: document.getElementById("tab-explain"),
  },
};

let model = null;

function setError(text) {
  dom.errorBox.textContent = text ?? "";
}

function setPrimeHint(p) {
  if (!Number.isFinite(p)) {
    dom.primeHint.textContent = "";
    return;
  }
  if (isProbablyPrime(p)) {
    dom.primeHint.textContent = `Working in the field F_${p}. All arithmetic wraps around mod ${p}.`;
    dom.primeHint.style.color = "rgba(255,255,255,0.62)";
  } else {
    dom.primeHint.textContent = `Warning: ${p} does not look prime. (Fields require prime modulus.)`;
    dom.primeHint.style.color = "var(--warn)";
  }
}

function setStatus(summary) {
  if (!summary) {
    dom.statusBadge.textContent = "Not run";
    dom.statusBadge.className = "badge";
    dom.statusText.textContent = "";
    return;
  }
  if (summary.failing === 0) {
    dom.statusBadge.textContent = "All constraints satisfied";
    dom.statusBadge.className = "badge badge--good";
    dom.statusText.textContent = `${summary.total} constraints checked`;
  } else {
    dom.statusBadge.textContent = "Constraint failures";
    dom.statusBadge.className = "badge badge--bad";
    dom.statusText.textContent = `${summary.failing} / ${summary.total} failing`;
  }
}

function render() {
  if (!model) {
    dom.traceTableWrap.innerHTML = "";
    dom.airWrap.innerHTML = "";
    dom.explainWrap.innerHTML = `<p class="muted">Run a program to see an explanation.</p>`;
    setStatus(null);
    return;
  }

  const step = Number(dom.stepSlider.value);
  dom.stepLabel.textContent = String(step);

  renderTrace(step);
  renderAir(step);
  renderExplain(step);

  setStatus(summarize(model.air));
}

function renderTrace(step) {
  const { rows, regNames, p } = model;
  const edit = dom.editTraceToggle.checked;

  const headerCells = ["i", "pc", "halted", ...regNames];
  const ths = headerCells.map((h) => `<th>${escapeHtml(h)}</th>`).join("");

  const trs = rows
    .map((row, i) => {
      const highlight = i === step || i === step + 1;
      const cls = highlight ? "highlight" : "";
      const values = {
        pc: row.pc,
        halted: row.halted,
        ...row.regs,
      };

      const tds = headerCells
        .map((key) => {
          if (key === "i") return `<td>${i}</td>`;
          const raw = values[key];
          if (!edit) return `<td>${raw}</td>`;
          return `<td>${renderCellInput({ rowIndex: i, key, value: raw, p })}</td>`;
        })
        .join("");

      return `<tr class="${cls}">${tds}</tr>`;
    })
    .join("");

  dom.traceTableWrap.innerHTML = `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;

  if (edit) {
    for (const input of dom.traceTableWrap.querySelectorAll("input.cell")) {
      input.addEventListener("change", onTraceEdit);
    }
  }
}

function renderCellInput({ rowIndex, key, value, p }) {
  return `<input class="cell" data-row="${rowIndex}" data-key="${escapeHtml(
    key
  )}" type="number" value="${value}" step="1" />`;
}

function onTraceEdit(e) {
  if (!model) return;
  const input = e.target;
  const rowIndex = Number(input.dataset.row);
  const key = input.dataset.key;
  const value = Number.parseInt(input.value, 10);
  if (!Number.isFinite(value)) return;

  const p = model.p;
  const v = mod(value, p);

  const row = model.rows[rowIndex];
  if (key === "pc" || key === "halted") {
    row[key] = v;
  } else {
    row.regs[key] = v;
  }

  render();
}

function renderAir(step) {
  const { air, p } = model;

  const boundaryCards = air.boundary.map((c) => renderConstraint(c, p)).join("");
  const transition = air.transitions[step];
  const transitionCards = transition
    ? transition.constraints.map((c) => renderConstraint(c, p)).join("")
    : `<p class="muted">No step selected.</p>`;

  dom.airWrap.innerHTML = `
    <div class="card" style="background: var(--card-strong); border-color: rgba(255,255,255,0.14);">
      <h2>Boundary constraints (row 0)</h2>
      ${boundaryCards}
    </div>
    <div class="card" style="background: var(--card-strong); border-color: rgba(255,255,255,0.14);">
      <h2>Transition constraints (step ${step})</h2>
      ${
        transition
          ? `<p class="muted">From line ${transition.source.line}: <span class="mono">${escapeHtml(
              transition.source.text
            )}</span></p>`
          : ""
      }
      ${transitionCards}
    </div>
  `;
}

function renderConstraint(c, p) {
  const v = c.eval();
  const ok = v === 0;
  const pillCls = ok ? "pill pill--good" : "pill pill--bad";
  const label = ok ? "0" : String(v);
  return `
    <div class="constraint">
      <div>
        <div class="constraint__expr">${escapeHtml(c.expr)}</div>
        <div class="muted">${escapeHtml(c.why ?? "")}</div>
      </div>
      <div class="constraint__meta">
        <span class="${pillCls}">${label}</span>
        <span class="muted">mod ${p}</span>
      </div>
    </div>
  `;
}

function renderExplain(step) {
  const t = model.air.transitions[step];
  if (!t) {
    dom.explainWrap.innerHTML = `<p class="muted">No step selected.</p>`;
    return;
  }

  const header = `<p class="muted">Line ${t.source.line}</p><p class="mono">${escapeHtml(
    t.source.text
  )}</p>`;

  const body = {
    set: `This step writes a constant into a register (mod p).`,
    mov: `This step copies one register into another (mod p).`,
    add: `This step adds values in Fₚ: the result wraps around mod p.`,
    halt: `This step sets halted=1. The trace still includes a “next row” so we can write a clean transition rule.`,
  }[t.kind];

  const tip = `<div class="card" style="margin-top: 12px;">
    <h2>Try to cheat</h2>
    <p class="muted">
      Toggle “Edit trace (cheat mode)”, change a register value in the trace table, and watch which AIR constraints turn non-zero.
    </p>
  </div>`;

  dom.explainWrap.innerHTML = `${header}<p class="muted">${escapeHtml(body ?? "")}</p>${tip}`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setActiveTab(name) {
  for (const tab of dom.tabs) {
    const on = tab.dataset.tab === name;
    tab.classList.toggle("tab--active", on);
  }
  for (const [key, el] of Object.entries(dom.contents)) {
    el.classList.toggle("content--active", key === name);
  }
}

function loadExample(name) {
  dom.programInput.value = DEFAULT_PROGRAMS[name] ?? DEFAULT_PROGRAMS.fibonacci;
  const p = extractPrimeFromProgram(dom.programInput.value) ?? 97;
  dom.primeInput.value = String(p);
  setPrimeHint(p);
}

function reset() {
  loadExample("fibonacci");
  dom.editTraceToggle.checked = false;
  setError("");
  model = null;
  dom.stepSlider.value = "0";
  dom.stepSlider.max = "0";
  render();
}

function run() {
  setError("");
  try {
    const parsed = parseProgram(dom.programInput.value);
    const compiled = compileProgram(parsed);

    const p = compiled.prime;
    dom.primeInput.value = String(p);
    setPrimeHint(p);

    const regNames = collectRegisters(compiled.steps);
    const rows = execute(compiled.steps, p, regNames);
    const air = buildAir(compiled.steps, rows, p, regNames);

    model = {
      p,
      steps: compiled.steps,
      rows,
      regNames,
      air,
    };

    dom.stepSlider.min = "0";
    dom.stepSlider.max = String(Math.max(0, compiled.steps.length - 1));
    dom.stepSlider.value = "0";
    render();
  } catch (err) {
    model = null;
    dom.stepSlider.value = "0";
    dom.stepSlider.max = "0";
    setError(err instanceof Error ? err.message : String(err));
    render();
  }
}

dom.tabs.forEach((t) =>
  t.addEventListener("click", () => {
    setActiveTab(t.dataset.tab);
  })
);

dom.runBtn.addEventListener("click", run);
dom.resetBtn.addEventListener("click", reset);
dom.loadExampleBtn.addEventListener("click", () => loadExample(dom.exampleSelect.value));
dom.stepSlider.addEventListener("input", render);
dom.editTraceToggle.addEventListener("change", render);
dom.primeInput.addEventListener("input", () => {
  const p = Number.parseInt(dom.primeInput.value, 10);
  setPrimeHint(p);
  if (Number.isFinite(p) && p >= 2) {
    dom.programInput.value = setProgramPrimeInText(dom.programInput.value, p);
  }
});

// Bootstrap
setActiveTab("trace");
reset();
setPrimeHint(Number.parseInt(dom.primeInput.value, 10));

function extractPrimeFromProgram(text) {
  for (const line of text.split(/\r?\n/)) {
    const noComment = line.split("#")[0].trim();
    if (noComment.length === 0) continue;
    const m = noComment.match(/^prime\s*(?:=\s*)?(\d+)\s*$/);
    if (m) return Number.parseInt(m[1], 10);
  }
  return null;
}

function setProgramPrimeInText(text, p) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^(\s*)prime\b.*$/);
    if (m) {
      lines[i] = `${m[1]}prime ${p}`;
      return lines.join("\n");
    }
  }
  return `prime ${p}\n\n${text}`;
}
