import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './Layout.css';
import { WALKTHROUGH_STEPS } from '../routes/walkthrough';
import { WalkthroughNav } from './WalkthroughNav';

const companyLinks = ['Cadence', 'Demos', 'Robotics', 'Research', 'Investors', 'Work'];

export function Layout() {
    const [chaptersOpen, setChaptersOpen] = useState(false);
    const [companyOpen, setCompanyOpen] = useState(false);
    const chaptersButton = useRef<HTMLButtonElement>(null);
    const companyButton = useRef<HTMLButtonElement>(null);
    const sidebar = useRef<HTMLElement>(null);
    const header = useRef<HTMLElement>(null);
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    useEffect(() => {
        const screen = matchMedia('(min-width: 1001px)');
        const close = () => { setChaptersOpen(false); setCompanyOpen(false); };
        screen.addEventListener('change', close);
        window.addEventListener('popstate', close);
        return () => { screen.removeEventListener('change', close); window.removeEventListener('popstate', close); };
    }, []);
    useEffect(() => {
        const dismiss = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (chaptersOpen) { setChaptersOpen(false); chaptersButton.current?.focus(); }
            if (companyOpen) { setCompanyOpen(false); companyButton.current?.focus(); }
        };
        const outside = (event: PointerEvent) => {
            if (!header.current?.contains(event.target as Node)) setCompanyOpen(false);
        };
        document.addEventListener('keydown', dismiss);
        document.addEventListener('pointerdown', outside);
        return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', outside); };
    }, [chaptersOpen, companyOpen]);
    useEffect(() => {
        if (!chaptersOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const panel = sidebar.current;
        panel?.querySelector<HTMLButtonElement>('.close-btn')?.focus();
        const trap = (event: KeyboardEvent) => {
            if (event.key !== 'Tab' || !panel) return;
            const items = [...panel.querySelectorAll<HTMLElement>('a[href],button')].filter(el => el.offsetParent !== null);
            const first = items[0], last = items.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        document.addEventListener('keydown', trap);
        return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', trap); };
    }, [chaptersOpen]);
    const closeChapters = () => { setChaptersOpen(false); chaptersButton.current?.focus(); };
    return (
        <div className="layout">
            <a className="skip-link" href="#lesson">Skip to lesson</a>
            <header className="company-header" ref={header}>
                <div className="company-header-inner">
                    <a className="wordmark" href="https://floatingpragma.io/" aria-label="Pragma Research home"><span className="wordmark-text">PRAGMA<small>RESEARCH</small></span><svg className="brand-mark" viewBox="25 15 50 60" width="24" height="29" aria-hidden="true"><polygon points="50,20 30,70 38,70 50,38 62,70 70,70" fill="currentColor" /></svg></a>
                    <button ref={companyButton} className="company-menu" aria-controls="company-nav" aria-expanded={companyOpen} onClick={() => { setCompanyOpen(!companyOpen); setChaptersOpen(false); }}>Menu {companyOpen ? <X size={20} /> : <Menu size={20} />}</button>
                    <nav id="company-nav" className={companyOpen ? 'company-nav open' : 'company-nav'} aria-label="Pragma Research">{companyLinks.map(label => <a key={label} href={`https://floatingpragma.io/${label.toLowerCase()}/`}>{label}</a>)}<a className="company-contact" href="mailto:bernhard@floatingpragma.ai">Let’s talk ↗</a></nav>
                </div>
            </header>
            <div className="lab-mobile-bar"><Link to="/" className="lab-title">STARK Lab</Link><button ref={chaptersButton} className="menu-btn" aria-controls="lab-chapters" aria-expanded={chaptersOpen} onClick={() => { setChaptersOpen(!chaptersOpen); setCompanyOpen(false); }}>Chapters <Menu size={20} /></button></div>
            <div className="lab-body">
                {chaptersOpen && <button className="chapter-backdrop" tabIndex={-1} aria-label="Close chapters" onClick={closeChapters} />}
                <aside ref={sidebar} id="lab-chapters" className={`sidebar ${chaptersOpen ? 'open' : ''}`} aria-label="STARK Lab chapters">
                    <div className="sidebar-header"><div><p className="eyebrow">Interactive mathematics</p><Link to="/" className="lab-title" onClick={closeChapters}>STARK Lab</Link></div><button className="close-btn" aria-label="Close chapters" onClick={closeChapters}><X size={22} /></button></div>
                    <nav className="lesson-nav" aria-label="Tutorial chapters">{WALKTHROUGH_STEPS.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeChapters}><item.icon size={18} aria-hidden="true" /><span>{item.label}</span></NavLink>)}</nav>
                    <a className="lab-source" href="https://github.com/muellerberndt/starklab">Explore the source ↗</a>
                </aside>
                <main className="main-content" id="lesson" tabIndex={-1}><div className="content-container"><Outlet /><WalkthroughNav /><footer className="lab-footer"><p>STARK Lab · Pragma Research</p><p>An interactive teaching implementation by Bernhard Mueller.</p><div><a href="https://floatingpragma.io/research/">Research</a><a href="https://floatingpragma.io/work/#platforms">More mathematical work</a><a href="https://github.com/muellerberndt/starklab">Source code ↗</a></div></footer></div></main>
            </div>
        </div>
    );
}
