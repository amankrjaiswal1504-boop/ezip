// Shared pagination for admin tables: ?page=&limit=&sort=field|-field
function pageParams(req, { defaultSort = '-createdAt', maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const sortField = String(req.query.sort || defaultSort).replace(/[^\w.-]/g, '');
  const sort = sortField.startsWith('-') ? { [sortField.slice(1)]: -1 } : { [sortField]: 1 };
  return { page, limit, skip: (page - 1) * limit, sort };
}

async function paginate(Model, filter, req, { populate = [], select, defaultSort, lean = true } = {}) {
  const { page, limit, skip, sort } = pageParams(req, { defaultSort });
  let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
  populate.forEach((p) => {
    q = q.populate(p);
  });
  if (select) q = q.select(select);
  if (lean) q = q.lean();
  const [rows, total] = await Promise.all([q, Model.countDocuments(filter)]);
  return { rows, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

function toCsv(rows, columns) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    // Neutralise spreadsheet formula injection.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [columns.map((c) => esc(c.label)).join(','), ...rows.map((r) => columns.map((c) => esc(c.value(r))).join(','))].join('\n');
}

module.exports = { pageParams, paginate, toCsv };
