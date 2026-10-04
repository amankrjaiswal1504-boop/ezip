import { useEffect, useState } from 'react';
import { ChevronDown, FileClock, X } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, Field, PageHeader, Pagination, Select, SkeletonRows, cx } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';
import { FilterBar } from './_ops/shared';

const AREAS = ['price', 'pickup', 'user', 'collector', 'staff', 'coupon', 'settings', 'withdrawal', 'review', 'blocklist', 'area', 'item', 'category'];
const AREA_TONE = { price: 'amber', pickup: 'blue', user: 'steel', collector: 'patina', staff: 'rust', settings: 'rust', withdrawal: 'amber', blocklist: 'danger', coupon: 'patina' };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const show = (v) => {
  if (v === undefined) return '—';
  if (v === null) return 'null';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

// Flat list of changed keys between two audit snapshots.
function diff(before, after) {
  if (!isObj(before) && !isObj(after)) {
    return JSON.stringify(before) === JSON.stringify(after) ? { rows: [], unchanged: 1 } : { rows: [{ key: 'value', before, after }], unchanged: 0 };
  }
  const b = isObj(before) ? before : {};
  const a = isObj(after) ? after : {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => !['_id', '__v', 'updatedAt', 'createdAt'].includes(k));
  const rows = [];
  let unchanged = 0;
  keys.forEach((k) => {
    // Edits only send the changed fields; a key missing from `after` was untouched.
    if (isObj(before) && isObj(after) && !(k in a)) return;
    if (JSON.stringify(b[k]) === JSON.stringify(a[k])) unchanged += 1;
    else rows.push({ key: k, before: isObj(before) ? b[k] : undefined, after: isObj(after) ? a[k] : undefined });
  });
  return { rows, unchanged };
}

function Diff({ entry }) {
  const hasBefore = entry.before !== undefined && entry.before !== null;
  const hasAfter = entry.after !== undefined && entry.after !== null;
  if (!hasBefore && !hasAfter) return <p className="text-sm text-steel-500">No change details were recorded for this action.</p>;
  const { rows, unchanged } = diff(entry.before, entry.after);
  return (
    <div>
      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border border-steel-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-steel-500 bg-surface-2">
                <th className="px-3 py-2 font-medium">Field</th>
                <th className="px-3 py-2 font-medium">Before</th>
                <th className="px-3 py-2 font-medium">After</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-steel-100 align-top">
                  <td className="px-3 py-2 font-medium text-steel-900 whitespace-nowrap">{r.key}</td>
                  <td className="px-3 py-2 font-mono text-danger-700 break-all min-w-[120px]">{show(r.before)}</td>
                  <td className="px-3 py-2 font-mono text-patina-700 break-all min-w-[120px]">{show(r.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-steel-500">No field values changed.</p>
      )}
      {unchanged > 0 && <p className="text-xs text-steel-500 mt-2">{unchanged} unchanged field{unchanged === 1 ? '' : 's'} hidden.</p>}
      <details className="mt-2">
        <summary className="text-xs text-steel-500 hover:text-steel-900 cursor-pointer">Raw JSON</summary>
        <pre className="mt-2 text-xs bg-steel-50 text-steel-700 rounded-lg p-3 overflow-x-auto">{JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}</pre>
      </details>
    </div>
  );
}

function EntryRow({ e, open, onToggle, onActor }) {
  const area = e.action.split('.')[0];
  const panelId = `audit-${e._id}`;
  return (
    <li className="border-b border-steel-100 last:border-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[150px_1fr_auto] gap-x-4 gap-y-1 text-left items-center"
        >
          <span className="text-xs text-steel-500 tabular">{fmtDateTime(e.createdAt)}</span>
          <span className="min-w-0 flex flex-wrap items-center gap-2">
            <Badge tone={AREA_TONE[area] || 'steel'}>{e.action}</Badge>
            {e.entity && (
              <span className="text-xs text-steel-500 truncate">
                {e.entity}
                {e.entityId && <span className="font-mono text-steel-700"> {e.entityId}</span>}
              </span>
            )}
          </span>
          <span className="hidden sm:flex items-center gap-2">
            <ChevronDown className={cx('w-4 h-4 text-steel-400 transition-transform', open && 'rotate-180')} aria-hidden />
          </span>
        </button>
        <button
          type="button"
          onClick={onActor}
          className="flex items-center gap-2 text-sm text-steel-700 hover:text-steel-900 shrink-0"
          aria-label={e.actor ? `Show only actions by ${e.actorName || 'this person'}` : e.actorName || 'System'}
          title={e.actor ? `Show only ${e.actorName || 'this person'}'s actions` : undefined}
          disabled={!e.actor}
        >
          <Avatar name={e.actorName || 'System'} size="sm" />
          <span className="hidden md:inline max-w-[140px] truncate">{e.actorName || 'System'}</span>
        </button>
      </div>
      {open && (
        <div id={panelId} className="px-4 pb-4 sm:pl-[182px]">
          <Diff entry={e} />
          {e.ip && <p className="text-xs text-steel-400 mt-2">IP {e.ip}</p>}
        </div>
      )}
    </li>
  );
}

export default function AdminAuditLog() {
  const [action, setAction] = useState('');
  const [actor, setActor] = useState(null); // { id, name }
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(() => new Set());

  const params = { page, limit: 30, ...(action ? { action } : {}), ...(actor ? { actor: actor.id } : {}) };
  const { data, error, loading, reload } = useApi('/admin/audit-log', { params });
  useEffect(() => setPage(1), [action, actor]);

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <PageHeader title="Audit log" subtitle="Every sensitive change: who did it, when, and what changed" />

      <FilterBar>
        <Field label="Area" className="w-full sm:w-52">
          {(id) => (
            <Select id={id} value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">All actions</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {cap(a)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {actor && (
          <div className="h-10 flex items-center">
            <Badge tone="rust" className="!text-sm !py-1">
              Actor: {actor.name}
              <button type="button" onClick={() => setActor(null)} aria-label="Clear actor filter" className="hover:text-rust-800">
                <X className="w-3.5 h-3.5" aria-hidden />
              </button>
            </Badge>
          </div>
        )}
        <p className="text-xs text-steel-500 self-center sm:ml-auto">Tip: select a person's avatar to see only their actions.</p>
      </FilterBar>

      {error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <SkeletonRows rows={8} />
      ) : !data.entries.length ? (
        <EmptyState
          icon={FileClock}
          title="No matching entries"
          description={action || actor ? 'Try another area or clear the filters.' : 'Changes to prices, pickups, users and settings will be logged here.'}
          action={
            action || actor ? (
              <Button
                variant="outline"
                onClick={() => {
                  setAction('');
                  setActor(null);
                }}
              >
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <Card padded={false} className={cx('transition-opacity', loading && 'opacity-60')}>
            <ul>
              {data.entries.map((e) => (
                <EntryRow key={e._id} e={e} open={open.has(e._id)} onToggle={() => toggle(e._id)} onActor={() => e.actor && setActor({ id: e.actor, name: e.actorName || 'Unknown' })} />
              ))}
            </ul>
          </Card>
          <Pagination pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
