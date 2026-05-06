export const genId = () => Math.random().toString(36).slice(2, 10);
export const today = () => new Date().toDateString();
export const fmtCur = v => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`;
export const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtTime = ts => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtSpent = (entry, exit) => { 
  if (!exit) return '—'; 
  const m = Math.round((exit - entry) / 60000); 
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; 
};
export const fmtShort = ts => ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

export const outcomeColor = o => 
  ({ Converted: 'badge-green', 'Not Converted': 'badge-red', Pending: 'badge-yellow', Browsing: 'badge-blue', 'Repair/Order': 'badge-purple' }[o] || 'badge-gray');

export const PURPOSES = ['Purchase', 'Browsing', 'Repair', 'Pickup', 'Custom'];
export const CATEGORIES = ['Gold', 'Diamond', 'Silver', 'Platinum', 'Nakshi', 'Plain Gold Necklace', 'Stone Necklace', 'Bangles', 'Rings', 'Chains', 'Lockets', 'Oddiynam', 'Gem Stones', 'Repair', 'Multi Products'];
export const OUTCOMES = [
  { key: 'Converted', label: 'Converted', emoji: '✅', color: '#22c55e' },
  { key: 'Not Converted', label: 'Not Converted', emoji: '❌', color: '#ef4444' },
  { key: 'Pending', label: 'Pending', emoji: '⏳', color: '#f59e0b' },
  { key: 'Browsing', label: 'Browsing', emoji: '👀', color: '#C9A96E' },
  { key: 'Repair/Order', label: 'Repair/Order', emoji: '🔧', color: '#D81B60' },
];
export const NO_CONV_REASONS = ['Price too high', 'Design unavailable', 'Just browsing', 'Will return later', 'Out of budget', 'No stock'];

export function exportCSV(entries, filename='manepally-entries.csv') {
  const headers = ['Date','Entry Time','Exit Time','Time Spent (min)','Store','CRE Name','Customer Name','Phone','Type','Purpose','Category','Counter','Outcome','Bill No.','Non-Conv Reason','Remarks'];
  const rows = entries.map(e => {
    const d = new Date(e.timestamp);
    const exitTs = e.exitTimestamp ? new Date(e.exitTimestamp) : null;
    const spent = exitTs ? Math.round((e.exitTimestamp - e.timestamp)/60000) : '';
    return [
      d.toLocaleDateString('en-IN'),
      d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
      exitTs ? exitTs.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '',
      spent,
      e.storeName||'',
      e.creName||'',
      e.custName||'',
      e.phone||'',
      e.custType||'',
      e.purpose||'',
      e.category||'',
      e.counterName||'',
      e.outcome||'',
      e.billNo||'',
      e.reason||'',
      e.remarks||''
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
