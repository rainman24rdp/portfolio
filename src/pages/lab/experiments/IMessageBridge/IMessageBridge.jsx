import { useState } from 'react';
import { getExperiment } from '../../../../config/experiments';
import './IMessageBridge.css';

const experiment = getExperiment('imessage-bridge');

function IMessageBridge() {
  const [activeTab, setActiveTab] = useState('inbox');

  return (
    <div className="imessage-bridge">
      <header className="experiment-header">
        <div className="experiment-header-content">
          <span className="experiment-header-icon">{experiment.icon}</span>
          <div>
            <h1>{experiment.name}</h1>
            <p>{experiment.description}</p>
          </div>
        </div>
        <span className="experiment-status-badge wip">Work in Progress</span>
      </header>

      <nav className="experiment-tabs">
        {[
          { id: 'inbox', label: 'Inbox', icon: '📥' },
          { id: 'drafts', label: 'Drafts', icon: '📝' },
          { id: 'sent', label: 'Sent', icon: '✅' },
          { id: 'settings', label: 'Settings', icon: '⚙️' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`experiment-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="experiment-content">
        {activeTab === 'inbox' && <InboxView />}
        {activeTab === 'drafts' && <DraftsView />}
        {activeTab === 'sent' && <SentView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>
    </div>
  );
}

function InboxView() {
  return (
    <div className="experiment-panel">
      <div className="empty-state">
        <span className="empty-icon">📥</span>
        <h3>No incoming messages</h3>
        <p>Messages from Moltbot will appear here once connected.</p>
        <div className="setup-hint">
          <h4>Setup Required</h4>
          <ol>
            <li>Install and configure Moltbot on a Mac</li>
            <li>Set up the webhook URL in Settings</li>
            <li>Messages will flow in automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function DraftsView() {
  return (
    <div className="experiment-panel">
      <div className="empty-state">
        <span className="empty-icon">📝</span>
        <h3>No pending drafts</h3>
        <p>Claude-generated draft responses will appear here for approval.</p>
      </div>
    </div>
  );
}

function SentView() {
  return (
    <div className="experiment-panel">
      <div className="empty-state">
        <span className="empty-icon">✅</span>
        <h3>No sent messages</h3>
        <p>Approved and sent messages will be logged here.</p>
      </div>
    </div>
  );
}

function SettingsView() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [claudePrompt, setClaudePrompt] = useState(
    `You are helping draft iMessage responses. Be conversational, friendly, and match the tone of the conversation. Keep responses concise unless more detail is needed.`
  );
  const [autoDraft, setAutoDraft] = useState(true);

  return (
    <div className="experiment-panel">
      <div className="settings-section">
        <h3>Moltbot Configuration</h3>
        <p className="settings-description">
          Configure the connection to your Moltbot instance running on a Mac.
        </p>

        <div className="settings-field">
          <label htmlFor="webhook-url">Webhook URL</label>
          <input
            type="url"
            id="webhook-url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-domain.com/api/lab/imessage/webhook"
          />
          <span className="field-hint">
            This is the URL Moltbot will POST incoming messages to.
            Your MCP server endpoint will be: <code>/api/lab/imessage/webhook</code>
          </span>
        </div>
      </div>

      <div className="settings-section">
        <h3>Claude Configuration</h3>

        <div className="settings-field">
          <label htmlFor="claude-prompt">System Prompt</label>
          <textarea
            id="claude-prompt"
            value={claudePrompt}
            onChange={(e) => setClaudePrompt(e.target.value)}
            rows={4}
          />
          <span className="field-hint">
            This prompt guides Claude when drafting responses.
          </span>
        </div>

        <div className="settings-field toggle-field">
          <label>
            <input
              type="checkbox"
              checked={autoDraft}
              onChange={(e) => setAutoDraft(e.target.checked)}
            />
            <span>Auto-draft responses</span>
          </label>
          <span className="field-hint">
            Automatically generate draft responses for incoming messages.
          </span>
        </div>
      </div>

      <div className="settings-section">
        <h3>Connection Status</h3>
        <div className="connection-status disconnected">
          <span className="status-dot" />
          <span>Not connected</span>
        </div>
        <p className="settings-description">
          Moltbot connection will be established when properly configured.
        </p>
      </div>

      <div className="settings-actions">
        <button className="btn-primary" disabled>
          Save Settings
        </button>
        <span className="save-hint">Database tables required - coming soon</span>
      </div>
    </div>
  );
}

export default IMessageBridge;
