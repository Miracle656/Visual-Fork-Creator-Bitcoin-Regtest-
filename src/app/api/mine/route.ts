import { NextResponse } from 'next/server';
import { rpcClient } from '@/lib/bitcoin-rpc';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { parentHash } = body;
        const targetAddress = "bcrt1pqqqqrldkrl";

        if (parentHash) {
            const currentTipHash = await rpcClient.command('getbestblockhash');

            if (parentHash !== currentTipHash) {
                // To mine on a stale fork, we must physically roll back the ACTIVE chain to the
                // exact block where the stale fork diverged from it (the Lowest Common Ancestor).

                // 1. Get info about the target block we want to mine on
                const targetBlock = await rpcClient.command('getblock', parentHash);
                const targetHeight = targetBlock.height;

                // 2. Walk the active tip backwards until we reach the same height as the target
                const invalidatedHashes: string[] = [];
                let activeCursorHash = currentTipHash;

                for (let i = 0; i < 100; i++) { // Max rollback depth safety
                    const activeCursorBlock = await rpcClient.command('getblock', activeCursorHash);

                    if (activeCursorBlock.height <= targetHeight) {
                        break; // Reached the horizontal level of the fork
                    }

                    // Invalidate the active tip to step backwards one block
                    await rpcClient.command('invalidateblock', activeCursorHash);
                    invalidatedHashes.push(activeCursorHash);

                    // Update cursor to the new best block (the parent of what we just invalidated)
                    activeCursorHash = await rpcClient.command('getbestblockhash');
                }

                // 3. If they still aren't the same block, they are on parallel horizontal branches.
                // We must keep walking BOTH backwards until they meet at the LCA.
                let targetCursorHash = parentHash;

                for (let i = 0; i < 100; i++) {
                    if (!activeCursorHash || !targetCursorHash) break; // Defensive check for Genesis

                    if (activeCursorHash === targetCursorHash) {
                        break; // Found the Lowest Common Ancestor!
                    }

                    // Invalidate the active branch down one more step
                    await rpcClient.command('invalidateblock', activeCursorHash);
                    invalidatedHashes.push(activeCursorHash);

                    activeCursorHash = await rpcClient.command('getbestblockhash');

                    // Step the target branch down one step as well to compare
                    const targetBlockCursor = await rpcClient.command('getblock', targetCursorHash);
                    targetCursorHash = targetBlockCursor.previousblockhash;
                }

                // Now the node's active tip is the Lowest Common Ancestor.
                // However, we want to mine ON the `parentHash`, which is down the stale branch.
                // Bitcoin Core will NOT let us mine on it via RPC unless it's the active tip!
                // To force this, we must temporarily call `reconsiderblock` on everything from the LCA
                // down the stale branch to the `parentHash` to make the Stale branch the "Active" one.
                // But wait! `generatetoaddress` actually CAN mine on stale tips IF you pass the hash!
                // Let's drop down to using the underlying `submitblock` via a custom raw hex block? NO.
                // Actually, if we just invalidate the competing active chain, Bitcoin Core naturally
                // falls back and accepts the stale branch as the new active chain automatically!

                // At this exact moment, the active tip is `parentHash` (because we invalidated everything competing with it)
                const result = await rpcClient.command('generatetoaddress', 1, targetAddress);

                // Reconsider all the blocks we just invalidated (in reverse order) to bring the competing main chain back online
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
