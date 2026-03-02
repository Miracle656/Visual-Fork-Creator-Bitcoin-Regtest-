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
    let t1 = await rpc('getbestblockhash');
    await rpc('invalidateblock', [t1]);
    let t2 = await rpc('getbestblockhash');
    await rpc('invalidateblock', [t2]);
    let t3 = await rpc('getbestblockhash');
    console.log('T3 is', t3);
    
    let status = await rpc('getchaintips');
    console.log('Tips are', JSON.stringify(status, null, 2));

    await rpc('reconsiderblock', [t2]);
    await rpc('reconsiderblock', [t1]);
}
test();
