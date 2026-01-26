import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './Admin.css';

const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'portfolio-photos';

function Admin() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Nature');
  const [labels, setLabels] = useState([]);
  const [labelInput, setLabelInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const categories = ['Nature', 'People', 'Urban', 'Travel', 'Architecture', 'Other'];

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name.split('.')[0]);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setTitle(file.name.split('.')[0]);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addLabel = () => {
    const trimmed = labelInput.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
      setLabelInput('');
    }
  };

  const removeLabel = (labelToRemove) => {
    setLabels(labels.filter(l => l !== labelToRemove));
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLabel();
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }
    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('photos')
        .insert([{
          title,
          category,
          file_path: filePath,
          url: publicUrl,
          original_name: selectedFile.name,
          labels: labels.length > 0 ? labels : null
        }]);
      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
      setSelectedFile(null);
      setPreview(null);
      setTitle('');
      setCategory('Nature');
      setLabels([]);
      fetchPhotos();
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo) => {
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([photo.file_path]);
      const { error } = await supabase.from('photos').delete().eq('id', photo.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Photo deleted successfully!' });
      setDeleteConfirm(null);
      fetchPhotos();
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0) return;
    try {
      for (const photoId of selectedPhotos) {
        const photo = photos.find(p => p.id === photoId);
        if (photo) {
          await supabase.storage.from(STORAGE_BUCKET).remove([photo.file_path]);
          await supabase.from('photos').delete().eq('id', photo.id);
        }
      }
      setMessage({ type: 'success', text: `${selectedPhotos.length} photos deleted!` });
      setSelectedPhotos([]);
      fetchPhotos();
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(selectedPhotos.length === photos.length ? [] : photos.map(p => p.id));
  };

  const stats = {
    total: photos.length,
    categories: categories.map(cat => ({
      name: cat,
      count: photos.filter(p => p.category === cat).length
    })).filter(c => c.count > 0),
    recent: photos.slice(0, 5)
  };

  return (
    <div className="admin">
      <div className="admin-container">
        <header className="admin-header">
          <div className="admin-brand">
            <h1>Dashboard</h1>
            <span className="admin-badge">Admin</span>
          </div>
          <button onClick={signOut} className="logout-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </header>

        <nav className="admin-tabs">
          {[
            { id: 'dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', label: 'Overview' },
            { id: 'upload', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12', label: 'Upload' },
            { id: 'manage', icon: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21', label: 'Manage' }
          ].map(tab => (
            <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={tab.icon} /></svg>
              {tab.label}
              {tab.id === 'manage' && photos.length > 0 && <span className="tab-count">{photos.length}</span>}
            </button>
          ))}
        </nav>

        {message.text && (
          <div className={`message ${message.type}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {message.type === 'success' ? <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" /> : <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6" />}
            </svg>
            {message.text}
            <button className="message-close" onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg></div>
                <div className="stat-info"><span className="stat-value">{stats.total}</span><span className="stat-label">Total Photos</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></div>
                <div className="stat-info"><span className="stat-value">{stats.categories.length}</span><span className="stat-label">Categories</span></div>
              </div>
            </div>
            {stats.categories.length > 0 && (
              <div className="categories-breakdown">
                <h3>Photos by Category</h3>
                <div className="category-bars">
                  {stats.categories.map(cat => (
                    <div key={cat.name} className="category-bar">
                      <div className="category-info"><span>{cat.name}</span><span className="category-count">{cat.count}</span></div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(cat.count / stats.total) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.recent.length > 0 && (
              <div className="recent-uploads">
                <h3>Recent Uploads</h3>
                <div className="recent-grid">
                  {stats.recent.map(photo => (
                    <div key={photo.id} className="recent-item">
                      <img src={photo.url} alt={photo.title} />
                      <div className="recent-overlay"><span>{photo.title}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.total === 0 && (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                <h3>No photos yet</h3>
                <p>Upload your first photo to get started</p>
                <button className="btn-primary" onClick={() => setActiveTab('upload')}>Upload Photo</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="upload-content">
            <form onSubmit={handleUpload} className="upload-form">
              <div className={`drop-zone ${preview ? 'has-preview' : ''}`} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                {preview ? (
                  <div className="preview-container">
                    <img src={preview} alt="Preview" className="preview-image" />
                    <button type="button" className="clear-preview" onClick={() => { setSelectedFile(null); setPreview(null); setTitle(''); setLabels([]); }}>×</button>
                  </div>
                ) : (
                  <div className="drop-zone-content">
                    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p>Drag and drop an image here</p>
                    <p className="drop-zone-or">or</p>
                    <label className="file-input-label">
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="file-input" />
                      Choose File
                    </label>
                  </div>
                )}
              </div>
              {selectedFile && (
                <div className="form-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="title">Photo Title</label>
                      <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter photo title" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="category">Category</label>
                      <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="labels">Labels <span className="optional">(optional)</span></label>
                    <div className="labels-input-container">
                      <input
                        type="text"
                        id="labels"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onKeyDown={handleLabelKeyDown}
                        placeholder="Type a label and press Enter"
                      />
                      <button type="button" className="add-label-btn" onClick={addLabel}>Add</button>
                    </div>
                    {labels.length > 0 && (
                      <div className="labels-list">
                        {labels.map(label => (
                          <span key={label} className="label-tag">
                            {label}
                            <button type="button" onClick={() => removeLabel(label)}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={uploading}>
                      {uploading ? <><span className="spinner"></span>Uploading...</> : <>Upload Photo</>}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="manage-content">
            {photos.length > 0 && (
              <div className="manage-toolbar">
                <label className="select-all">
                  <input type="checkbox" checked={selectedPhotos.length === photos.length} onChange={selectAllPhotos} />
                  Select All ({photos.length})
                </label>
                {selectedPhotos.length > 0 && (
                  <button className="btn-danger" onClick={handleBulkDelete}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Delete Selected ({selectedPhotos.length})
                  </button>
                )}
              </div>
            )}
            {loading ? (
              <div className="loading-state"><span className="spinner large"></span><p>Loading photos...</p></div>
            ) : photos.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                <h3>No photos yet</h3>
                <p>Upload your first photo to get started</p>
                <button className="btn-primary" onClick={() => setActiveTab('upload')}>Upload Photo</button>
              </div>
            ) : (
              <div className="photos-grid">
                {photos.map(photo => (
                  <div key={photo.id} className={`photo-card ${selectedPhotos.includes(photo.id) ? 'selected' : ''}`}>
                    <div className="photo-checkbox"><input type="checkbox" checked={selectedPhotos.includes(photo.id)} onChange={() => togglePhotoSelection(photo.id)} /></div>
                    <img src={photo.url} alt={photo.title} />
                    <div className="photo-card-info">
                      <h4>{photo.title}</h4>
                      <span className="photo-category-tag">{photo.category}</span>
                      {photo.labels && photo.labels.length > 0 && (
                        <div className="photo-labels">
                          {photo.labels.map(label => (
                            <span key={label} className="photo-label">{label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="photo-card-actions">
                      <button className="btn-delete" onClick={() => setDeleteConfirm(photo)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Delete Photo?</h3>
              <p>Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
