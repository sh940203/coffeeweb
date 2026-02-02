import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const storeId = data.get('storeid') || data.get('StoreId') || data.get('CVSStoreID') || '';
        const storeName = data.get('storename') || data.get('StoreName') || data.get('CVSStoreName') || '';
        const storeAddress = data.get('storeaddress') || data.get('StoreAddress') || data.get('CVSAddress') || '';

        // Generate HTML to send data back to parent window
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Store Selection Callback</title>
            </head>
            <body>
                <script>
                    const data = {
                        storeId: '${storeId}',
                        storeName: '${storeName}',
                        storeAddress: '${storeAddress}'
                    };
                    
                    if (window.opener) {
                        window.opener.postMessage(data, window.location.origin);
                        window.close();
                    } else {
                        document.body.innerHTML = '<h3>Selection Complete</h3><p>Store: ${storeName} (${storeId})</p><p>Please close this window and return to checkout.</p>';
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
