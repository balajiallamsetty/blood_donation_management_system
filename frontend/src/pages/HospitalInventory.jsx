import React, { useEffect, useMemo, useRef, useState } from 'react';

// Stable constants outside component to avoid hook deps noise
const BLOOD_GROUPS = ['O','A','B','AB'];
const COMBOS = BLOOD_GROUPS.flatMap(bg => ([{ bloodGroup: bg, rh: '+', units: 0 }, { bloodGroup: bg, rh: '-', units: 0 }]));
import { getMyHospital, getHospitalInventory, replaceInventory, patchInventoryItem } from '../api/HospitalApi';
import useAuthStore from '../store/useAuthStore';
import Button from '../components/Button';
import Alert from '../components/Alert';

// Simple table row editor for bulk inventory list
const HospitalInventory = () => {
  const { user } = useAuthStore();
  const [hospital, setHospital] = useState(null);
  // canonical inventory from backend (track last saved state for potential diff or future features)
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState([]); // editable copy for bulk replace
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const fileInputRef = useRef(null);

  

  const showAlert = (type, message) => setAlert({ type, message });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const h = await getMyHospital();
        setHospital(h);
        const inv = await getHospitalInventory(h._id);
        // Sort by group order then rh
        const order = { O:0, A:1, B:2, AB:3 };
        const sorted = [...inv].sort((a,b) => (order[a.bloodGroup] - order[b.bloodGroup]) || (a.rh === '+' ? -1 : 1));
        setItems(sorted);
        if (sorted.length === 0) {
          // Prepopulate full matrix if empty
          setDraft(COMBOS);
        } else {
          setDraft(sorted.map(i => ({ bloodGroup: i.bloodGroup, rh: i.rh, units: i.units })));
        }
      } catch (e) {
        const msg = e?.response?.data?.message || e.message || 'Failed to load inventory';
        console.error('Load inventory error:', msg, e?.response?.data);
        // Friendly guidance for common cases
        if (e?.response?.status === 404) {
          showAlert('destructive', 'No hospital record found for your account. Please contact admin to onboard your hospital.');
        } else if (e?.response?.status === 401 || e?.response?.status === 403) {
          showAlert('destructive', 'Unauthorized. Please log in with a hospital account.');
        } else {
          showAlert('destructive', msg);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const updateDraftField = (index, field, value) => {
    setDraft(d => d.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const addDraftRow = () => setDraft(d => [...d, { bloodGroup: 'O', rh: '+', units: 0 }]);
  const removeDraftRow = (index) => setDraft(d => d.filter((_, i) => i !== index));

  const saveBulk = async () => {
    if (!hospital) return;
    try {
      setSaving(true);
      // basic validation
      for (const r of draft) {
        const validBG = BLOOD_GROUPS.includes(r.bloodGroup);
        const validRh = r.rh === '+' || r.rh === '-';
        if (!validBG || !validRh || r.units < 0 || Number.isNaN(r.units)) {
          showAlert('destructive', 'Invalid row data. Use A/B/O/AB, RH +/- and units >= 0');
          setSaving(false);
          return;
        }
      }
      const result = await replaceInventory(hospital._id, draft);
      // sort again
      const order = { O:0, A:1, B:2, AB:3 };
      const sorted = [...result].sort((a,b) => (order[a.bloodGroup] - order[b.bloodGroup]) || (a.rh === '+' ? -1 : 1));
      setItems(sorted); // keep canonical
      setDraft(sorted.map(i => ({ bloodGroup: i.bloodGroup, rh: i.rh, units: i.units })));
      showAlert('success', 'Inventory replaced successfully');
      // Notify dashboard to refresh
      window.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: { hospitalId: hospital._id, source: 'bulk' } }));
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Bulk replace failed';
      showAlert('destructive', msg);
    } finally {
      setSaving(false);
    }
  };

  const quickAdjust = async (bloodGroup, rh, deltaUnits) => {
    if (!hospital) return;
    try {
    const updated = await patchInventoryItem(hospital._id, { bloodGroup, rh, deltaUnits });
  setItems(prev => {
        const idx = prev.findIndex(i => i.bloodGroup === updated.bloodGroup && i.rh === updated.rh);
        if (idx === -1) return [...prev, updated];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
      // reflect into draft too
      setDraft(d => {
        const idx = d.findIndex(i => i.bloodGroup === updated.bloodGroup && i.rh === updated.rh);
        if (idx === -1) return [...d, { bloodGroup: updated.bloodGroup, rh: updated.rh, units: updated.units }];
        const next = [...d];
        next[idx].units = updated.units;
        return next;
      });
      showAlert('success', `Adjusted ${bloodGroup}${rh} by ${deltaUnits}`);
      window.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: { hospitalId: hospital._id, source: 'adjust' } }));
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Adjustment failed';
      showAlert('destructive', msg);
    }
  };

  // CSV helpers
  const toCSV = (rows) => {
    const header = 'bloodGroup,rh,units\n';
    const body = rows.map(r => `${r.bloodGroup},${r.rh},${Number(r.units) || 0}`).join('\n');
    return header + body;
  };
  const downloadCSV = () => {
    const blob = new Blob([toCSV(draft)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const triggerImport = () => fileInputRef.current?.click();
  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const out = [];
    for (let i=0;i<lines.length;i++) {
      const line = lines[i].trim();
      if (i === 0 && line.toLowerCase().startsWith('bloodgroup')) continue; // skip header
      const [bg, rh, unitsStr] = line.split(',').map(s => s.trim());
      const units = Number(unitsStr);
      if (!BLOOD_GROUPS.includes(bg) || !['+','-'].includes(rh) || Number.isNaN(units) || units < 0) {
        showAlert('destructive', `CSV error on line ${i+1}`);
        return;
      }
      out.push({ bloodGroup: bg, rh, units });
    }
    setDraft(out);
    showAlert('success', `Imported ${out.length} rows from CSV`);
  };

  const totalUnits = useMemo(() => draft.reduce((sum, r) => sum + (Number(r.units) || 0), 0), [draft]);
  const getUnits = (bg, rh) => {
    const found = items.find(i => i.bloodGroup === bg && i.rh === rh);
    return found ? (Number(found.units) || 0) : 0;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <h1>Manage Inventory</h1>
      <p>Upload or adjust blood units for <strong>{hospital?.name || 'your hospital'}</strong>.</p>
      {alert && <div style={{ marginBottom: 16 }}><Alert type={alert.type} message={alert.message} /></div>}
      {loading && <p>Loading...</p>}

      {/* Quick Adjust Section */}
      {!loading && (
        <div style={{ marginBottom: 32 }}>
          <h3>Quick Adjust</h3>
          <p>Increment or decrement units for any group.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(180px,1fr))', gap:12 }}>
            {BLOOD_GROUPS.flatMap(bg => ([
              { bg, rh:'+' }, { bg, rh:'-' }
            ])).map(({ bg, rh }) => (
              <div key={`${bg}${rh}`} style={{ padding:12, border:'1px solid #eee', borderRadius:8 }}>
                <div style={{ fontWeight:600, marginBottom:8 }}>{bg}{rh} <span style={{ color:'#666', fontWeight:400 }}>({getUnits(bg,rh)})</span></div>
                <Button onClick={() => quickAdjust(bg, rh, +1)} style={{ marginRight:8 }}>+1</Button>
                <Button variant="outline" disabled={getUnits(bg,rh) <= 0} onClick={() => quickAdjust(bg, rh, -1)}>-1</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Replace Editor */}
      {!loading && (
        <div>
          <h3>Bulk Inventory Editor</h3>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'8px 0 12px' }}>
            <div style={{ color:'#666' }}>Total units: <strong>{totalUnits}</strong></div>
            <div>
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display:'none' }} onChange={onImportFile} />
              <Button variant="secondary" onClick={triggerImport} style={{ marginRight:8 }}>Import CSV</Button>
              <Button variant="secondary" onClick={downloadCSV}>Export CSV</Button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Blood Group</th>
                <th style={{ padding: 8 }}>RH</th>
                <th style={{ padding: 8 }}>Units</th>
                <th style={{ padding: 8 }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {draft.map((row, idx) => {
                const combo = `${row.bloodGroup}${row.rh}`;
                const duplicate = draft.filter(r => `${r.bloodGroup}${r.rh}` === combo).length > 1;
                const invalid = !BLOOD_GROUPS.includes(row.bloodGroup) || !['+','-'].includes(row.rh) || Number(row.units) < 0 || Number.isNaN(Number(row.units));
                const rowStyle = invalid || duplicate ? { background: '#fff1f0' } : undefined;
                return (
                  <tr key={idx} style={rowStyle}>
                    <td style={{ padding: 6 }}>
                      <select value={row.bloodGroup} onChange={e => updateDraftField(idx, 'bloodGroup', e.target.value)}>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 6 }}>
                      <select value={row.rh} onChange={e => updateDraftField(idx, 'rh', e.target.value)}>
                        <option value="+">+</option>
                        <option value="-">-</option>
                      </select>
                    </td>
                    <td style={{ padding: 6 }}>
                      <input
                        type="number"
                        min={0}
                        value={row.units}
                        onChange={e => updateDraftField(idx, 'units', Number(e.target.value))}
                        style={{ width: 80, borderColor: (invalid? '#ff4d4f' : undefined), borderWidth: invalid? 2: undefined }}
                      />
                      {(invalid || duplicate) && (
                        <div style={{ color:'#cf1322', fontSize: 12, marginTop: 4 }}>
                          {invalid ? 'Invalid values' : 'Duplicate group/RH'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 6 }}>
                      <Button variant="destructive" onClick={() => removeDraftRow(idx)}>X</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Button onClick={addDraftRow} variant="secondary" style={{ marginRight: 12 }}>Add Row</Button>
          <Button onClick={saveBulk} disabled={saving}>
            {saving ? 'Saving...' : 'Replace Inventory'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default HospitalInventory;
