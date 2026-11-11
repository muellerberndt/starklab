import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    Menu,
    X,
} from 'lucide-react';
import './Layout.css';
import { WALKTHROUGH_STEPS } from '../routes/walkthrough';
import { WalkthroughNav } from './WalkthroughNav';

function Caret() {
    return (
        <a href="https://floatingpragma.ai/" className="brand-caret" aria-label="Pragma Research">
            <svg viewBox="-1 -1 17 16" aria-hidden="true" fill="currentColor" shapeRendering="crispEdges">
                <rect x="6" y="0" width="3" height="2" />
                <rect x="5" y="2" width="5" height="2" />
                <rect x="4" y="4" width="3" height="2" /><rect x="8" y="4" width="3" height="2" />
                <rect x="3" y="6" width="3" height="2" /><rect x="9" y="6" width="3" height="2" />
                <rect x="2" y="8" width="3" height="2" /><rect x="10" y="8" width="3" height="2" />
                <rect x="1" y="10" width="3" height="2" /><rect x="11" y="10" width="3" height="2" />
                <rect x="0" y="12" width="3" height="2" /><rect x="12" y="12" width="3" height="2" />
            </svg>
        </a>
    );
}

export function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="layout">
            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''} `}>
                <div className="sidebar-header">
                    <span className="brand"><Caret /><span className="logo">STARK Lab</span></span>
                    <button
                        className="close-btn"
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={{ display: 'none' }} // Only show on mobile via CSS if needed, but CSS handles visibility of sidebar itself
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="nav">
                    {WALKTHROUGH_STEPS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="main-content">
                <header className="mobile-header">
                    <button
                        className="menu-btn"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <span className="brand" style={{ marginLeft: '16px' }}><Caret /><span className="logo">STARK Lab</span></span>
                </header>

                <main className="content-scroll">
                    <div className="content-container">
                        <Outlet />
                        <WalkthroughNav />

                        <footer style={{
                            marginTop: '64px',
                            paddingTop: '32px',
                            borderTop: '1px solid var(--border-color)',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.9em'
                        }}>
                            <p>
                                <a href="https://floatingpragma.ai/" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Pragma Research</a> • <a href="https://floatingpragma.ai/awesome-zk-proofs/" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>ZK Proofs</a> • <a href="https://floatingpragma.ai/awesome-ai-security/" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>AI Security</a> • <a href="https://floatingpragma.ai/work/" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Work</a>
                            </p>
                            <p style={{ marginTop: '8px' }}>
                                (c) Bernhard Mueller • <a href="https://twitter.com/muellerberndt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>@muellerberndt</a> • <a href="https://github.com/muellerberndt/starklab" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>GitHub</a>
                            </p>
                        </footer>
                    </div>
                </main>
            </div>
        </div>
    );
}
