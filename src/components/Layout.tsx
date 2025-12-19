import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    Menu,
    X,
} from 'lucide-react';
import './Layout.css';
import { WALKTHROUGH_STEPS } from '../routes/walkthrough';
import { WalkthroughNav } from './WalkthroughNav';

export function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="layout">
            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''} `}>
                <div className="sidebar-header">
                    <span className="logo">STARK Lab</span>
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
                    <span className="logo" style={{ marginLeft: '16px' }}>STARK Lab</span>
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
                                (c) Bernhard Mueller • <a href="https://twitter.com/muellerberndt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>@muellerberndt</a> • <a href="https://github.com/muellerberndt/starklab" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>GitHub</a>
                            </p>
                        </footer>
                    </div>
                </main>
            </div>
        </div>
    );
}
