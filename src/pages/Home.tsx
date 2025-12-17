import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function Home() {
    return (
        <div className="space-y-8">
            <div className="card glass">
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    Welcome to <span style={{ color: 'var(--accent-secondary)' }}>STARK Lab</span>
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '16px' }}>
                    An interactive, step-by-step tutorial to understand STARK proofs intuitively.
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                    You can write your own simple programs (or use the default Fibonacci example), generate an execution trace,
                    and walk through the entire STARK proving process—from constraints to polynomials to FRI.
                </p>
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="card">
                    <h3>Interactive Learning</h3>
                    <p>Play with variables, generate traces, and see constraints check out in real-time.</p>
                </div>
                <div className="card">
                    <h3>From Scratch</h3>
                    <p>Start with basic finite fields and build up to a full Zero-Knowledge proof.</p>
                </div>
                <div className="card">
                    <h3>Visual Explanations</h3>
                    <p>See the math come alive with dynamic visualizations and clear explanations.</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
                <Link to="/math" className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '16px 32px' }}>
                    Start the Journey <ArrowRight size={20} />
                </Link>
            </div>
        </div>
    );
}
