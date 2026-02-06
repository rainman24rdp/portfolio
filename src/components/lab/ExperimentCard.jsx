import { Link } from 'react-router-dom';
import { statusLabels } from '../../config/experiments';
import './ExperimentCard.css';

function ExperimentCard({ experiment }) {
  const status = statusLabels[experiment.status];

  return (
    <Link to={experiment.route} className="experiment-card">
      <div className="experiment-card-header">
        <span className="experiment-icon">{experiment.icon}</span>
        <span
          className="experiment-status"
          style={{ background: status.color }}
        >
          {status.label}
        </span>
      </div>

      <h3 className="experiment-name">{experiment.name}</h3>
      <p className="experiment-description">{experiment.description}</p>

      <div className="experiment-footer">
        {experiment.tags && (
          <div className="experiment-tags">
            {experiment.tags.map(tag => (
              <span key={tag} className="experiment-tag">{tag}</span>
            ))}
          </div>
        )}
        {experiment.requiresBackend && (
          <span className="experiment-backend-badge" title="Requires backend">
            ⚡ Backend
          </span>
        )}
      </div>
    </Link>
  );
}

export default ExperimentCard;
