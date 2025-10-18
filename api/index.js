export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', 'https://y2ueno.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed.' });
  }

  try {
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      console.error('Error: APPS_SCRIPT_URL is not configured in Vercel environment variables.');
      throw new Error('APPS_SCRIPT_URL is not configured.');
    }

    // Google Apps ScriptのWebアプリURLへPOSTリクエストを転送
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    // GASからのレスポンスをJSONとして解析
    const data = await response.json();

    // ★★★ 修正点 ★★★
    // GASからの応答ステータスに基づいてVercelのレスポンスを決定
    // GASから受け取ったJSON(data)を、そのままクライアントに転送します。
    if (data.status === 'success') {
      // GASが成功を返した場合
      res.status(200).json(data); // { status: "success", message: "..." } がそのまま返される
    } else {
      // GASがエラーを返した場合
      res.status(400).json(data); // { status: "error", message: "..." } がそのまま返される
    }

  } catch (error) {
    console.error('Vercel API route error:', error.message);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
}
