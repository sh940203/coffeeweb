const https = require('https');

const urls = [
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559525839-b184a4d6d5dd?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521302213-9bdf01a88b52?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1587393433363-d14c33d8396e?q=80&w=800&auto=format&fit=crop'
];

console.log("Checking URLs...");

urls.forEach((url, index) => {
    https.get(url, (res) => {
        console.log(`[${index + 1}] Status: ${res.statusCode} -> ${url.substring(0, 40)}...`);
    }).on('error', (e) => {
        console.error(`[${index + 1}] Error: ${e.message}`);
    });
});
