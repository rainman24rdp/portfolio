import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <p className="hero-greeting">hey, i'm</p>
        <h1 className="hero-name">Parimal</h1>
        <p className="hero-tagline">
          engineer building APIs & integrations at <a href="https://ironcladapp.com" target="_blank" rel="noopener noreferrer" className="ironclad-link">Ironclad</a>
        </p>
        <p className="hero-sub">
          js fanatic · foodie · indy startup enthusiast
        </p>
        <div className="hero-links">
          <Link to="/about">more about me</Link>
          <span className="divider">·</span>
          <Link to="/projects">see my work</Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
