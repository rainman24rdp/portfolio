import { useState, useEffect } from 'react';
import './Admin.css';

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Nature');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Check for existing session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      verifyToken(token);
    } else {
      setAuthLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem('adminToken');
      }
    } catch {
      sessionStorage.removeItem('adminToken');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch {
      setLoginError('Connection error');
    }
  };

  const handleLogout = () => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      fetch('http://localhost:3001/api/admin/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    sessionStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

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

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('title', title);
    formData.append('category', category);

    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Photo uploaded successfully!');
        setSelectedFile(null);
        setPreview(null);
        setTitle('');
        setCategory('Nature');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="admin">
        <div className="admin-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin">
        <div className="admin-container">
          <h1>Admin Login</h1>
          <p className="admin-intro">Enter password to access the admin panel</p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                required
              />
            </div>
            <button type="submit" className="upload-btn">Login</button>
          </form>

          {loginError && (
            <div className="message error">{loginError}</div>
          )}
        </div>
      </div>
    );
  }

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
