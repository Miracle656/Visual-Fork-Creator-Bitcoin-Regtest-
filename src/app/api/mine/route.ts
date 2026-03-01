import { NextResponse } from 'next/server';
import { rpcClient } from '@/lib/bitcoin-rpc';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { parentHash } = body;
        const targetAddress = "bcrt1pqqqqrldkrl";

        if (parentHash) {
            // First, proactively reconsider the target block to ensure it's not marked invalid.
            // If it was manually invalidated, the node will never swap to it, causing our loop to hit Genesis.
            await rpcClient.command('reconsiderblock', parentHash);

            const currentTipHash = await rpcClient.command('getbestblockhash');

            if (parentHash !== currentTipHash) {
                const invalidatedHashes: string[] = [];

                // We must invalidate the active tip repeatedly until our target hash BECOMES the active tip
                for (let i = 0; i < 500; i++) { // generous depth safety
                    const latestBestHash = await rpcClient.command('getbestblockhash');

                    if (latestBestHash === parentHash) {
                        break;
                    }

                    // Invalidate the competing active chain
                    await rpcClient.command('invalidateblock', latestBestHash);
                    invalidatedHashes.push(latestBestHash);

                    // Safety check: if invalidating didn't actually change the tip (e.g. Genesis block)
                    const nextBestHash = await rpcClient.command('getbestblockhash');
                    if (nextBestHash === latestBestHash) {
                        break;
                    }
                }

                // Now the node considers `parentHash` the active tip! We can native-mine on it.
                const result = await rpcClient.command('generatetoaddress', 1, targetAddress);

                // Reconsider all the blocks we just invalidated (in reverse order) to restore the landscape
                for (const hash of invalidatedHashes.reverse()) {
                    await rpcClient.command('reconsiderblock', hash);
                }

                return NextResponse.json({ success: true, data: { newBlockHashes: result } });
            }
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
