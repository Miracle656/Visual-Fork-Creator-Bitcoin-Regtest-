const http = require('http');
function rpc(method, params = []) {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: '127.0.0.1', port: 18443, method: 'POST', auth: 'student:boss2026', headers: {'Content-Type': 'application/json'} }, res => {
            let data = ''; res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data).result));
        });
        req.on('error', reject); req.write(JSON.stringify({jsonrpc: '1.0', id: 'curltext', method, params})); req.end();
    });
}
async function test() {
    let t2 = '7360b6c5f1e1df04ba19cac1148705a44033de890369e9aee0538448c6f23483';
    let stale2 = '3beb2a2ac42d4580db26b4b209859dd88a8dfcaca70db55070ac70ab8cb33a6b';
    let b1 = await rpc('getblock', [t2]);
    let b2 = await rpc('getblock', [stale2]);
    console.log('T2 chainwork:', b1.chainwork);
    console.log('Stale2 chainwork:', b2.chainwork);
}
test();
