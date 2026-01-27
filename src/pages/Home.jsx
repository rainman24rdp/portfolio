import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      {/* Noise texture overlay */}
      <div className="noise-overlay"></div>

      {/* Animated accent line */}
      <svg className="accent-line" viewBox="0 0 200 200" preserveAspectRatio="none">
        <path
          d="M 0,100 Q 50,50 100,100 T 200,100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

      <div className="hero">
        <p className="hero-greeting">hey, i'm</p>
        <h1 className="hero-name">parm</h1>
        <p className="hero-tagline">
          engineering manager building APIs & integrations at <a href="https://ironcladapp.com" target="_blank" rel="noopener noreferrer" className="ironclad-link">Ironclad</a>
        </p>
        <p className="hero-sub">
          js fanatic · foodie · sf startup enthusiast
        </p>
        <div className="hero-links">
          <Link to="/about">more about me</Link>
          <span className="divider">·</span>
          <Link to="/photography">see my work</Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
