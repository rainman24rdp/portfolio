import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PhotosProvider } from './contexts/PhotosContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LabLayout from './components/lab/LabLayout';
import Home from './pages/Home';
import About from './pages/About';
import Photography from './pages/Photography';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Lab from './pages/lab/Lab';
import IMessageBridge from './pages/lab/experiments/IMessageBridge/IMessageBridge';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PhotosProvider>
          <Routes>
            {/* Public routes with main Layout */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/photography" element={<Layout><Photography /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route
              path="/admin"
              element={
                <Layout>
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                </Layout>
              }
            />

            {/* Lab routes with LabLayout - protected */}
            <Route
              path="/lab"
              element={
                <ProtectedRoute>
                  <LabLayout>
                    <Lab />
                  </LabLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab/imessage-bridge"
              element={
                <ProtectedRoute>
                  <LabLayout>
                    <IMessageBridge />
                  </LabLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </PhotosProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
