document.addEventListener('DOMContentLoaded', () => {
    const userEmailDisplay = document.getElementById('user-email-display');
    const resultsDisplay = document.getElementById('qr-reader-results');
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    if (!userEmail) {
        userEmailDisplay.textContent = '参加者情報がありません';
        resultsDisplay.className = 'error';
        resultsDisplay.textContent = 'アプリから再度お試しください。';
        return;
    }
    userEmailDisplay.textContent = `参加者: ${userEmail}`;

    const html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        html5QrCode.stop().then(() => {
            resultsDisplay.textContent = 'サーバーに情報を送信中...';
            resultsDisplay.className = 'info';
            sendDataToServer(userEmail, decodedText);
        }).catch(err => console.error("Failed to stop scanner.", err));
    };

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            resultsDisplay.textContent = 'カメラの起動に失敗しました。';
            resultsDisplay.className = 'error';
        });
});

async function sendDataToServer(email, qrData) {
    const resultsDisplay = document.getElementById('qr-reader-results');
    // ↓↓↓↓↓↓【最重要】Part 3.4でVercelのURLに書き換える↓↓↓↓↓↓
    const serverUrl = 'https://sandoichi-v4-kanbe-sr.vercel.app/api';

    try {
        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: email, scannedQrData: qrData }),
        });
        const data = await response.json();
        if (response.ok) {
            resultsDisplay.textContent = data.message;
            resultsDisplay.className = 'success';
        } else {
            resultsDisplay.textContent = `エラー: ${data.message || '登録に失敗しました'}`;
            resultsDisplay.className = 'error';
        }
    } catch (error) {
        resultsDisplay.textContent = 'サーバー通信エラーです。';
        resultsDisplay.className = 'error';
    // scanner.js の sendDataToServer 関数内 finally ブロック
} finally {
    // Glideアプリに戻るためのURLを取得
    const appUrlParams = new URLSearchParams(window.location.search);
    const glideAppUrl = appUrlParams.get('glide_app_url'); // Glideが渡すURLパラメータ

    // 5秒後にGlideアプリに戻る
    setTimeout(() => {
        if (glideAppUrl) {
            window.location.href = decodeURIComponent(glideAppUrl);
        } else {
            // glide_app_urlがない場合のフォールバック（例: アプリのトップパス）
            // お客様のGlideアプリのベースURLに合わせて調整してください
            window.location.href = 'glide://home'; // または 'https://yourapp.glideapp.io/your_tab_path'
        }
    }, 5000);
}
}
