import './Projects.css';

function Projects() {
  const projects = [
    {
      id: 1,
      title: 'Project One',
      description: 'A brief description of your first project and what technologies were used.',
      tech: 'React, CSS, JavaScript',
      link: '#'
    },
    {
      id: 2,
      title: 'Project Two',
      description: 'A brief description of your second project and what it accomplishes.',
      tech: 'Node.js, Express, MongoDB',
      link: '#'
    },
    {
      id: 3,
      title: 'Project Three',
      description: 'A brief description of your third project and its unique features.',
      tech: 'React, TypeScript, API',
      link: '#'
    }
  ];

  return (
    <div className="projects">
      <h1>Projects</h1>
      <p className="projects-intro">Things I've built.</p>

      <div className="projects-list">
        {projects.map((project) => (
          <a key={project.id} href={project.link} className="project-item">
            <div className="project-content">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <span className="project-tech">{project.tech}</span>
            </div>
            <span className="project-arrow">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default Projects;
