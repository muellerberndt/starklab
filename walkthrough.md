# STARK Tutorial Web App Walkthrough

I have successfully refactored the STARK tutorial into a modern, interactive web application using **Vite + React**.

## Changes Overview

### 1. Project Structure
- **Root**: The project is now a Vite app in the root directory.
- **Legacy**: The original files have been moved to `legacy/` for reference.
- **Source**:
    - `src/core`: Contains the ported logic (DSL parser, VM, AIR constraints, Math).
    - `src/components`: UI components (Layout, Sidebar).
    - `src/pages`: Page components for each chapter.
    - `src/styles`: Global styles and themes.

### 2. Core Logic Porting
I extracted the logic from the original `app.js` into typed TypeScript modules:
- `src/core/math.ts`: Finite field arithmetic.
- `src/core/dsl.ts`: Parser and compiler for the toy assembly language.
- `src/core/vm.ts`: Execution engine that generates the trace.
- `src/core/air.ts`: AIR constraint generation and checking.

### 3. UI/UX Redesign
- **Theme**: Implemented a "Cyberpunk/Sci-Fi" aesthetic with dark background (`#0a0a0f`), neon accents (`#7000ff`, `#00e5ff`), and glassmorphism effects.
- **Navigation**: A persistent sidebar allows easy navigation between chapters.
- **Responsive**: The layout adapts to mobile screens with a hamburger menu.

### 4. New Content
- **Chapter 0: Math Foundations**: A new page allowing users to experiment with Finite Field arithmetic interactively.
- **Skeletons**: Created placeholder pages for the future chapters (Trace, Commitments, Composition, FRI, ZK).

## How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## Next Steps
- **Port Trace UI**: Connect the `TracePage` to the `dsl` and `vm` modules to recreate the original interactive functionality.
- **Implement Future Chapters**: Fill in the content for Commitments, Composition, FRI, and ZK.
