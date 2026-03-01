export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { rpcClient } from '@/lib/bitcoin-rpc';

export async function GET() {
    try {
        // 1. Get the current active chain tips
        const tips = await rpcClient.command('getchaintips');

        const blocks: any[] = [];
        const visitedHashes = new Set<string>();
        const queue: string[] = [];

        // Initialize queue with all tip hashes
        for (const tip of tips) {
            queue.push(tip.hash);
        }

        // Limit to prevent infinite loop or memory issues if chain is huge
        const MAX_BLOCKS = 50;

        let activeChainHeight = 0;

        while (queue.length > 0 && blocks.length < MAX_BLOCKS) {
            const hash = queue.shift()!;
            if (visitedHashes.has(hash)) continue;
            visitedHashes.add(hash);

            try {
                const header = await rpcClient.command('getblockheader', hash);

                // Check if this block belongs to the active chain.
                // If the hash returned by getblockhash for this height matches, it's the active chain.
                let isMainChain = false;
                try {
                    const hashAtHeight = await rpcClient.command('getblockhash', header.height);
                    isMainChain = hashAtHeight === hash;
                    if (isMainChain && header.height > activeChainHeight) {
                        activeChainHeight = header.height;
                    }
                } catch (e) { /* ignore */ }

                blocks.push({
                    hash: header.hash,
                    height: header.height,
                    previousblockhash: header.previousblockhash,
                    isMainChain: isMainChain
                });

                if (header.previousblockhash) {
                    queue.push(header.previousblockhash);
                }
            } catch (e) {
                console.warn(`Could not fetch header for ${hash}`);
            }
        }

        // Figure out which blocks are strictly part of invalidated branches.
        // A block is valid if it is an ancestor of ANY tip that has a status other than 'invalid'.
        const validHashes = new Set<string>();
        tips.filter((t: any) => t.status !== 'invalid').forEach((t: any) => validHashes.add(t.hash));

        let changed = true;
        while (changed) {
            changed = false;
            for (const b of blocks) {
                if (validHashes.has(b.hash) && b.previousblockhash && !validHashes.has(b.previousblockhash)) {
                    validHashes.add(b.previousblockhash);
                    changed = true;
                }
            }
        }

        blocks.forEach(b => {
            b.isInvalid = !validHashes.has(b.hash);
        });

        return NextResponse.json({
            success: true,
            data: {
                blocks,
                chainInfo: {
                    activeHeaders: activeChainHeight + 1, // +1 for genesis
                    blockHeight: activeChainHeight,
                    staleBranches: tips.length - 1 // 1 is main, rest are stale
                }
            }
        });

    } catch (error: any) {
        console.error("RPC Error:", error.message);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch chain data" },
            { status: 500 }
        );
    }
}
