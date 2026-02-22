const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 4040,
    path: '/api/tunnels',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const tunnel = parsed.tunnels.find(t => t.proto === 'https');
            if (tunnel) {
                console.log(`✅ Ngrok is RUNNING!`);
                console.log(`🔗 Public URL: ${tunnel.public_url}`);
                console.log(`👉 Target URL for GitHub: ${tunnel.public_url}/api/webhook`);
            } else {
                console.log("⚠️ Ngrok is running, but no HTTPS tunnel found.");
                console.log(JSON.stringify(parsed, null, 2));
            }
        } catch (e) {
            console.error("❌ Error parsing Ngrok response:", e);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Ngrok is NOT running (or not on port 4040).`);
    console.error(`   Error: ${e.message}`);
    console.error(`\n   ACTION: Please run 'npm run webhook' in a separate terminal!`);
});

req.end();
