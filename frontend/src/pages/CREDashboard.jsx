import { useState, useEffect } from 'react';
import api from '../api';
import { fmtTime, fmtSpent, outcomeColor, today } from '../utils';
import { EntryModal, OutcomeModal, BillModal } from '../components/Modals';

function CREDashboard({ user, stores, counters, onLogout }) {
  const [entries, setEntries] = useState([]);
  const [showModal, setModal] = useState(false);
  const [outcomeEntry, setOutcome] = useState(null);
  const [billEntry, setBill] = useState(null);

  const fetchEntries = () => {
    api.get('/visits').then(res => setEntries(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchEntries();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchEntries, 30000);
    return () => clearInterval(interval);
  }, []);

  const myEntries = entries.filter(e => e.storeId === user.storeId);
  const todayE = myEntries.filter(e => new Date(e.timestamp).toDateString() === today());
  const conv = todayE.filter(e => e.outcome === 'Converted');
  const convPct = todayE.length ? Math.round((conv.length / todayE.length) * 100) : 0;
  const browsing = todayE.filter(e => e.outcome === 'Browsing');

  const closedToday = todayE.filter(e => e.exitTimestamp);
  const avgMin = closedToday.length
    ? Math.round(closedToday.reduce((s, e) => s + (e.exitTimestamp - e.timestamp), 0) / closedToday.length / 60000)
    : null;

  return (
    <div className="app">
      <div className="main">
        <div className="page fade-in" style={{ paddingBottom: 80 }}>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="live-dot" />
                <span style={{ fontSize: 11, color: '#9A7080' }}>Live</span>
              </div>
              <div className="page-title">My Dashboard</div>
              <div className="page-sub">{user.storeName}</div>
            </div>
            <button className="btn" onClick={onLogout}>Sign Out</button>
          </div>

          <div className="cards-grid">
            <div className="metric-card"><div className="mc-label">Today Walk-ins</div><div className="mc-value">{todayE.length}</div></div>
            <div className="metric-card"><div className="mc-label">Converted</div><div className="mc-value mc-green">{conv.length}</div></div>
            <div className="metric-card">
              <div className="mc-label">Conv. %</div>
              <div className="mc-value" style={{ color: convPct >= 50 ? '#22c55e' : convPct >= 30 ? '#f59e0b' : '#ef4444' }}>{convPct}%</div>
            </div>
            <div className="metric-card">
              <div className="mc-label">Avg Time Spent</div>
              <div className="mc-value mc-gold">{avgMin !== null ? `${avgMin}m` : '—'}</div>
              <div className="mc-sub">{closedToday.length} closed visits</div>
            </div>
          </div>

          {browsing.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#C9A96E', marginBottom: 8, fontWeight: 600 }}>👀 Currently Browsing ({browsing.length})</div>
              {browsing.map(e => (
                <div key={e.id} className="followup-item" style={{ borderColor: '#1a2a4a' }}>
                  <div className="fi-dot" style={{ background: '#C9A96E' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F0E0E4' }}>{e.custName || e.phone || 'Customer'}</div>
                    <div style={{ fontSize: 11, color: '#9A7080' }}>{e.counterName} · {e.category} · In since {fmtTime(e.timestamp)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {e.outcome === 'Converted' && !e.billNo && (
                      <button className="btn btn-sm btn-gold" onClick={() => setBill(e)}>+ Bill</button>
                    )}
                    <button className="btn btn-sm" style={{ borderColor: '#C9A96E', color: '#C9A96E' }} onClick={() => setOutcome(e)}>Update →</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="table-wrap">
            <div className="table-head"><div className="table-title">Today's Entries ({todayE.length})</div></div>
            {todayE.length === 0 ? (
              <div className="no-data">No entries yet today. Tap + to log your first walk-in!</div>
            ) : (
              <table>
                <thead><tr><th>In</th><th>Out</th><th>Spent</th><th>Customer</th><th>Category</th><th>Outcome</th><th></th></tr></thead>
                <tbody>
                  {[...todayE].reverse().map(e => (
                    <tr key={e.id}>
                      <td style={{ fontSize: 11, color: '#9A7080', whiteSpace: 'nowrap' }}>{fmtTime(e.timestamp)}</td>
                      <td style={{ fontSize: 11, color: '#9A7080', whiteSpace: 'nowrap' }}>{e.exitTimestamp ? fmtTime(e.exitTimestamp) : '—'}</td>
                      <td style={{ fontSize: 11, color: '#f59e0b' }}>{fmtSpent(e.timestamp, e.exitTimestamp)}</td>
                      <td>
                        <div style={{ color: '#F0E0E4' }}>{e.custName || '—'}</div>
                        {e.phone && <div style={{ fontSize: 10, color: '#9A7080' }}>{e.phone}</div>}
                      </td>
                      <td><span className="badge badge-gold">{e.category}</span></td>
                      <td>
                        <span className={`badge ${outcomeColor(e.outcome)}`}>{e.outcome}</span>
                        {e.billNo && <div style={{ fontSize: 10, color: '#C9A96E', marginTop: 2 }}>#{e.billNo}</div>}
                      </td>
                      <td>
                        {e.outcome === 'Browsing' && (
                          <button className="btn btn-sm" style={{ fontSize: 10, borderColor: '#C9A96E', color: '#C9A96E' }} onClick={() => setOutcome(e)}>Update</button>
                        )}
                        {e.outcome === 'Converted' && !e.billNo && (
                          <button className="btn btn-sm btn-gold" style={{ fontSize: 10 }} onClick={() => setBill(e)}>+ Bill</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <button className="fab" onClick={() => setModal(true)}>+</button>

      {showModal && <EntryModal user={user} stores={stores} counters={counters} entries={entries} onClose={() => setModal(false)} onSave={() => { setModal(false); fetchEntries(); }} />}
      {outcomeEntry && <OutcomeModal entry={outcomeEntry} onClose={() => { setOutcome(null); fetchEntries(); }} />}
      {billEntry && <BillModal entry={billEntry} onClose={() => { setBill(null); fetchEntries(); }} />}
    </div>
  );
}

export default CREDashboard;
