import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WALKTHROUGH_STEPS } from '../routes/walkthrough';

function normalizePathname(pathname: string): string {
    if (pathname.length > 1 && pathname.endsWith('/')) return pathname.replace(/\/+$/g, '');
    return pathname;
}

export function WalkthroughNav() {
    const { pathname } = useLocation();
    const current = normalizePathname(pathname);

    const idx = WALKTHROUGH_STEPS.findIndex((s) => s.to === current);
    if (idx === -1) return null;

    const prev = idx > 0 ? WALKTHROUGH_STEPS[idx - 1] : null;
    const next = idx < WALKTHROUGH_STEPS.length - 1 ? WALKTHROUGH_STEPS[idx + 1] : null;
    if (!prev && !next) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', gap: '16px' }}>
            <div>
                {prev && (
                    <Link to={prev.to} className="btn btn-ghost">
                        <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                        Back: {prev.label}
                    </Link>
                )}
            </div>
            <div>
                {next && (
                    <Link to={next.to} className="button">
                        Next: {next.label}
                        <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                    </Link>
                )}
            </div>
        </div>
    );
}

