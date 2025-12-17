# STARK Tutorial Web App - Implementation Plan

## Goal
Refactor the existing single-page STARK tutorial into a comprehensive, beautiful, and interactive web application. The app will guide users through the entire STARK proof generation process, from DSL program to Zero-Knowledge proof.

## User Review Required
- **Tech Stack**: I plan to use **Vite + React** for the framework and **Vanilla CSS** for styling (as per system instructions for maximum flexibility and "wow" factor).
- **Structure**: The app will be structured as a step-by-step interactive tutorial.

## Proposed Changes

### 1. Project Setup
- Initialize a new Vite + React project in the root directory (or a `web` subdirectory if preferred, but root is likely better for a "refactor").
- Configure build tools and linting.

### 2. Core Logic Porting (The "Engine")
- Extract the existing `app.js` logic into typed TypeScript modules (if possible, otherwise clean JS modules).
- **Modules**:
    - `dsl`: Parser and Compiler.
    - `vm`: Execution engine (Trace generation).
    - `air`: AIR constraint generation and checking.
    - `math`: Finite field arithmetic helpers.

### 3. UI/UX Redesign
- **Layout**: A persistent sidebar or top navigation bar showing the progress through the STARK pipeline.
- **Theme**: Dark mode, glassmorphism, vibrant colors (neon accents on dark background).
- **Components**:
    - `CodeEditor`: For the DSL input (maybe use a lightweight library or custom textarea with highlighting).
    - `TraceTable`: Interactive table for viewing and editing the execution trace.
    - `ConstraintViewer`: Visualizer for AIR constraints.
    - `StepExplainer`: Textual explanation with "Next" navigation.

### 4. New Chapter Skeletons
Create placeholder pages/components for the roadmap items:
- **Chapter 0: Math Foundations** (Finite Fields, Interactive Arithmetic) - *New*
- **Chapter 1: Trace & AIR** (Ported from existing)
- **Chapter 2: Commitments** (Merkle Trees) - *Skeleton*
- **Chapter 3: Composition** (Random Linear Combination) - *Skeleton*
- **Chapter 4: FRI** (Low-degree testing) - *Skeleton*
- **Chapter 5: Zero-Knowledge** (Blinding) - *Skeleton*

### 5. Integration
- Connect the "Engine" to the UI components.
- Ensure state persists between steps (e.g., the trace generated in Chapter 1 is used in Chapter 2).

## Verification Plan
### Automated Tests
- Unit tests for the ported `dsl`, `vm`, and `air` modules to ensure they match the original behavior.
- Build check using `npm run build`.

### Manual Verification
- Run the app locally.
- Verify the "Fibonacci" example runs and generates the correct trace.
- Navigate through all skeleton pages to ensure routing works.
