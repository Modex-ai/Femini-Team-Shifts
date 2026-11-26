// Vercel serverless function — stores the schedule as JSON in Vercel Blob.
// GET  /api/schedule           → { data }            (public, read-only)
// POST /api/schedule           → { ok }              (verify PIN, header x-admin-pin)
// PUT  /api/schedule  {data, baseUpdatedAt} → { ok, updatedAt }   (PIN required)
//
// Env vars:
//   BLOB_READ_WRITE_TOKEN  — added automatically when a Blob store is connected to the project
//   ADMIN_PIN              — the PIN used to edit the schedule
//   BLOB_ACCESS            — optional: 'private' (default) or 'public', must match the store's access type
import { put, list, del, get } from '@vercel/blob';

const PREFIX = 'team-shifts/schedule';
const ACCESS = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
const KEEP_VERSIONS = 15; // older versions are kept as a short history/backup

async function listVersions() {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

async function readLatest() {
  const versions = await listVersions();
  if (!versions.length) return null;
  const r = await get(versions[0].url, { access: ACCESS, useCache: false });
  if (!r) return null;
  return new Response(r.stream).json();
}

function validate(d) {
  if (!d || typeof d !== 'object') return 'data missing';
  if (!Array.isArray(d.members)) return 'members must be an array';
  if (!d.week || typeof d.week !== 'object') return 'week missing';
  if (!d.settings || typeof d.settings !== 'object') return 'settings missing';
  if (JSON.stringify(d).length > 900_000) return 'data too large';
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const data = await readLatest();
      return res.status(200).json({ data });
    }

    if (req.method !== 'POST' && req.method !== 'PUT') {
      res.setHeader('Allow', 'GET, POST, PUT');
      return res.status(405).json({ error: 'method not allowed' });
    }

    if (!process.env.ADMIN_PIN) {
      return res.status(500).json({ error: 'ADMIN_PIN مش متضاف في Environment Variables على Vercel' });
    }
    const pin = String(req.headers['x-admin-pin'] || '');
    if (pin !== String(process.env.ADMIN_PIN)) {
      await sleep(700); // slow down guessing
      return res.status(401).json({ error: 'الـ PIN غلط' });
    }

    if (req.method === 'POST') return res.status(200).json({ ok: true });

    // PUT — save
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const data = body.data;
    const err = validate(data);
    if (err) return res.status(400).json({ error: err });

    const current = await readLatest();
    if (current && current.updatedAt && body.baseUpdatedAt !== current.updatedAt && !body.force) {
      return res.status(409).json({
        error: 'حد تاني عدّل الجدول بعد ما فتحته. اعمل تحديث للصفحة الأول.',
        updatedAt: current.updatedAt,
      });
    }

    data.updatedAt = new Date().toISOString();
    await put(PREFIX + '.json', JSON.stringify(data), {
      access: ACCESS,
      addRandomSuffix: true, // every save gets a unique, never-stale URL
      contentType: 'application/json',
    });

    // trim old versions
    const versions = await listVersions();
    const old = versions.slice(KEEP_VERSIONS).map((b) => b.url);
    if (old.length) await del(old);

    return res.status(200).json({ ok: true, updatedAt: data.updatedAt });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
