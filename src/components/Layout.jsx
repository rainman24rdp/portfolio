import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      <nav className="nav">
        <Link to="/" className="logo">parm</Link>
        <div className="nav-links">
          <Link to="/about" className={isActive('/about') ? 'active' : ''}>about</Link>
          <Link to="/photography" className={isActive('/photography') ? 'active' : ''}>photos</Link>
        </div>
      </nav>
      <main className="main-content">{children}</main>
      <footer className="footer">
        <span>parm © {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

export default Layout;
