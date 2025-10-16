export default async function handler(req, res) {
  // CORS設定 (あなたのGitHub Pagesのドメインに合わせてください)
  res.setHeader('Access-Control-Allow-Origin', 'https://y2ueno.github.io/sandoichi_v4_kanbe_SR/');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ message: 'Method Not Allowed.' }); }

  try {
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) { throw new Error('APPS_SCRIPT_URL is not configured.'); }

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();

    if (data.status === 'success') {
      res.status(200).json({ message: data.message });
    } else {
      res.status(400).json({ message: data.message || 'Unknown error from Apps Script.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error.' });
  }
}
