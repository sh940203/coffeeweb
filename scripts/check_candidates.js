const https = require('https');

const candidates = [
    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800&auto=format&fit=crop'
];

console.log("Checking candidates...");

candidates.forEach((url, index) => {
    https.get(url, (res) => {
        console.log(`[${index + 1}] Status: ${res.statusCode} -> ${url.substring(0, 40)}...`);
    }).on('error', (e) => {
        console.error(`[${index + 1}] Error: ${e.message}`);
    });
});
