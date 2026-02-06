import { experiments, statusLabels, getExperimentsByStatus } from '../../config/experiments';
import ExperimentCard from '../../components/lab/ExperimentCard';
import './Lab.css';

function Lab() {
  const activeExperiments = getExperimentsByStatus('active');
  const wipExperiments = getExperimentsByStatus('wip');
  const ideaExperiments = getExperimentsByStatus('idea');
  const archivedExperiments = getExperimentsByStatus('archived');

  const stats = {
    total: experiments.length,
    active: activeExperiments.length,
    wip: wipExperiments.length,
    ideas: ideaExperiments.length,
  };

  return (
    <div className="lab-dashboard">
      <header className="lab-header">
        <div className="lab-header-content">
          <h1>Experiment Lab</h1>
          <p>A sandbox for pet projects and ideas. Hidden from the public portfolio.</p>
        </div>
      </header>

      <div className="lab-stats">
        <div className="lab-stat">
          <span className="lab-stat-value">{stats.total}</span>
          <span className="lab-stat-label">Total</span>
        </div>
        <div className="lab-stat">
          <span className="lab-stat-value" style={{ color: statusLabels.active.color }}>
            {stats.active}
          </span>
          <span className="lab-stat-label">Active</span>
        </div>
        <div className="lab-stat">
          <span className="lab-stat-value" style={{ color: statusLabels.wip.color }}>
            {stats.wip}
          </span>
          <span className="lab-stat-label">In Progress</span>
        </div>
        <div className="lab-stat">
          <span className="lab-stat-value" style={{ color: statusLabels.idea.color }}>
            {stats.ideas}
          </span>
          <span className="lab-stat-label">Ideas</span>
        </div>
      </div>

      {wipExperiments.length > 0 && (
        <section className="lab-section">
          <h2>
            <span className="section-status" style={{ background: statusLabels.wip.color }} />
            Work in Progress
          </h2>
          <div className="experiments-grid">
            {wipExperiments.map(exp => (
              <ExperimentCard key={exp.id} experiment={exp} />
            ))}
          </div>
        </section>
      )}

      {activeExperiments.length > 0 && (
        <section className="lab-section">
          <h2>
            <span className="section-status" style={{ background: statusLabels.active.color }} />
            Active Experiments
          </h2>
          <div className="experiments-grid">
            {activeExperiments.map(exp => (
              <ExperimentCard key={exp.id} experiment={exp} />
            ))}
          </div>
        </section>
      )}

      {ideaExperiments.length > 0 && (
        <section className="lab-section">
          <h2>
            <span className="section-status" style={{ background: statusLabels.idea.color }} />
            Ideas
          </h2>
          <div className="experiments-grid">
            {ideaExperiments.map(exp => (
              <ExperimentCard key={exp.id} experiment={exp} />
            ))}
          </div>
        </section>
      )}

      {archivedExperiments.length > 0 && (
        <section className="lab-section">
          <h2>
            <span className="section-status" style={{ background: statusLabels.archived.color }} />
            Archived
          </h2>
          <div className="experiments-grid">
            {archivedExperiments.map(exp => (
              <ExperimentCard key={exp.id} experiment={exp} />
            ))}
          </div>
        </section>
      )}

      {experiments.length === 0 && (
        <div className="lab-empty">
          <span className="lab-empty-icon">🧪</span>
          <h3>No experiments yet</h3>
          <p>Add your first experiment to the registry to get started.</p>
        </div>
      )}
    </div>
  );
}

export default Lab;
