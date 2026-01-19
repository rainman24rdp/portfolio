import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './Admin.css';

function Admin() {
  const { signOut } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Nature');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const categories = ['Nature', 'People', 'Urban', 'Travel', 'Architecture', 'Other'];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name.split('.')[0]);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
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
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-photos')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('photos')
        .insert([
          {
            title: title,
            category: category,
            file_path: filePath,
            url: publicUrl,
            original_name: selectedFile.name
          }
        ]);

      if (dbError) throw dbError;

      setMessage('Photo uploaded successfully!');
      setSelectedFile(null);
      setPreview(null);
      setTitle('');
      setCategory('Nature');
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="admin">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Upload Photos</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
        <p className="admin-intro">Upload photos to your portfolio gallery</p>

        <form onSubmit={handleUpload} className="upload-form">
          <div 
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" className="preview-image" />
              </div>
            ) : (
              <div className="drop-zone-content">
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p>Drag and drop an image here</p>
                <p className="drop-zone-or">or</p>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                  Choose File
                </label>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="form-fields">
              <div className="form-group">
                <label htmlFor="title">Photo Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter photo title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="upload-btn" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  setTitle('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          )}
        </form>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
