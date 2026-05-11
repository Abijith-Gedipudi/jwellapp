import { useState, useEffect } from 'react';
import api from '../api';

function Login({ onLogin, stores: initialStores }) {
  const [role, setRole] = useState('cre');
  const [stores, setStores] = useState(initialStores || []);
  const [selStore, setSel] = useState('');
  const [pin, setPin] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const effectiveStore = selStore || stores[0]?.id || '';

  useEffect(() => {
    if (!initialStores && role === 'cre') {
      api.get('/stores').then(res => {
        setStores(res.data);
        if (res.data.length > 0) setSel(res.data[0].id);
      }).catch(err => {
        console.error(err);
        setErr(`Failed to load stores: ${err.message}${err.response ? ` (${err.response.status})` : ''}`);
      });
    }
  }, [initialStores, role]);

  const handleLogin = async () => {
    setErr('');
    setLoading(true);
    try {
      if (role === 'admin') {
        if (!pass) {
          setErr('Password required.');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/admin/login', { password: pass });
        onLogin(res.data.user, res.data.token);
      } else {
        if (!effectiveStore || !pin) {
          setErr('Store and PIN required.');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/cre/login', { storeId: effectiveStore, pin });
        onLogin(res.data.user, res.data.token);
      }
    } catch (error) {
      setErr(error.response?.data?.error || 'Login failed. Check connection.');
    }
    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-bg" />
      <div className="login-card fade-in">
        <div className="login-brand">✦ Manepally Jewellers</div>
        <div className="login-tagline">Retail Intelligence Platform</div>
        <div className="login-divider" />

        <div className="role-tabs" style={{ marginBottom: 20, marginTop: 16 }}>
          {['cre', 'admin'].map(r => (
            <button key={r} className={`role-tab${role === r ? ' active' : ''}`} onClick={() => { setRole(r); setErr(''); }}>
              {r === 'cre' ? 'CRE / Staff' : 'Admin'}
            </button>
          ))}
        </div>

        {role === 'cre' && (
          <>
            <label className="input-label">Select Your Store</label>
            <select className="inp" style={{ cursor: 'pointer' }} value={effectiveStore} onChange={e => setSel(e.target.value)}>
              {stores.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <label className="input-label">Store PIN</label>
            <input className="inp" type="password" inputMode="numeric" maxLength={6} placeholder="Enter store PIN"
              value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </>
        )}

        {role === 'admin' && (
          <>
            <label className="input-label">Admin Password</label>
            <input className="inp" type="password" placeholder="Enter admin password"
              value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <div className="login-hint">Enter your admin password.</div>
          </>
        )}

        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In →'}
        </button>
        {err && <div className="login-err">{err}</div>}

        {role === 'cre' && (
          <div className="login-hint">Each store has its own PIN.<br />Your manager will give you the PIN.</div>
        )}
      </div>
    </div>
  );
}

export default Login;
