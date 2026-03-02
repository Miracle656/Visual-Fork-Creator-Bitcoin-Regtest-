const http = require('http');
async function rpc(method, params = []) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1', port: 18443, method: 'POST', auth: 'student:boss2026', headers: {'Content-Type': 'application/json'}
        }, res => {
            let data = ''; res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data).result));
        });
        req.on('error', reject);
        req.write(JSON.stringify({jsonrpc: '1.0', id: 'curltext', method, params}));
        req.end();
    });
}
async function test() {
    let tips = await rpc('getchaintips');
    console.log(JSON.stringify(tips, null, 2));
}
test();
