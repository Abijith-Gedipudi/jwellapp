import { useState, useEffect } from 'react';
import api from '../api';
import { fmtDate, fmtTime, fmtShort, CATEGORIES, OUTCOMES, outcomeColor, exportCSV } from '../utils';

function branchLabel(name) {
  return (name || '').replace(/^Manepally\s+/i, '').trim() || name || '—';
}

function DonutChart({ pct, color = '#C9A96E', size = 80 }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#2A0E1A" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`} transform="rotate(-90 40 40)" />
      </svg>
      <div className="donut-center">
        <div className="donut-pct" style={{ color }}>{pct}%</div>
        <div className="donut-lbl">conv.</div>
      </div>
    </div>
  );
}

function MiniBarChart({ data, color = '#C9A96E' }) {
  const max = Math.max(...data.map(d => d.v), 1);

  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div className="bar-val">{d.v || ''}</div>
          <div className="bar-fill" style={{ height: `${Math.max((d.v / max) * 78, 2)}px`, background: color }} />
          <div className="bar-lbl">{d.l}</div>
        </div>
      ))}
    </div>
  );
}

function AdminDashboard({ stores, counters, onLogout, refreshData }) {
  const [section, setSection] = useState('overview');
  const [entries, setEntries] = useState([]);
  const [now] = useState(() => Date.now());
  const [todayString] = useState(() => new Date().toDateString());

  const fetchEntries = () => {
    api.get('/visits').then(res => setEntries(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const weekE = entries.filter(e => e.timestamp >= now - 7 * 86400000);
  const todayE = entries.filter(e => new Date(e.timestamp).toDateString() === todayString);
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
          <div className="sb-user-role">All {stores.length || 0} Stores</div>
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
          {section === 'entries' && <AdminEntries stores={stores} entries={entries} onUpdate={fetchEntries} />}
          {section === 'settings' && <AdminSettings />}
        </div>
      </div>
    </div>
  );
}

function AdminOverview({ stores, weekE, todayE, conv, convPct }) {
  const storePerf = stores.filter(s => s.active).map(s => {
    const se = weekE.filter(e => e.storeId === s.id);
    const sc = se.filter(e => e.outcome === 'Converted');
    return { ...s, visits: se.length, conv: sc.length, pct: se.length ? Math.round(sc.length / se.length * 100) : 0 };
  }).sort((a, b) => b.visits - a.visits);

  const hourly = Array.from({ length: 12 }, (_, i) => ({ l: `${9 + i}`, v: 0 }));
  todayE.forEach(e => {
    const h = new Date(e.timestamp).getHours();
    if (h >= 9 && h < 21) hourly[h - 9].v++;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 11, color: '#9A7080' }}>Live · All Stores</span>
        </div>
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
        <div className="metric-card"><div className="mc-label">Repeat Customers</div><div className="mc-value mc-gold">{weekE.filter(e => e.custType === 'Repeat').length}</div></div>
        <div className="metric-card">
          <div className="mc-label">Avg Time</div>
          <div className="mc-value mc-gold">{(() => {
            const closed = weekE.filter(e => e.exitTimestamp);
            return closed.length ? `${Math.round(closed.reduce((sum, e) => sum + (e.exitTimestamp - e.timestamp), 0) / closed.length / 60000)}m` : '—';
          })()}</div>
        </div>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="metric-card">
          <div className="mc-label">Conversion Funnel</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <DonutChart pct={convPct} color={convPct >= 50 ? '#22c55e' : convPct >= 30 ? '#f59e0b' : '#ef4444'} />
            <div style={{ flex: 1 }}>
              {[
                ['Walk-ins', weekE.length, '#C9A96E'],
                ['Converted', conv.length, '#22c55e'],
                ['Pending', weekE.filter(e => e.outcome === 'Pending').length, '#f59e0b'],
                ['Lost', weekE.filter(e => e.outcome === 'Not Converted').length, '#ef4444'],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: '#9A7080' }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="mc-label">Today's Hourly Flow</div>
          <MiniBarChart data={hourly} color="#7A1C3A" />
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-head"><div className="table-title">Store Leaderboard</div></div>
        {storePerf.length === 0 ? <div className="no-data">No active stores.</div> : (
          <table>
            <thead><tr><th>Store</th><th>Walk-ins</th><th>Converted</th><th>Rate</th><th>Avg Time</th></tr></thead>
            <tbody>
              {storePerf.map(s => {
                const closed = weekE.filter(e => e.storeId === s.id && e.exitTimestamp);
                const avgM = closed.length ? Math.round(closed.reduce((sum, e) => sum + (e.exitTimestamp - e.timestamp), 0) / closed.length / 60000) : null;
                return (
                  <tr key={s.id}>
                    <td style={{ color: '#F0E0E4', fontWeight: 600 }}>{s.name}</td>
                    <td>{s.visits}</td>
                    <td style={{ color: '#22c55e' }}>{s.conv}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${s.pct}%`, background: s.pct >= 50 ? '#22c55e' : s.pct >= 30 ? '#f59e0b' : '#ef4444' }} /></div>
                        <span>{s.pct}%</span>
                      </div>
                    </td>
                    <td>{avgM !== null ? `${avgM}m` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AdminStores({ stores, entries, onUpdate }) {
  const [showAdd, setAdd] = useState(false);
  const [form, setForm] = useState({ name: '', pin: '' });
  const [editId, setEdit] = useState(null);
  const [editPin, setEPin] = useState('');

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

  async function updatePin(id) {
    if (!editPin.trim()) return;
    await api.put(`/stores/${id}`, { pin: editPin.trim() });
    setEdit(null);
    setEPin('');
    onUpdate();
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">Stores & PINs</div>
        <div className="page-sub">Manage stores and CRE login PINs</div>
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
      {stores.map(s => {
        const se = entries.filter(e => e.storeId === s.id);
        const sc = se.filter(e => e.outcome === 'Converted');
        const pct = se.length ? Math.round(sc.length / se.length * 100) : 0;

        return (
          <div key={s.id} className="store-card" style={{ opacity: s.active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#F0E0E4', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {s.name}
                  <span style={{ fontSize: 12, color: '#9A7080' }}>PIN:</span>
                  {editId === s.id
                    ? <input className="form-inp" style={{ width: 88, padding: '4px 8px', fontSize: 12 }} value={editPin} onChange={e => setEPin(e.target.value)} placeholder="New PIN" />
                    : <span style={{ fontSize: 12, color: '#C9A96E', letterSpacing: 1 }}>{s.pin || 'Hidden'}</span>}
                  {editId === s.id
                    ? (
                      <>
                        <button className="btn btn-sm btn-gold" onClick={() => updatePin(s.id)}>Save</button>
                        <button className="btn btn-sm" onClick={() => setEdit(null)}>Cancel</button>
                      </>
                    )
                    : <button className="btn btn-sm" onClick={() => { setEdit(s.id); setEPin(s.pin || ''); }}>Change PIN</button>}
                </div>
                <div style={{ display: 'flex', gap: 18, marginTop: 10, fontSize: 12, color: '#9A7080' }}>
                  <span>{se.length} visits</span>
                  <span style={{ color: '#22c55e' }}>{sc.length} converted</span>
                  <span style={{ color: pct >= 50 ? '#22c55e' : pct >= 30 ? '#f59e0b' : '#ef4444' }}>{pct}% rate</span>
                </div>
              </div>
              <button className={`btn btn-sm ${s.active ? 'btn-danger' : ''}`} onClick={() => toggleStore(s.id)}>{s.active ? 'Disable' : 'Enable'}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminCounters({ stores, counters, onUpdate }) {
  const [selStore, setSel] = useState(stores[0]?.id || '');
  const [showAdd, setAdd] = useState(false);
  const [form, setForm] = useState({ name: '', cat: 'Gold', products: '' });
  const effectiveStore = selStore || stores[0]?.id || '';
  const ctrs = counters[effectiveStore] || [];

  async function addCounter() {
    if (!form.name.trim()) return;
    if (!effectiveStore) return;
    await api.post(`/counters/${effectiveStore}`, { name: form.name, category: form.cat, products: form.products });
    setForm({ name: '', cat: 'Gold', products: '' });
    setAdd(false);
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
      <div className="page-header">
        <div className="page-title">Counter Management</div>
        <div className="page-sub">Counters visible to CREs when logging entries</div>
      </div>
      <div className="filter-bar">
        <select className="filter-sel" value={effectiveStore} onChange={e => setSel(e.target.value)}>
          {stores.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn btn-gold btn-sm" onClick={() => setAdd(true)}>+ Add Counter</button>
      </div>
      {showAdd && (
        <div className="store-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F0E0E4', marginBottom: 12 }}>New Counter</div>
          <div className="form-row">
            <div><label className="form-label">Name</label><input className="form-inp" placeholder="e.g., C18 — Bridal" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="form-label">Category</label><select className="form-sel" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Products</label><input className="form-inp" placeholder="Products handled at this counter" value={form.products} onChange={e => setForm({ ...form, products: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-gold" onClick={addCounter}>Add</button>
            <button className="btn" onClick={() => setAdd(false)}>Cancel</button>
          </div>
        </div>
      )}
      {ctrs.length === 0 ? <div className="no-data">No counters for this store yet.</div> : ctrs.map(c => (
        <div key={c.id} className="counter-item" style={{ opacity: c.active ? 1 : 0.5 }}>
          <div style={{ flex: 1 }}>
            <div>
              <span style={{ color: '#F0E0E4', fontWeight: 500 }}>{c.name}</span>
              <span className="badge badge-gold" style={{ marginLeft: 8 }}>{c.category || c.cat}</span>
            </div>
            {c.products && <div style={{ fontSize: 11, color: '#9A7080', marginTop: 3 }}>{c.products}</div>}
          </div>
          <button className="btn btn-sm" onClick={() => toggleCounter(c.id)}>{c.active ? 'Disable' : 'Enable'}</button>
          <button className="btn btn-sm btn-danger" onClick={() => removeCounter(c.id)}>Remove</button>
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
              <thead><tr><th>Category</th>{stores.filter(s => s.active).map(s => <th key={s.id} style={{ fontSize: 10, padding: '8px 6px' }}>{branchLabel(s.name)}</th>)}</tr></thead>
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

function AdminEntries({ stores, entries, onUpdate }) {
  const [filterStore, setFS] = useState('all');
  const [filterOutcome, setFO] = useState('all');
  const [filterDate, setFD] = useState('week');
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [now] = useState(() => Date.now());
  const [todayString] = useState(() => new Date().toDateString());

  const filtered = entries
    .filter(e => filterStore === 'all' || e.storeId === filterStore)
    .filter(e => filterOutcome === 'all' || e.outcome === filterOutcome)
    .filter(e => {
      if (filterDate === 'today') return new Date(e.timestamp).toDateString() === todayString;
      if (filterDate === 'week') return e.timestamp >= now - 7 * 86400000;
      if (filterDate === 'month') return e.timestamp >= now - 30 * 86400000;
      return true;
    });

  function doExport() {
    exportCSV(filtered, 'manepally-entries.csv');
  }

  async function deleteEntry(id) {
    setDeleting(true);
    try {
      await api.delete(`/visits/${id}`);
      setConfirmId(null);
      onUpdate();
    } catch (e) {
      alert('Delete failed: ' + (e.response?.data?.error || e.message));
    }
    setDeleting(false);
  }

  const confirmEntry = confirmId ? entries.find(e => e.id === confirmId) : null;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">All Entries</div>
        <div className="page-sub">{filtered.length} entries shown</div>
      </div>
      <div className="filter-bar">
        <select className="filter-sel" value={filterStore} onChange={e => setFS(e.target.value)}>
          <option value="all">All Stores</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="filter-sel" value={filterOutcome} onChange={e => setFO(e.target.value)}>
          <option value="all">All Outcomes</option>
          {OUTCOMES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <select className="filter-sel" value={filterDate} onChange={e => setFD(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
        <button className="btn btn-gold btn-sm" onClick={doExport}>Export CSV</button>
      </div>
      <div className="table-wrap">
        <div className="table-head"><div className="table-title">Walk-in Records</div></div>
        <table>
          <thead><tr><th>In</th><th>Out</th><th>Store</th><th>CRE</th><th>Customer</th><th>Purpose</th><th>Category</th><th>Outcome</th><th></th></tr></thead>
          <tbody>
            {filtered.slice(0, 200).map((e) => (
              <tr key={e.id}>
                <td style={{ fontSize: 12 }}>{fmtDate(e.timestamp)}</td>
                <td style={{ fontSize: 12 }}>{e.exitTimestamp ? fmtTime(e.exitTimestamp) : '—'}</td>
                <td style={{ fontSize: 12, color: '#9A7880' }}>{branchLabel(e.storeName)}</td>
                <td style={{ fontSize: 12 }}>{e.creName}</td>
                <td>
                  <div style={{ color: '#F0E0E4' }}>{e.custName || '—'}</div>
                  {e.phone && <div style={{ fontSize: 10, color: '#9A7080' }}>{e.phone}</div>}
                </td>
                <td>{e.purpose}</td>
                <td><span className="badge badge-gold">{e.category}</span></td>
                <td>
                  <span className={`badge ${outcomeColor(e.outcome)}`}>{e.outcome}</span>
                  {e.billNo && <div style={{ fontSize: 10, color: '#C9A96E', marginTop: 2 }}>#{e.billNo}</div>}
                </td>
                <td><button className="btn btn-sm btn-danger" onClick={() => setConfirmId(e.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="no-data">No entries match your filters.</div>}
      </div>
      {confirmEntry && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmId(null)}>
          <div className="modal fade-in" style={{ maxWidth: 380 }}>
            <div className="modal-head">
              <div className="modal-title">Delete Entry?</div>
              <button className="modal-close" onClick={() => setConfirmId(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: 13, color: '#B09098', lineHeight: 1.7, marginBottom: 16 }}>
                <div><span style={{ color: '#9A7080' }}>Customer: </span>{confirmEntry.custName || confirmEntry.phone || 'Unknown'}</div>
                <div><span style={{ color: '#9A7080' }}>Store: </span>{confirmEntry.storeName}</div>
                <div><span style={{ color: '#9A7080' }}>Time: </span>{fmtDate(confirmEntry.timestamp)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmId(null)}>Cancel</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => deleteEntry(confirmId)} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
