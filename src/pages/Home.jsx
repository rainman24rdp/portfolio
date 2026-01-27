import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

// Spotify Now Playing Component
function NowPlaying() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch('/api/now-playing');
        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (error) {
        console.error('Error fetching now playing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNowPlaying();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNowPlaying, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data || !data.isPlaying) {
    return null;
  }

  return (
    <a
      href={data.songUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="now-playing"
    >
      <div className="now-playing-icon">
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
      <div className="now-playing-info">
        <span className="now-playing-label">Now playing</span>
        <span className="now-playing-song">{data.title}</span>
        <span className="now-playing-artist">{data.artist}</span>
      </div>
      {data.albumImageUrl && (
        <img
          src={data.albumImageUrl}
          alt={data.album}
          className="now-playing-album"
        />
      )}
    </a>
  );
}

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

        <NowPlaying />
      </div>
    </div>
  );
}

export default Home;
