
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CheckCircle2, Search, Users } from 'lucide-react';
import { api } from '../lib/api';

type Telecaller = {
  id: string;
  full_name: string;
  email?: string;
  is_active: boolean;
};

type Lead = {
  id: string;
  lead_code?: string;
  name: string;
  company?: string | null;
  phone: string;
  email?: string | null;
  assigned_to: string | null;
  sales_stage: string;
  call_outcome?: string | null;
};

export default function TransferLeads() {
  const [telecallers, setTelecallers] = useState<Telecaller[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [userResponse, leadResponse] = await Promise.all([
        api<{ items: Telecaller[] }>('/users?role=telecaller&active=true'),
        api<{ items: Lead[] }>('/leads?limit=1000')
      ]);

      setTelecallers(userResponse.items);
      setLeads(leadResponse.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load transfer data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const sourceLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return leads.filter(lead => {
      if (lead.assigned_to !== sourceId) return false;

      if (!term) return true;

      return [
        lead.name,
        lead.company,
        lead.phone,
        lead.email,
        lead.lead_code
      ].some(value => String(value || '').toLowerCase().includes(term));
    });
  }, [leads, sourceId, search]);

  const selectedCount = selectedIds.filter(id =>
    sourceLeads.some(lead => lead.id === id)
  ).length;

  function changeSource(value: string) {
    setSourceId(value);
    setSelectedIds([]);
    setMessage('');
    setError('');
  }

  function toggleLead(id: string) {
    setSelectedIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );
  }

  function toggleAll() {
    const visibleIds = sourceLeads.map(lead => lead.id);
    const allSelected = visibleIds.length > 0 &&
      visibleIds.every(id => selectedIds.includes(id));

    setSelectedIds(current =>
      allSelected
        ? current.filter(id => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    );
  }

  async function transferLeads() {
    if (!sourceId || !targetId) {
      setError('Choose both source and destination telecallers.');
      return;
    }

    if (sourceId === targetId) {
      setError('Source and destination telecallers must be different.');
      return;
    }

    if (!selectedIds.length) {
      setError('Select at least one lead to transfer.');
      return;
    }

    const confirmed = window.confirm(
      `Transfer ${selectedIds.length} selected lead(s)? Their existing progress and call history will be preserved.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const result = await api<{ transferred: number }>('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          targetId,
          leadIds: selectedIds
        })
      });

      setMessage(`${result.transferred} lead(s) transferred successfully.`);
      setSelectedIds([]);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfer failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">LEAD MANAGEMENT</div>
          <h1>Transfer Leads</h1>
          <p>Move existing leads between telecallers without resetting their progress.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {message && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} className="me-2" />
          {message}
        </div>
      )}

      <section className="surface-card p-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-5">
            <label className="form-label" htmlFor="sourceTelecaller">
              Transfer from
            </label>
            <select
              id="sourceTelecaller"
              className="form-select"
              value={sourceId}
              onChange={e => changeSource(e.target.value)}
              disabled={loading || busy}
            >
              <option value="">Choose source telecaller</option>
              {telecallers.map(person => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2 text-center">
            <ArrowLeftRight size={25} />
          </div>

          <div className="col-md-5">
            <label className="form-label" htmlFor="targetTelecaller">
              Transfer to
            </label>
            <select
              id="targetTelecaller"
              className="form-select"
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              disabled={loading || busy}
            >
              <option value="">Choose destination telecaller</option>
              {telecallers.filter(person => person.id !== sourceId).map(person => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="surface-card">
        <div className="p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="h5 mb-1">Select leads</h2>
            <p className="text-muted mb-0">
              {sourceLeads.length} leads available · {selectedCount} selected
            </p>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <div className="input-group">
              <span className="input-group-text"><Search size={16} /></span>
              <input
                className="form-control"
                placeholder="Search leads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={toggleAll}
              disabled={!sourceLeads.length || busy}
            >
              Select all
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-4">Loading leads...</div>
        ) : !sourceId ? (
          <div className="p-5 text-center text-muted">
            <Users size={30} className="mb-2" />
            <p className="mb-0">Choose a source telecaller to view their leads.</p>
          </div>
        ) : !sourceLeads.length ? (
          <div className="p-4 text-muted">No leads found for this telecaller.</div>
        ) : (
          <div className="table-responsive">
            <table className="table crm-table align-middle mb-0">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={sourceLeads.length > 0 &&
                        sourceLeads.every(lead => selectedIds.includes(lead.id))}
                      onChange={toggleAll}
                      aria-label="Select all visible leads"
                    />
                  </th>
                  <th>Lead</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Current stage</th>
                  <th>Call outcome</th>
                </tr>
              </thead>
              <tbody>
                {sourceLeads.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                        aria-label={`Select ${lead.name}`}
                      />
                    </td>
                    <td>
                      <strong>{lead.name}</strong>
                      {lead.lead_code && (
                        <div className="small text-muted">{lead.lead_code}</div>
                      )}
                    </td>
                    <td>{lead.company || '—'}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.sales_stage}</td>
                    <td>{lead.call_outcome || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <span className="text-muted small">
            Lead history and existing follow-ups will remain attached to each transferred lead.
          </span>
          <button
            className="btn btn-primary"
            onClick={transferLeads}
            disabled={busy || loading || !sourceId || !targetId || !selectedCount}
          >
            <ArrowLeftRight size={17} className="me-2" />
            {busy ? 'Transferring...' : `Transfer ${selectedCount} leads`}
          </button>
        </div>
      </section>
    </div>
  );
}
