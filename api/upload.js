// Issues short-lived client tokens so the browser can upload photos/videos
// straight to Vercel Blob (no 4.5 MB function body limit). PIN required.
import { handleUpload } from '@vercel/blob/client';

const PREFIX = 'team-shifts/attachments/';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let pin = '';
        try { pin = JSON.parse(clientPayload || '{}').pin || ''; } catch {}
        if (!process.env.ADMIN_PIN || String(pin) !== String(process.env.ADMIN_PIN)) throw new Error('Wrong PIN');
        if (!pathname.startsWith(PREFIX)) throw new Error('Invalid upload path');
        return {
          allowedContentTypes: ['image/*', 'video/*'],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}
