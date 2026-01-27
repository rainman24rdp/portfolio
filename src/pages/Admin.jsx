import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePhotos } from '../contexts/PhotosContext';
import { supabase } from '../lib/supabase';
import exifr from 'exifr';
import './Admin.css';

const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'portfolio-photos';

// Extract relevant EXIF metadata from an image file
async function extractMetadata(file) {
  try {
    const exif = await exifr.parse(file, {
      // Parse these tags
      pick: [
        'Make', 'Model', 'LensModel', 'LensMake',
        'FNumber', 'ExposureTime', 'ISO', 'FocalLength',
        'DateTimeOriginal', 'CreateDate',
        'GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef',
        'ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight'
      ],
      // Enable GPS parsing
      gps: true
    });

    if (!exif) return null;

    const metadata = {};

    // Camera info
    if (exif.Make || exif.Model) {
      metadata.camera = [exif.Make, exif.Model].filter(Boolean).join(' ').trim();
    }

    // Lens info
    if (exif.LensModel || exif.LensMake) {
      metadata.lens = [exif.LensMake, exif.LensModel].filter(Boolean).join(' ').trim();
    }

    // Aperture (f-number)
    if (exif.FNumber) {
      metadata.aperture = `f/${exif.FNumber}`;
    }

    // Shutter speed
    if (exif.ExposureTime) {
      if (exif.ExposureTime < 1) {
        metadata.shutter_speed = `1/${Math.round(1 / exif.ExposureTime)}s`;
      } else {
        metadata.shutter_speed = `${exif.ExposureTime}s`;
      }
    }

    // ISO
    if (exif.ISO) {
      metadata.iso = exif.ISO;
    }

    // Focal length
    if (exif.FocalLength) {
      metadata.focal_length = `${Math.round(exif.FocalLength)}mm`;
    }

    // Capture date
    if (exif.DateTimeOriginal || exif.CreateDate) {
      const date = exif.DateTimeOriginal || exif.CreateDate;
      metadata.captured_at = date instanceof Date ? date.toISOString() : new Date(date).toISOString();
    }

    // GPS coordinates
    if (exif.latitude && exif.longitude) {
      metadata.latitude = exif.latitude;
      metadata.longitude = exif.longitude;
    }

    return Object.keys(metadata).length > 0 ? metadata : null;
  } catch (error) {
    console.error('Error extracting EXIF:', error);
    return null;
  }
}

function Admin() {
  const { signOut } = useAuth();
  const { photos, loading, refresh: refreshPhotos } = usePhotos();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Multi-file upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [labels, setLabels] = useState([]);
  const [labelInput, setLabelInput] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Edit state
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editShowCustom, setEditShowCustom] = useState(false);
  const [editLabels, setEditLabels] = useState([]);
  const [editLabelInput, setEditLabelInput] = useState('');
  const [saving, setSaving] = useState(false);

  const defaultCategories = ['Nature', 'People', 'Urban', 'Travel', 'Architecture', 'Other'];

  // Build categories from existing photos + defaults
  const existingCategories = [...new Set(photos.map(p => p.category).filter(Boolean))];
  const allCategories = [...new Set([...defaultCategories, ...existingCategories])].sort();

  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    await processFiles(files);
  };

  const processFiles = async (files) => {
    const newFiles = [];

    for (const file of files) {
      // Create preview
      const preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      // Extract metadata
      const metadata = await extractMetadata(file);

      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        file,
        preview,
        title: file.name.split('.')[0],
        metadata,
        status: 'pending' // pending, uploading, success, error
      });
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const updateFileTitle = (id, title) => {
    setSelectedFiles(prev => prev.map(f => f.id === id ? { ...f, title } : f));
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
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
    if (selectedFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one file' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });
    setUploadProgress({ current: 0, total: selectedFiles.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileData = selectedFiles[i];
      setUploadProgress({ current: i + 1, total: selectedFiles.length });
      setSelectedFiles(prev => prev.map(f =>
        f.id === fileData.id ? { ...f, status: 'uploading' } : f
      ));

      try {
        const fileExt = fileData.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, fileData.file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        const insertData = {
          title: fileData.title,
          category,
          file_path: filePath,
          url: publicUrl,
          original_name: fileData.file.name,
          labels: labels.length > 0 ? labels : null
        };

        // Add metadata fields if available
        if (fileData.metadata) {
          Object.assign(insertData, fileData.metadata);
        }

        const { error: dbError } = await supabase
          .from('photos')
          .insert([insertData]);
        if (dbError) throw dbError;

        setSelectedFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, status: 'success' } : f
        ));
        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        setSelectedFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, status: 'error', error: error.message } : f
        ));
        errorCount++;
      }
    }

    setUploading(false);

    if (successCount > 0 && errorCount === 0) {
      setMessage({ type: 'success', text: `${successCount} photo${successCount > 1 ? 's' : ''} uploaded successfully!` });
      // Clear successful uploads after a delay
      setTimeout(() => {
        setSelectedFiles([]);
        setCategory('');
        setCustomCategory('');
        setShowCategoryInput(false);
        setLabels([]);
      }, 1500);
    } else if (successCount > 0 && errorCount > 0) {
      setMessage({ type: 'error', text: `${successCount} uploaded, ${errorCount} failed. Check individual files for errors.` });
    } else {
      setMessage({ type: 'error', text: 'All uploads failed. Please try again.' });
    }

    refreshPhotos();
  };

  const handleDelete = async (photo) => {
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([photo.file_path]);
      const { error } = await supabase.from('photos').delete().eq('id', photo.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Photo deleted successfully!' });
      setDeleteConfirm(null);
      refreshPhotos();
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
      refreshPhotos();
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

  const openEdit = (photo) => {
    setEditingPhoto(photo);
    setEditTitle(photo.title || '');
    setEditCategory(photo.category || '');
    setEditCustomCategory('');
    setEditShowCustom(false);
    setEditLabels(photo.labels || []);
    setEditLabelInput('');
  };

  const closeEdit = () => {
    setEditingPhoto(null);
    setSaving(false);
  };

  const addEditLabel = () => {
    const trimmed = editLabelInput.trim();
    if (trimmed && !editLabels.includes(trimmed)) {
      setEditLabels([...editLabels, trimmed]);
      setEditLabelInput('');
    }
  };

  const handleEditLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEditLabel();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPhoto) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('photos')
        .update({
          title: editTitle,
          category: editShowCustom ? editCustomCategory : editCategory,
          labels: editLabels.length > 0 ? editLabels : null
        })
        .eq('id', editingPhoto.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Photo updated successfully!' });
      closeEdit();
      refreshPhotos();
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
      setSaving(false);
    }
  };

  const stats = {
    total: photos.length,
    categories: allCategories.map(cat => ({
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
              <div
                className={`drop-zone ${selectedFiles.length > 0 ? 'has-files' : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {selectedFiles.length > 0 ? (
                  <div className="upload-previews">
                    {selectedFiles.map(fileData => (
                      <div key={fileData.id} className={`upload-preview-item ${fileData.status}`}>
                        <img src={fileData.preview} alt={fileData.title} />
                        <div className="preview-info">
                          <input
                            type="text"
                            value={fileData.title}
                            onChange={(e) => updateFileTitle(fileData.id, e.target.value)}
                            placeholder="Photo title"
                            disabled={uploading}
                          />
                          {fileData.metadata && (
                            <div className="preview-metadata">
                              {fileData.metadata.camera && <span title="Camera">{fileData.metadata.camera}</span>}
                              {fileData.metadata.captured_at && (
                                <span title="Captured">
                                  {new Date(fileData.metadata.captured_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                          {fileData.status === 'success' && <span className="status-icon success">✓</span>}
                          {fileData.status === 'error' && <span className="status-icon error" title={fileData.error}>✕</span>}
                          {fileData.status === 'uploading' && <span className="status-icon uploading"><span className="spinner small"></span></span>}
                        </div>
                        {!uploading && fileData.status !== 'success' && (
                          <button type="button" className="remove-file" onClick={() => removeFile(fileData.id)}>×</button>
                        )}
                      </div>
                    ))}
                    {!uploading && (
                      <label className="add-more-files">
                        <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="file-input" />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Add More</span>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="drop-zone-content">
                    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p>Drag and drop images here</p>
                    <p className="drop-zone-or">or</p>
                    <label className="file-input-label">
                      <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="file-input" />
                      Choose Files
                    </label>
                    <p className="drop-zone-hint">You can select multiple images at once</p>
                  </div>
                )}
              </div>

              {selectedFiles.length > 0 && (
                <div className="form-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Category <span className="optional">(applies to all)</span></label>
                      {showCategoryInput ? (
                        <div className="category-input-container">
                          <input
                            type="text"
                            id="customCategory"
                            value={customCategory}
                            onChange={(e) => {
                              setCustomCategory(e.target.value);
                              setCategory(e.target.value);
                            }}
                            placeholder="Enter custom category"
                            autoFocus
                          />
                          <button type="button" className="category-toggle-btn" onClick={() => {
                            setShowCategoryInput(false);
                            setCategory(allCategories[0] || '');
                            setCustomCategory('');
                          }}>
                            Select
                          </button>
                        </div>
                      ) : (
                        <div className="category-input-container">
                          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="">Select category</option>
                            {allCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <button type="button" className="category-toggle-btn" onClick={() => setShowCategoryInput(true)}>
                            + New
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="labels">Labels <span className="optional">(applies to all)</span></label>
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
                  </div>

                  {uploading && (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        Uploading {uploadProgress.current} of {uploadProgress.total}...
                      </span>
                    </div>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={uploading}>
                      {uploading ? (
                        <><span className="spinner"></span>Uploading...</>
                      ) : (
                        <>Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}</>
                      )}
                    </button>
                    {!uploading && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setSelectedFiles([]);
                          setLabels([]);
                        }}
                      >
                        Clear All
                      </button>
                    )}
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
                      {photo.camera && <span className="photo-meta-tag">{photo.camera}</span>}
                      {photo.labels && photo.labels.length > 0 && (
                        <div className="photo-labels">
                          {photo.labels.map(label => (
                            <span key={label} className="photo-label">{label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="photo-card-actions">
                      <button className="btn-edit" onClick={() => openEdit(photo)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
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

        {editingPhoto && (
          <div className="modal-overlay" onClick={closeEdit}>
            <div className="edit-modal" onClick={e => e.stopPropagation()}>
              <div className="edit-modal-header">
                <h3>Edit Photo</h3>
                <button className="modal-close-btn" onClick={closeEdit}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="edit-modal-body">
                <div className="edit-preview">
                  <img src={editingPhoto.url} alt={editingPhoto.title} />
                </div>

                <div className="edit-fields">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Photo title"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    {editShowCustom ? (
                      <div className="category-input-container">
                        <input
                          type="text"
                          value={editCustomCategory}
                          onChange={(e) => setEditCustomCategory(e.target.value)}
                          placeholder="Custom category"
                          autoFocus
                        />
                        <button type="button" className="category-toggle-btn" onClick={() => {
                          setEditShowCustom(false);
                          setEditCustomCategory('');
                        }}>Select</button>
                      </div>
                    ) : (
                      <div className="category-input-container">
                        <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                          <option value="">Select category</option>
                          {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <button type="button" className="category-toggle-btn" onClick={() => setEditShowCustom(true)}>+ New</button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Labels</label>
                    <div className="labels-input-container">
                      <input
                        type="text"
                        value={editLabelInput}
                        onChange={(e) => setEditLabelInput(e.target.value)}
                        onKeyDown={handleEditLabelKeyDown}
                        placeholder="Type a label and press Enter"
                      />
                      <button type="button" className="add-label-btn" onClick={addEditLabel}>Add</button>
                    </div>
                    {editLabels.length > 0 && (
                      <div className="labels-list">
                        {editLabels.map(label => (
                          <span key={label} className="label-tag">
                            {label}
                            <button type="button" onClick={() => setEditLabels(editLabels.filter(l => l !== label))}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="edit-modal-footer">
                <button className="btn-secondary" onClick={closeEdit}>Cancel</button>
                <button className="btn-primary" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? <><span className="spinner"></span>Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
