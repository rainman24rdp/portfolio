// Experiments Registry
// Add new experiments here to have them auto-appear in the lab dashboard

export const experiments = [
  {
    id: 'imessage-bridge',
    name: 'iMessage Bridge',
    description: 'Claude-powered iMessage drafting via Moltbot. Messages come in, get drafted by AI, and you approve before sending.',
    status: 'wip',  // 'active' | 'wip' | 'archived' | 'idea'
    route: '/lab/imessage-bridge',
    icon: '💬',
    requiresBackend: true,
    tags: ['ai', 'messaging', 'moltbot'],
  },
  // Future experiments can be added here:
  // {
  //   id: 'example',
  //   name: 'Example Experiment',
  //   description: 'Description of what this does',
  //   status: 'idea',
  //   route: '/lab/example',
  //   icon: '🧪',
  //   requiresBackend: false,
  //   tags: ['example'],
  // },
];

export const statusLabels = {
  active: { label: 'Active', color: '#00ca88' },
  wip: { label: 'Work in Progress', color: '#f59e0b' },
  archived: { label: 'Archived', color: '#6b7280' },
  idea: { label: 'Idea', color: '#8b5cf6' },
};

export function getExperiment(id) {
  return experiments.find(exp => exp.id === id);
}

export function getExperimentsByStatus(status) {
  return experiments.filter(exp => exp.status === status);
}
