export default async function handler(req, res) {
  // CORS設定 (GitHub Pagesのベースドメインに合わせて修正)
  // リクエスト元のOrigin 'https://y2ueno.github.io' に完全に一致させる必要があります。
  res.setHeader('Access-Control-Allow-Origin', 'https://y2ueno.github.io'); // ★ここを修正しました★
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // OPTIONSリクエスト（CORSプリフライトリクエスト）には200 OKを返し、ヘッダーのみで許可を示す
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    // POST以外のリクエストは許可しない
    return res.status(405).json({ message: 'Method Not Allowed.' });
  }

  try {
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      // 環境変数 APPS_SCRIPT_URL が設定されていない場合のエラー
      console.error('Error: APPS_SCRIPT_URL is not configured in Vercel environment variables.');
      throw new Error('APPS_SCRIPT_URL is not configured.');
    }

    // Google Apps ScriptのWebアプリURLへPOSTリクエストを転送
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body), // GitHub Pagesから受け取ったリクエストボディをそのままGASへ転送
    });

    // GASからのレスポンスをJSONとして解析
    const data = await response.json();

    // GASからの応答ステータスに基づいてVercelのレスポンスを決定
    if (data.status === 'success') {
      // GASが成功を返した場合
      res.status(200).json({ message: data.message });
    } else {
      // GASがエラーを返した場合
      res.status(400).json({ message: data.message || 'Unknown error from Apps Script.' });
    }
  } catch (error) {
    // 予期せぬサーバーエラー（ネットワーク問題、GASからの不正なJSONなど）
    console.error('Vercel API route error:', error.message);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
}
