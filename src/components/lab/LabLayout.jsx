import { Link, useLocation } from 'react-router-dom';
import { experiments, statusLabels } from '../../config/experiments';
import './LabLayout.css';

function LabLayout({ children }) {
  const location = useLocation();
  const isLabIndex = location.pathname === '/lab';

  return (
    <div className="lab-layout">
      <aside className="lab-sidebar">
        <div className="lab-sidebar-header">
          <Link to="/lab" className="lab-logo">
            <span className="lab-logo-icon">⚗️</span>
            <span className="lab-logo-text">Lab</span>
          </Link>
          <Link to="/admin" className="lab-back-link">
            ← Admin
          </Link>
        </div>

        <nav className="lab-nav">
          <div className="lab-nav-section">
            <span className="lab-nav-title">Experiments</span>
            {experiments.map(exp => {
              const isActive = location.pathname === exp.route;
              const status = statusLabels[exp.status];
              return (
                <Link
                  key={exp.id}
                  to={exp.route}
                  className={`lab-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="lab-nav-icon">{exp.icon}</span>
                  <span className="lab-nav-label">{exp.name}</span>
                  <span
                    className="lab-nav-status"
                    style={{ background: status.color }}
                    title={status.label}
                  />
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="lab-sidebar-footer">
          <Link to="/lab" className={`lab-nav-item ${isLabIndex ? 'active' : ''}`}>
            <span className="lab-nav-icon">📊</span>
            <span className="lab-nav-label">Dashboard</span>
          </Link>
        </div>
      </aside>

      <main className="lab-main">
        {children}
      </main>
    </div>
  );
}

export default LabLayout;
