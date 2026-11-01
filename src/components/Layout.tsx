import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  ArrowLeftRight ,
  Users,
  UsersRound,
  UserRoundCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { PhoneCall } from 'lucide-react';

export default function Layout({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = profile.role === 'admin';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

const [reportsOpen, setReportsOpen] = useState(
  location.pathname.startsWith('/reports')
);

  const items = admin
  ? [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/leads', label: 'All leads', icon: Users },
      { to: '/telecallers', label: 'Telecallers', icon: Users },
      { to: '/import', label: 'Import leads', icon: FileSpreadsheet },
      { to: '/transfer-leads', label: 'Transfer Leads', icon: ArrowLeftRight },
      { to: '/follow-ups', label: 'Follow-ups', icon: CalendarDays },
      { to: '/callbacks', label: 'Admin callbacks', icon: UserRoundCheck },
      { to: '/call-logs', label: 'Call Logs', icon: PhoneCall },
    ]
  : [
      { to: '/', label: 'My dashboard', icon: LayoutDashboard },
      { to: '/leads', label: 'My leads', icon: Users },
      { to: '/follow-ups', label: 'My follow-ups', icon: CalendarDays },
    ];
  const currentItem = items.find(item =>
    item.to === '/'
      ? location.pathname === '/'
      : location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`)
  );

  async function logout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      {mobileNavOpen && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside id="primary-navigation" className={`sidebar${mobileNavOpen ? ' mobile-nav-open' : ''}`}>
        <div className="brand">
          <img className="brand-logo" src="/mind2pixel-logo.svg" alt="Mind2Pixel" />
        </div>

        <div className="workspace-label">WORKSPACE</div>

        
<nav className="nav-stack">
  {items.map(item => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
      onClick={() => setMobileNavOpen(false)}
    >
      <item.icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  ))}

  {admin && (
    <div className="report-nav-group">
      <button
        type="button"
        className={`side-link side-button ${
          location.pathname.startsWith('/reports') ? 'active' : ''
        }`}
        onClick={() => setReportsOpen(value => !value)}
        aria-expanded={reportsOpen}
      >
        <ChartNoAxesCombined size={18} />
        <span>Reports</span>
        <ChevronDown
          size={15}
          className={`report-chevron ${reportsOpen ? 'open' : ''}`}
        />
      </button>

      <div className={`report-subnav ${reportsOpen ? 'expanded' : ''}`}>
  <div className="report-subnav-inner">
    <NavLink to="/reports" onClick={() => setMobileNavOpen(false)} className={({ isActive }) =>
      `report-subnav-link ${isActive ? 'active' : ''}`
    }>
      All Report
    </NavLink>

    <NavLink to="/reports/progress" onClick={() => setMobileNavOpen(false)} className={({ isActive }) =>
      `report-subnav-link ${isActive ? 'active' : ''}`
    }>
      Progress Report
    </NavLink>

    <NavLink to="/reports/leads" onClick={() => setMobileNavOpen(false)} className={({ isActive }) =>
      `report-subnav-link ${isActive ? 'active' : ''}`
    }>
      Lead Report
    </NavLink>
  </div>
</div>
    </div>
  )}
</nav>


        {admin && (
          <>
            <div className="workspace-label mt-4">MANAGEMENT</div>

            <button
              className={`side-link side-button ${
                location.pathname === '/users' ? 'active' : ''
              }`}
              onClick={() => { setMobileNavOpen(false); navigate('/users'); }}
            >
              <ShieldCheck size={18} />
              <span>User management</span>
            </button>

            <button
              className={`side-link side-button ${
                location.pathname === '/settings' ? 'active' : ''
              }`}
              onClick={() => { setMobileNavOpen(false); navigate('/settings'); }}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </>
        )}

        <div className="sidebar-bottom">
          

          <button className="profile-row" onClick={() => { setMobileNavOpen(false); void logout(); }}>
            <div className="avatar">
              {profile.full_name?.slice(0, 1).toUpperCase() || 'U'}
            </div>
            <div className="profile-copy">
              <strong>{profile.full_name}</strong>
              <span>{admin ? 'Administrator' : 'Telecaller'}</span>
            </div>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-nav-toggle"
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-controls="primary-navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(value => !value)}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb-text">
              Workspace <span>/</span>{' '}
              <strong>{currentItem?.label || 'Lead details'}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <span className="online-dot"></span>
            <span className="topbar-status">Workspace active</span>
            <div className="topbar-avatar">
              {profile.full_name?.slice(0, 1).toUpperCase() || 'U'}
            </div>
            <ChevronDown size={15} className="text-muted" />
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
