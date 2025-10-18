document.addEventListener('DOMContentLoaded', () => {
    const userEmailDisplay = document.getElementById('user-email-display');
    const resultsDisplay = document.getElementById('qr-reader-results');
    const urlParams = new URLSearchParams(window.location.search);

    // Glideが渡すメールアドレスを取得 ('email'ではなく'glide_user_email'である可能性も考慮)
    const userEmail = urlParams.get('email') || urlParams.get('glide_user_email');
    
    // Glideアプリに戻るためのURLを取得
    const glideAppUrl = urlParams.get('glide_app_url');

    if (!userEmail) {
        userEmailDisplay.textContent = '参加者情報がありません';
        resultsDisplay.className = 'error';
        resultsDisplay.textContent = 'アプリから再度お試しください。';
        // 5秒後にGlideアプリに戻る
        setTimeout(() => {
            if (glideAppUrl) {
                window.location.href = decodeURIComponent(glideAppUrl);
            } else {
                // フォールバック（例えばGlideアプリのトップパスなど）
                window.location.href = 'glide://home'; // お客様のGlideアプリのベースURLに合わせて調整
            }
        }, 5000);
        return;
    }
    userEmailDisplay.textContent = `参加者: ${userEmail}`;

    const html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        html5QrCode.stop().then(() => {
            resultsDisplay.textContent = 'サーバーに情報を送信中...';
            resultsDisplay.className = 'info';
            sendDataToServer(userEmail, decodedText, glideAppUrl); // glideAppUrlも渡す
        }).catch(err => {
            console.error("Failed to stop scanner.", err);
            resultsDisplay.textContent = 'スキャナー停止中にエラーが発生しました。';
            resultsDisplay.className = 'error';
            // エラー時でも、一応アプリに戻る
            setTimeout(() => {
                if (glideAppUrl) {
                    window.location.href = decodeURIComponent(glideAppUrl);
                } else {
                    window.location.href = 'glide://home';
                }
            }, 5000);
        });
    };

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            console.error("Camera start failed.", err); // カメラ起動失敗時の詳細ログ
            resultsDisplay.textContent = 'カメラの起動に失敗しました。';
            resultsDisplay.className = 'error';
            // カメラ起動失敗時でも、一応アプリに戻る
            setTimeout(() => {
                if (glideAppUrl) {
                    window.location.href = decodeURIComponent(glideAppUrl);
                } else {
                    window.location.href = 'glide://home';
                }
            }, 5000);
        });
});

async function sendDataToServer(email, qrData, glideAppUrl) { // glideAppUrlを受け取る
    const resultsDisplay = document.getElementById('qr-reader-results');
    // ↓↓↓↓↓↓【最重要】VercelのAPIエンドポイントのURLを正確に設定 ↓↓↓↓↓↓
    const serverUrl = 'https://sandoichi-v4-kanbe-sr.vercel.app/api'; 

    // ★★★ デバッグログを追加 ★★★
    console.log('--- sendDataToServer started ---');
    console.log('User Email:', email);
    console.log('Scanned QR Data:', qrData);
    console.log('Target Vercel API URL:', serverUrl);
    console.log('Glide App Return URL:', glideAppUrl ? decodeURIComponent(glideAppUrl) : 'Not provided');
    console.log('--- Preparing fetch request ---');

    try {
        const requestBody = JSON.stringify({ userEmail: email, scannedQrData: qrData });
        console.log('Request Method: POST');
        console.log('Request Headers: Content-Type: application/json');
        console.log('Request Body:', requestBody);

        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
        });

        console.log('--- Fetch response received ---');
        console.log('Response Status:', response.status); // HTTPステータスコード
        console.log('Response OK (200-299):', response.ok); // HTTPステータスが2xxか

        const data = await response.json(); // レスポンスボディをJSONとして解析
        console.log('Response Data (parsed JSON):', data); // VercelからのJSONレスポンス

        if (response.ok && data.status === 'success') { // HTTPステータスが2xxかつGASからのstatusが'success'
            resultsDisplay.textContent = data.message;
            resultsDisplay.className = 'success';
            console.log('Stamp processing successful.');
        } else {
            const errorMessage = data.message || `HTTPエラー: ${response.status} ${response.statusText}`;
            resultsDisplay.textContent = `エラー: ${errorMessage}`;
            resultsDisplay.className = 'error';
            console.error('Stamp processing failed. Error from Vercel/GAS:', errorMessage);
        }
    } catch (error) {
        // ネットワークエラー、JSONパースエラーなど
        console.error('--- Fetch (network/JSON parse) error caught ---');
        console.error('Error details:', error);
        resultsDisplay.textContent = 'サーバー通信エラーです。ネットワークまたはデータ処理に問題。';
        resultsDisplay.className = 'error';
    } finally {
        // 処理完了後、またはエラー発生後、一定時間後にGlideアプリに戻る
        console.log('--- sendDataToServer finished. Returning to Glide app in 5 seconds... ---');
        setTimeout(() => {
            if (glideAppUrl) {
                window.location.href = decodeURIComponent(glideAppUrl);
            } else {
                window.location.href = 'glide://home'; // お客様のGlideアプリのベースURLに合わせて調整
            }
        }, 5000); // 5秒後に戻る
    }
}
