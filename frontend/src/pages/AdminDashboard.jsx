import { useState, useEffect } from 'react';
import api from '../api';
import { fmtDate, fmtTime, fmtSpent, fmtShort, CATEGORIES, OUTCOMES, outcomeColor, exportCSV } from '../utils';

function AdminDashboard({ user, stores, counters, onLogout, refreshData }) {
  const [section, setSection] = useState('overview');
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    api.get('/visits').then(res => setEntries(res.data)).catch(console.error);
  }, []);

  const weekE = entries.filter(e => e.timestamp >= Date.now() - 7 * 86400000);
  const todayE = entries.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString());
  const conv = weekE.filter(e => e.outcome === 'Converted');
  const convPct = weekE.length ? Math.round((conv.length / weekE.length) * 100) : 0;

  const nav = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'stores', icon: '🏬', label: 'Stores & PINs' },
    { id: 'counters', icon: '🏷', label: 'Counters' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'customers', icon: '🧠', label: 'Customers' },
    { id: 'entries', icon: '📋', label: 'All Entries' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sb-logo">
          <div className="sb-brand">✦ Manepally Jewellers</div>
          <div className="sb-sub">Admin Panel</div>
        </div>
        <nav className="sb-nav">
          {nav.map(n => (
            <button key={n.id} className={`sb-item${section === n.id ? ' active' : ''}`} onClick={() => setSection(n.id)}>
              <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="sb-user">
          <div className="sb-user-name">Administrator</div>
          <button className="sb-logout" onClick={onLogout}>Sign out</button>
        </div>
      </div>
      <div className="main">
        <div className="page fade-in">
          {section === 'overview' && <AdminOverview stores={stores} entries={entries} weekE={weekE} todayE={todayE} conv={conv} convPct={convPct} />}
          {section === 'stores' && <AdminStores stores={stores} entries={entries} onUpdate={refreshData} />}
          {section === 'counters' && <AdminCounters stores={stores} counters={counters} onUpdate={refreshData} />}
          {section === 'analytics' && <AdminAnalytics stores={stores} weekE={weekE} />}
          {section === 'customers' && <AdminCustomers entries={entries} />}
          {section === 'entries' && <AdminEntries stores={stores} entries={entries} />}
          {section === 'settings' && <AdminSettings />}
        </div>
      </div>
    </div>
  );
}

function AdminOverview({ stores, weekE, todayE, conv, convPct }) {
  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">Command Centre</div>
        <div className="page-sub">This week's performance</div>
      </div>
      <div className="cards-grid">
        <div className="metric-card"><div className="mc-label">Walk-ins (Week)</div><div className="mc-value">{weekE.length}</div><div className="mc-sub mc-gold">Today: {todayE.length}</div></div>
        <div className="metric-card"><div className="mc-label">Converted</div><div className="mc-value mc-green">{conv.length}</div></div>
        <div className="metric-card">
          <div className="mc-label">Conv. Rate</div>
          <div className="mc-value" style={{ color: convPct >= 50 ? '#22c55e' : convPct >= 30 ? '#f59e0b' : '#ef4444' }}>{convPct}%</div>
        </div>
        <div className="metric-card"><div className="mc-label">Pending</div><div className="mc-value mc-yellow">{weekE.filter(e => e.outcome === 'Pending').length}</div></div>
      </div>
    </div>
  );
}

function AdminStores({ stores, entries, onUpdate }) {
  const [showAdd, setAdd] = useState(false);
  const [form, setForm] = useState({ name: '', pin: '' });

  async function addStore() {
    if (!form.name.trim() || !form.pin.trim()) return;
    await api.post('/stores', form);
    setForm({ name: '', pin: '' }); setAdd(false);
    onUpdate();
  }

  async function toggleStore(id) {
    await api.put(`/stores/${id}/toggle`);
    onUpdate();
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">Stores & PINs</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        {!showAdd ? <button className="btn btn-gold" onClick={() => setAdd(true)}>+ Add Store</button> : (
          <div className="store-card">
            <div className="form-row">
              <div><label className="form-label">Store Name</label><input className="form-inp" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="form-label">CRE PIN</label><input className="form-inp" value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-gold" onClick={addStore}>Add Store</button>
              <button className="btn" onClick={() => setAdd(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      {stores.map(s => (
        <div key={s.id} className="store-card" style={{ opacity: s.active ? 1 : 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#F0E0E4' }}>{s.name} <span style={{fontSize:12,color:'#9A7080',marginLeft:8}}>PIN: {s.pin}</span></div>
            <button className={`btn btn-sm ${s.active ? 'btn-danger' : ''}`} onClick={() => toggleStore(s.id)}>{s.active ? 'Disable' : 'Enable'}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminCounters({ stores, counters, onUpdate }) {
  const [selStore, setSel] = useState(stores[0]?.id || '');
  const [form, setForm] = useState({ name: '', cat: 'Gold' });
  const ctrs = counters[selStore] || [];

  async function addCounter() {
    if (!form.name.trim()) return;
    await api.post(`/counters/${selStore}`, { name: form.name, category: form.cat });
    setForm({ name: '', cat: 'Gold' });
    onUpdate();
  }

  async function toggleCounter(id) {
    await api.put(`/counters/${id}/toggle`);
    onUpdate();
  }

  async function removeCounter(id) {
    await api.delete(`/counters/${id}`);
    onUpdate();
  }

  return (
    <div className="fade-in">
      <div className="page-header"><div className="page-title">Counter Management</div></div>
      <div className="filter-bar">
        <select className="filter-sel" value={selStore} onChange={e => setSel(e.target.value)}>
          {stores.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="store-card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div><label className="form-label">Name</label><input className="form-inp" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="form-label">Category</label><select className="form-sel" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <button className="btn btn-gold" onClick={addCounter}>Add</button>
      </div>
      {ctrs.map(c => (
        <div key={c.id} className="counter-item" style={{ opacity: c.active ? 1 : 0.5 }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#F0E0E4', fontWeight: 500 }}>{c.name}</span>
            <span className="badge badge-gold" style={{ marginLeft: 8 }}>{c.category}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-sm" onClick={() => toggleCounter(c.id)}>{c.active ? 'Disable' : 'Enable'}</button>
            <button className="btn btn-sm btn-danger" onClick={() => removeCounter(c.id)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminAnalytics({ stores, weekE }) {
  const [mode, setMode] = useState('category');

  const catData = CATEGORIES.map(cat => {
    const ce = weekE.filter(e => e.category === cat);
    const cc = ce.filter(e => e.outcome === 'Converted');
    return { cat, total: ce.length, conv: cc.length, pct: ce.length ? Math.round((cc.length / ce.length) * 100) : 0 };
  }).sort((a, b) => b.total - a.total);

  const insights = [];
  catData.forEach(c => { if (c.total > 3 && c.pct < 30) insights.push(`🔴 ${c.cat}: ${c.total} visits but only ${c.pct}% conversion. Review pricing/stock.`); });
  catData.forEach(c => { if (c.total > 3 && c.pct > 60) insights.push(`✅ ${c.cat}: Excellent ${c.pct}% conversion rate! Scale up.`); });
  const rMap = {}; weekE.filter(e => e.reason).forEach(e => { rMap[e.reason] = (rMap[e.reason] || 0) + 1; });
  const topR = Object.entries(rMap).sort((a, b) => b[1] - a[1])[0];
  if (topR) insights.push(`📊 Top loss reason: "${topR[0]}" (${topR[1]} cases this week)`);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">Analytics</div>
        <div className="page-sub">Cross-store intelligence · This week</div>
      </div>
      {insights.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#C9A96E', fontWeight: 600, marginBottom: 8 }}>🧠 Smart Insights</div>
          {insights.map((ins, i) => (
            <div key={i} style={{ background: '#18080E', border: '1px solid #3A0E20', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#E0CED2', marginBottom: 6, lineHeight: 1.6 }}>{ins}</div>
          ))}
        </div>
      )}
      <div className="tabs">
        {[['category', 'Category Analysis'], ['heatmap', 'Category × Store'], ['reasons', 'Loss Reasons']].map(([m, l]) => (
          <button key={m} className={`tab${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>{l}</button>
        ))}
      </div>
      {mode === 'category' && (
        <div className="table-wrap fade-in">
          <div className="table-head"><div className="table-title">Category Performance (All Stores)</div></div>
          <table>
            <thead><tr><th>Category</th><th>Walk-ins</th><th>Converted</th><th>Rate</th></tr></thead>
            <tbody>
              {catData.map(c => (
                <tr key={c.cat}>
                  <td style={{ fontWeight: 600, color: '#F0E0E4' }}>{({ 'Gold': '✨', 'Diamond': '💎', 'Silver': '🪙', 'Platinum': '⬜', 'Nakshi': '🏺', 'Plain Gold Necklace': '📿', 'Stone Necklace': '💠', 'Bangles': '⭕', 'Rings': '💍', 'Chains': '🔗', 'Lockets': '🔒', 'Oddiynam': '🎀', 'Gem Stones': '🪨', 'Repair': '🔧', 'Multi Products': '🎁' })[c.cat] || '✦'} {c.cat}</td>
                  <td>{c.total}</td>
                  <td style={{ color: '#22c55e' }}>{c.conv}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="progress-bar" style={{ width: 70 }}><div className="progress-fill" style={{ width: `${c.pct}%`, background: c.pct >= 50 ? '#22c55e' : c.pct >= 30 ? '#f59e0b' : '#ef4444' }} /></div>
                      <span style={{ color: c.pct >= 50 ? '#22c55e' : c.pct >= 30 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{c.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {mode === 'heatmap' && (
        <div className="table-wrap fade-in">
          <div className="table-head"><div className="table-title">Category × Store Conversion Heatmap</div></div>
          <div style={{ overflowX: 'auto', padding: '0 16px 16px' }}>
            <table style={{ minWidth: 550 }}>
              <thead><tr><th>Category</th>{stores.filter(s => s.active).map(s => <th key={s.id} style={{ fontSize: 10, padding: '8px 6px' }}>{s.name.split(' ')[0]}</th>)}</tr></thead>
              <tbody>
                {CATEGORIES.map(cat => (
                  <tr key={cat}>
                    <td style={{ fontWeight: 500, color: '#F0E0E4' }}>{cat}</td>
                    {stores.filter(s => s.active).map(s => {
                      const ce = weekE.filter(e => e.storeId === s.id && e.category === cat);
                      const pct = ce.length ? Math.round((ce.filter(e => e.outcome === 'Converted').length / ce.length) * 100) : 0;
                      const bg = ce.length === 0 ? '#130810' : pct >= 50 ? 'rgba(34,197,94,.2)' : pct >= 30 ? 'rgba(245,158,11,.2)' : 'rgba(239,68,68,.15)';
                      const fg = ce.length === 0 ? '#6A4050' : pct >= 50 ? '#22c55e' : pct >= 30 ? '#f59e0b' : '#ef4444';
                      return <td key={s.id} style={{ background: bg, textAlign: 'center', fontSize: 12, color: fg, fontWeight: 600, padding: '8px 4px' }}>{ce.length ? `${pct}%` : '—'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {mode === 'reasons' && (
        <div className="table-wrap fade-in">
          <div className="table-head"><div className="table-title">Non-Conversion Reasons (This Week)</div></div>
          {Object.entries(rMap).length === 0
            ? <div className="no-data">No non-conversion data this week.</div>
            : (
              <table>
                <thead><tr><th>Reason</th><th>Count</th><th>Share</th></tr></thead>
                <tbody>
                  {Object.entries(rMap).sort((a, b) => b[1] - a[1]).map(([r, cnt]) => {
                    const total = Object.values(rMap).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={r}>
                        <td>{r}</td><td>{cnt}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${Math.round((cnt / total) * 100)}%`, background: '#ef4444' }} /></div>
                            <span style={{ color: '#ef4444' }}>{Math.round((cnt / total) * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      )}
    </div>
  );
}

function AdminCustomers({ entries }) {
  const withPhone = entries.filter(e => e.phone);
  const cmap = {};
  withPhone.forEach(e => {
    if (!cmap[e.phone]) cmap[e.phone] = { phone: e.phone, name: e.custName, visits: [], stores: new Set() };
    cmap[e.phone].visits.push(e);
    cmap[e.phone].stores.add(e.storeName);
    if (e.custName && !cmap[e.phone].name) cmap[e.phone].name = e.custName;
  });
  const custs = Object.values(cmap).map(c => ({
    ...c,
    visitCount: c.visits.length,
    convCount: c.visits.filter(v => v.outcome === 'Converted').length,
    lastVisit: Math.max(...c.visits.map(v => v.timestamp)),
  })).sort((a, b) => b.visitCount - a.visitCount);

  function doExport() {
    exportCSV(withPhone, 'manepally-customers.csv');
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">Customer Intelligence</div>
        <div className="page-sub">{custs.length} tracked customers (with phone number)</div>
      </div>
      <div className="cards-grid">
        <div className="metric-card"><div className="mc-label">Total Tracked</div><div className="mc-value">{custs.length}</div></div>
        <div className="metric-card"><div className="mc-label">Repeat Visitors</div><div className="mc-value mc-gold">{custs.filter(c => c.visitCount > 1).length}</div></div>
        <div className="metric-card"><div className="mc-label">Converted</div><div className="mc-value mc-green">{custs.filter(c => c.convCount > 0).length}</div></div>
        <div className="metric-card"><div className="mc-label">Pending Follow-ups</div><div className="mc-value mc-yellow">{entries.filter(e => e.outcome === 'Pending').length}</div></div>
      </div>
      <div className="table-wrap">
        <div className="table-head">
          <div className="table-title">Customer List</div>
          <button className="btn btn-sm btn-gold" onClick={doExport}>⬇ Export CSV</button>
        </div>
        <table>
          <thead><tr><th>Customer</th><th>Phone</th><th>Visits</th><th>Converted</th><th>Type</th><th>Last Visit</th></tr></thead>
          <tbody>
            {custs.slice(0, 50).map(c => (
              <tr key={c.phone}>
                <td style={{ color: '#F0E0E4', fontWeight: 500 }}>{c.name || 'Unknown'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#9A7080' }}>{c.phone}</td>
                <td>{c.visitCount}</td>
                <td style={{ color: '#22c55e' }}>{c.convCount}</td>
                <td><span className={`badge ${c.visitCount > 1 ? 'badge-gold' : 'badge-gray'}`}>{c.visitCount > 1 ? 'Repeat' : 'New'}</span></td>
                <td style={{ fontSize: 11, color: '#9A7080' }}>{fmtShort(c.lastVisit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSettings() {
  const [oldPass, setOld] = useState('');
  const [newPass, setNew] = useState('');
  const [confirm, setConf] = useState('');
  const [msg, setMsg] = useState(null);

  async function changePassword() {
    setMsg(null);
    if (!oldPass || !newPass || !confirm) { setMsg({ type: 'error', text: 'Fill in all fields.' }); return; }
    if (newPass.length < 4) { setMsg({ type: 'error', text: 'New password must be at least 4 characters.' }); return; }
    if (newPass !== confirm) { setMsg({ type: 'error', text: "New passwords don't match." }); return; }
    try {
      await api.post('/auth/admin/password', { oldPassword: oldPass, newPassword: newPass });
      setMsg({ type: 'success', text: '✅ Password changed!' });
      setOld(''); setNew(''); setConf('');
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.error || 'Save failed' }); }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-sub">Manage your admin password</div>
      </div>
      <div className="store-card" style={{ maxWidth: 400 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#F0E0E4', marginBottom: 16 }}>🔒 Change Admin Password</div>
        <div className="form-group"><label className="form-label">Current Password</label><input className="form-inp" type="password" value={oldPass} onChange={e => setOld(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">New Password</label><input className="form-inp" type="password" value={newPass} onChange={e => setNew(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-inp" type="password" value={confirm} onChange={e => setConf(e.target.value)} onKeyDown={e => e.key === 'Enter' && changePassword()} /></div>
        {msg && <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13, background: msg.type === 'success' ? '#0f2a1a' : '#2a0f0f', color: msg.type === 'success' ? '#22c55e' : '#ef4444' }}>{msg.text}</div>}
        <button className="btn btn-gold" onClick={changePassword}>Update Password</button>
      </div>
    </div>
  );
}

function AdminEntries({ stores, entries }) {
  return (
    <div className="fade-in">
      <div className="page-header"><div className="page-title">All Entries</div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>In</th><th>Store</th><th>Customer</th><th>Outcome</th></tr></thead>
          <tbody>
            {entries.slice(0, 50).map((e) => (
              <tr key={e.id}>
                <td>{fmtDate(e.timestamp)}</td>
                <td>{e.storeName}</td>
                <td>{e.custName || e.phone || '—'}</td>
                <td><span className={`badge ${outcomeColor(e.outcome)}`}>{e.outcome}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
