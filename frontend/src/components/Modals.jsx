import { useState } from 'react';
import api from '../api';
import { PURPOSES, CATEGORIES, OUTCOMES, NO_CONV_REASONS, fmtShort } from '../utils';

export function EntryModal({ user, counters, entries, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [custName, setName] = useState('');
  const [foundCust, setFound] = useState(null);
  const [purpose, setPurp] = useState('');
  const [category, setCat] = useState('');
  const [counter, setCtr] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const storeCounters = (counters[user.storeId] || []).filter(c => c.active);
  const STEPS = 5;

  function updatePhone(value) {
    const nextPhone = value.replace(/\D/g, '').slice(0, 10);
    setPhone(nextPhone);

    if (nextPhone.length !== 10) {
      setFound(null);
      return;
    }

    const prev = entries.filter(e => e.phone === nextPhone);
    if (!prev.length) {
      setFound(null);
      return;
    }

    const last = [...prev].sort((a, b) => b.timestamp - a.timestamp)[0];
    setFound({ name: last.custName, visits: prev.length, last });
    if (last.custName && !custName) setName(last.custName);
  }

  async function submit() {
    if (saving) return;
    setSaving(true);
    
    const entryData = {
      storeId: user.storeId,
      creName: user.name,
      custName: custName || null,
      phone: phone || null,
      purpose,
      category,
      counterId: counter,
      remarks
    };

    try {
      await api.post('/visits', entryData);
      onSave();
    } catch (e) { 
      alert('Save failed: ' + (e.response?.data?.error || e.message)); 
    }
    setSaving(false);
  }

  const canNext = { 1: true, 2: !!purpose, 3: !!category, 4: !!counter, 5: true };
  function next() { if (step < STEPS) setStep(s => s + 1); else submit(); }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-head">
          <div className="modal-title">New Customer Check-in</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="step-indicator">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div key={i} className={`step-dot${i + 1 === step ? ' active' : i + 1 < step ? ' done' : ''}`} />
            ))}
            <span className="step-label">Step {step} of {STEPS}</span>
          </div>

          {step === 1 && (
            <div className="fade-in">
              <div className="step-title">Phone Number <span style={{ color: '#9A7080', fontWeight: 400, fontSize: 12 }}>(Optional)</span></div>
              {foundCust && (
                <div className="customer-found">
                  <div className="cf-name">↩ Returning: {foundCust.name || 'Customer'}</div>
                  <div className="cf-detail">{foundCust.visits} visit(s) · Last: {fmtShort(foundCust.last.timestamp)} · {foundCust.last.outcome}</div>
                </div>
              )}
              <input className="inp" style={{ marginBottom: 8 }} placeholder="10-digit mobile" maxLength={10}
                value={phone} onChange={e => updatePhone(e.target.value)} />
              <input className="inp" placeholder="Customer name (optional)"
                value={custName} onChange={e => setName(e.target.value)} />
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <div className="step-title">Purpose of Visit</div>
              <div className="tap-grid tap-grid-3">
                {PURPOSES.map(p => (
                  <button key={p} className={`tap-btn${purpose === p ? ' selected' : ''}`} onClick={() => setPurp(p)}>
                    <span className="tb-emoji">{({ Purchase: '💎', Browsing: '👁', Repair: '🔧', Pickup: '📦', Custom: '✏️' })[p]}</span>{p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <div className="step-title">Jewellery Category</div>
              <div className="tap-grid tap-grid-3">
                {CATEGORIES.map(c => (
                  <button key={c} className={`tap-btn${category === c ? ' selected' : ''}`} onClick={() => setCat(c)}>
                    <span className="tb-emoji">{({ 'Gold': '✨', 'Diamond': '💎', 'Silver': '🪙', 'Platinum': '⬜', 'Nakshi': '🏺', 'Plain Gold Necklace': '📿', 'Stone Necklace': '💠', 'Bangles': '⭕', 'Rings': '💍', 'Chains': '🔗', 'Lockets': '🔒', 'Oddiynam': '🎀', 'Gem Stones': '🪨', 'Repair': '🔧', 'Multi Products': '🎁' })[c] || '✦'}</span>{c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="fade-in">
              <div className="step-title">Select Counter</div>
              <div className="tap-grid" style={{ gridTemplateColumns: '1fr' }}>
                {storeCounters.map(c => (
                  <button key={c.id} className={`counter-btn${counter === c.id ? ' selected' : ''}`} onClick={() => setCtr(c.id)}>
                    <div className="cb-name">{c.name}</div>
                    <div className="cb-cat">{c.category || c.cat}</div>
                    {c.products && <div style={{ fontSize: 10, color: '#7A5A62', marginTop: 3 }}>{c.products}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="fade-in">
              <div className="step-title" style={{ marginTop: 8 }}>Notes <span style={{ color: '#9A7080', fontWeight: 400, fontSize: 12 }}>(Optional)</span></div>
              <textarea className="inp" rows={3} placeholder="Any remarks…" value={remarks} onChange={e => setRemarks(e.target.value)} style={{ resize: 'none', marginBottom: 0 }} />
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#1A0810', border: '1px solid #3A0E20', borderRadius: 10, fontSize: 12, color: '#C9A96E', lineHeight: 1.7 }}>
                👀 Customer will be logged as <strong>Browsing</strong>.<br />
                Use the <strong>Update Outcome</strong> button on the dashboard once they leave.
              </div>
            </div>
          )}

          <div className="step-actions">
            {step > 1 && <button className="btn step-back" onClick={() => setStep(s => s - 1)}>← Back</button>}
            <button className="btn btn-gold step-next" onClick={next} disabled={!canNext[step] || saving}>
              {saving ? 'Saving…' : step === STEPS ? '✓ Check In' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OutcomeModal({ entry, onClose }) {
  const [outcome, setOut] = useState('');
  const [reason, setReason] = useState(entry.reason || '');
  const [billNo, setBill] = useState(entry.billNo || '');
  const [saving, setSaving] = useState(false);

  const entryTime = new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const elapsedMs = Date.now() - entry.timestamp;
  const elapsedMin = Math.round(elapsedMs / 60000);
  const elapsed = elapsedMin < 60 ? `${elapsedMin}m` : `${Math.floor(elapsedMin / 60)}h ${elapsedMin % 60}m`;

  async function save() {
    if (!outcome) return;
    setSaving(true);
    try {
      await api.put(`/visits/${entry.id}`, { outcome, reason, billNo });
      onClose();
    } catch (e) { alert('Update failed: ' + e.message); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-head">
          <div className="modal-title">Update Outcome</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ background: '#130810', border: '1px solid #3A0E20', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#C0A0A8', lineHeight: 1.8 }}>
            <div><span style={{ color: '#9A7080' }}>Customer: </span><span style={{ color: '#F0E0E4', fontWeight: 600 }}>{entry.custName || entry.phone || 'Unknown'}</span></div>
            <div><span style={{ color: '#9A7080' }}>Counter: </span>{entry.counterName} · {entry.category}</div>
            <div><span style={{ color: '#9A7080' }}>Entry: </span>{entryTime} &nbsp;·&nbsp; <span style={{ color: '#f59e0b' }}>Time so far: {elapsed}</span></div>
          </div>
          <div className="step-title">What happened?</div>
          <div className="tap-grid tap-grid-2" style={{ marginBottom: 12 }}>
            {OUTCOMES.filter(o => o.key !== 'Browsing').map(o => (
              <button key={o.key} className={`tap-btn outcome-btn${outcome === o.key ? ' selected' : ''}`}
                style={outcome === o.key ? { borderColor: o.color, color: o.color, background: `${o.color}18` } : {}}
                onClick={() => setOut(o.key)}>
                <span className="tb-emoji">{o.emoji}</span>{o.label}
              </button>
            ))}
          </div>
          {outcome === 'Not Converted' && (
            <>
              <div className="step-title" style={{ marginBottom: 8 }}>Why didn't they buy?</div>
              <div className="tap-grid tap-grid-2" style={{ marginBottom: 12 }}>
                {NO_CONV_REASONS.map(r => (
                  <button key={r} className={`tap-btn${reason === r ? ' selected' : ''}`} onClick={() => setReason(r)}>{r}</button>
                ))}
              </div>
            </>
          )}
          {outcome === 'Converted' && (
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Bill Number <span style={{ color: '#9A7080', fontWeight: 400, fontSize: 11 }}>(Optional — enter by EOD)</span></label>
              <input className="inp" placeholder="e.g. ZJ-20450" value={billNo} onChange={e => setBill(e.target.value)} />
            </div>
          )}
          <button className="btn btn-gold" style={{ width: '100%' }} onClick={save} disabled={!outcome || saving}>
            {saving ? 'Saving…' : '✓ Save & Close Visit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BillModal({ entry, onClose }) {
  const [billNo, setBill] = useState(entry.billNo || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/visits/${entry.id}`, { outcome: entry.outcome, billNo });
      onClose();
    } catch (e) { alert('Update failed: ' + e.message); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in" style={{ maxWidth: 360 }}>
        <div className="modal-head">
          <div className="modal-title">Add Bill Number</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 13, color: '#C0A0A8', marginBottom: 16 }}>
            <span style={{ color: '#F0E0E4', fontWeight: 600 }}>{entry.custName || entry.phone || 'Customer'}</span> · {entry.counterName}
          </div>
          <label className="form-label">Bill Number</label>
          <input className="inp" placeholder="e.g. ZJ-20450" value={billNo}
            onChange={e => setBill(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} />
          <button className="btn btn-gold" style={{ width: '100%', marginTop: 4 }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : '✓ Save Bill Number'}
          </button>
        </div>
      </div>
    </div>
  );
}
