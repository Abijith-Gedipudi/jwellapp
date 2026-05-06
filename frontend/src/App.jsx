import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CREDashboard from './pages/CREDashboard';
import AdminDashboard from './pages/AdminDashboard';
import api from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [counters, setCounters] = useState({});

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch global data needed by both Admin and CRE
    if (user) {
      api.get('/stores').then(res => setStores(res.data)).catch(console.error);
      api.get('/counters').then(res => setCounters(res.data)).catch(console.error);
    }
  }, [user]);

  const handleLogin = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-brand">✦ Manepally Jewellers</div>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            !user ? <Login onLogin={handleLogin} stores={stores.length ? stores : null} /> :
            user.role === 'admin' ? <Navigate to="/admin" /> :
            <Navigate to="/dashboard" />
          } 
        />
        <Route 
          path="/dashboard" 
          element={user && user.role === 'cre' ? <CREDashboard user={user} stores={stores} counters={counters} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin/*" 
          element={user && user.role === 'admin' ? <AdminDashboard user={user} stores={stores} counters={counters} onLogout={handleLogout} refreshData={() => {
            api.get('/stores').then(res => setStores(res.data));
            api.get('/counters').then(res => setCounters(res.data));
          }} /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
