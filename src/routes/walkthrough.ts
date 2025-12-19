import {
    BookOpen,
    Calculator,
    Cpu,
    Database,
    GitCommit,
    Layers,
    MessageSquare,
    Search,
    Settings,
    ShieldCheck,
    type LucideIcon,
} from 'lucide-react';

export type WalkthroughStep = {
    to: string;
    label: string;
    icon: LucideIcon;
};

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
    { to: '/', icon: BookOpen, label: 'Introduction' },
    { to: '/math', icon: Calculator, label: 'Basics I: Fields & Trees' },
    { to: '/encoding', icon: GitCommit, label: 'Basics II: Encoding' },
    { to: '/constraint-eval', icon: GitCommit, label: 'Basics III: Constraints' },
    { to: '/prover-verifier', icon: ShieldCheck, label: 'Basics IV: Prover & Verifier' },
    { to: '/protocol', icon: MessageSquare, label: 'The STARK Protocol' },
    { to: '/trace', icon: Cpu, label: '1. Trace & AIR' },
    { to: '/polynomials', icon: Layers, label: '1.5 Polynomials' },
    { to: '/commitments', icon: Database, label: '2. Commitments' },
    { to: '/composition', icon: Layers, label: '3. Composition' },
    { to: '/composition-details', icon: Layers, label: '3.5 Composition Details' },
    { to: '/fri', icon: Search, label: '4. FRI' },
    { to: '/zk', icon: ShieldCheck, label: '5. Zero-Knowledge' },
    { to: '/verify', icon: ShieldCheck, label: '6. Proof Check' },
    { to: '/proof-security', icon: ShieldCheck, label: '6.5 Proof Security' },
    { to: '/glossary', icon: BookOpen, label: 'Glossary' },
    { to: '/resources', icon: BookOpen, label: 'Further Reading' },
    { to: '/implementation', icon: Settings, label: 'Implementation Details' },
];

