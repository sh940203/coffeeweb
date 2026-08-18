import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const storeInfo = {
            storeId: (data.get('storeid') || data.get('StoreId') || data.get('CVSStoreID') || '').toString(),
            storeName: (data.get('storename') || data.get('StoreName') || data.get('CVSStoreName') || '').toString(),
            storeAddress: (data.get('storeaddress') || data.get('StoreAddress') || data.get('CVSAddress') || '').toString(),
            source: 'cvs',
        };

        // 安全序列化：以 JSON 注入並轉義 "<" 防止 </script> 跳脫造成 XSS
        const safeData = JSON.stringify(storeInfo).replace(/</g, '\\u003c');

        // Generate HTML to send data back to parent window
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Store Selection Callback</title>
            </head>
            <body>
                <script>
                    const data = ${safeData};
                    if (window.opener) {
                        window.opener.postMessage(data, window.location.origin);
                        window.close();
                    } else {
                        const p = document.createElement('p');
                        p.textContent = 'Store: ' + data.storeName + ' (' + data.storeId + '). Please close this window and return to checkout.';
                        document.body.appendChild(p);
                    }
                </script>
                <div style="text-align:center; padding: 20px;">
                    <h3>Processing Selection...</h3>
                    <p>Redirecting back to checkout.</p>
                </div>
            </body>
            </html>
        `;

        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });

    } catch (error) {
        console.error('CVS Callback Error:', error);
        return new Response('Error processing callback', { status: 500 });
    }
}

// Handle GET just in case (e.g. user manually visits)
export async function GET(request: NextRequest) {
    return new Response('Method not allowed. Use POST from map service.', { status: 405 });
}
