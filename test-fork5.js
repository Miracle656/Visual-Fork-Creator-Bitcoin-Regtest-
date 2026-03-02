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
    let t1 = await rpc('getbestblockhash');
    await rpc('invalidateblock', [t1]);
    let t2 = await rpc('getbestblockhash');
    await rpc('invalidateblock', [t2]);
    let t3 = await rpc('getbestblockhash');
    console.log('T3 is', t3);
    
    // t3 is height 1. Now we want to switch to the stale height 2.
    // The previous getchaintips output had the stale height 2 hash:
    let tips = await rpc('getchaintips');
    let staleTip = tips.find(t => t.status === 'valid-fork');
    console.log('Found stale tip:', staleTip.hash);
    
    await rpc('reconsiderblock', [staleTip.hash]);
    let t4 = await rpc('getbestblockhash');
    console.log('T4 after reconsidering stale tip:', t4);
    
    // Clean up
    await rpc('reconsiderblock', [t2]);
    await rpc('reconsiderblock', [t1]);
}
test();
