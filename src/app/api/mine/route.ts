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
                // 1. Get the target block's complete ancestry
                const targetAncestors = new Set<string>();
                let currHash = parentHash;
                while (currHash) {
                    targetAncestors.add(currHash);
                    const block = await rpcClient.command('getblock', currHash).catch(() => null);
                    if (!block || block.height === 0) break; // Genesis reached or error
                    currHash = block.previousblockhash;
                }

                // 2. Proactively reconsider the target branch to ensure it's valid
                const ancestorsArray = Array.from(targetAncestors).reverse();
                for (const hash of ancestorsArray) {
                    await rpcClient.command('reconsiderblock', hash).catch(() => null);
                }

                const invalidatedHashes: string[] = [];

                // 3. Keep invalidating the active tip until Bitcoin Core naturally prioritizes our target
                for (let i = 0; i < 500; i++) { // generous depth safety
                    const latestBestHash = await rpcClient.command('getbestblockhash');

                    if (latestBestHash === parentHash) {
                        break; // WE DID IT! The target is now the active tip.
                    }

                    if (targetAncestors.has(latestBestHash)) {
                        // FATAL SAFETY CATCH: The node fell back to an ancestor!
                        // This means we have invalidated all other branches, and Bitcoin Core selected 
                        // a shared ancestor rather than the target tip (e.g. because target actually has LESS work).
                        // If we invalidate this ancestor, we irreversibly destroy the target chain too!
                        // We must immediately break the loop to protect the root of the tree.
                        console.warn("Safety Stop: Node fell back to ancestor without reaching target:", latestBestHash);
                        break;
                    }

                    // Invalidate the competing active chain tip
                    await rpcClient.command('invalidateblock', latestBestHash);
                    invalidatedHashes.push(latestBestHash);
                }

                // Now the node considers `parentHash` (or its safest ancestor) the active tip! We can native-mine on it.
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
