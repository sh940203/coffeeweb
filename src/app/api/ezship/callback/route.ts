import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const stCode = data.get('stCode') || '';
        const stName = data.get('stName') || '';
        const stAddr = data.get('stAddr') || '';
        const stCate = data.get('stCate') || ''; // Might be useful to identify chain

        // Construct standardized store info
        const storeInfo = {
            storeId: stCode.toString(),
            storeName: stName.toString(),
            storeAddress: stAddr.toString(),
            storeType: stCate.toString()
        };

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ezship Callback</title>
            </head>
            <body>
                <script>
                    const data = ${JSON.stringify(storeInfo)};
                    
                    if (window.opener) {
                        try {
                            window.opener.postMessage({...data, source: 'ezship'}, window.location.origin);
                            window.close();
                        } catch (e) {
                            console.error('PostMessage failed', e);
                            document.body.innerHTML = '<p>Error sending data back. Please copy manually: ' + data.storeName + ' (' + data.storeId + ')</p>';
                        }
                    } else {
                        document.body.innerHTML = '<h3>Selection Complete</h3><p>Store: ' + data.storeName + ' (' + data.storeId + ')</p><p>Please close this window and return to checkout.</p>';
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
        console.error('Ezship Callback Error:', error);
        return new Response('Error processing callback', { status: 500 });
    }
}
