import { NextResponse } from 'next/server';
import { rpcClient } from '@/lib/bitcoin-rpc';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { parentHash } = body;
        const targetAddress = "bcrt1pqqqqrldkrl";

        // Mining logic
        if (parentHash) {
            const invalidatedHashes: string[] = [];
            const MAX_ITERATIONS = 50;

            for (let i = 0; i < MAX_ITERATIONS; i++) {
                const currentTip = await rpcClient.command('getbestblockhash');

                if (currentTip === parentHash) {
                    break;
                }

                // If current tip is not our target, temporarily invalidate it
                await rpcClient.command('invalidateblock', currentTip);
                invalidatedHashes.push(currentTip);

                // Safety check: if invalidating didn't change the tip (e.g. Genesis block), break
                const nextTip = await rpcClient.command('getbestblockhash');
                if (nextTip === currentTip) {
                    break;
                }
            }

            // At this point, the node considers `parentHash` the active tip! Mine the block.
            const result = await rpcClient.command('generatetoaddress', 1, targetAddress);

            // Reconsider all the blocks we invalidated in reverse order to restore the chain landscape
            for (const hash of invalidatedHashes.reverse()) {
                await rpcClient.command('reconsiderblock', hash);
            }

            return NextResponse.json({ success: true, data: { newBlockHashes: result } });
        }

        // Default: If no parentHash provided, or parentHash IS the best block, just mine normally
        const result = await rpcClient.command('generatetoaddress', 1, targetAddress);

        return NextResponse.json({
            success: true,
            data: {
                newBlockHashes: result
            }
        });

    } catch (error: any) {
        console.error("RPC Mine Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to mine block" },
            { status: 500 }
        );
    }
}
