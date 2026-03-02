import { useState, useCallback } from 'react';

export interface SandboxBlock {
    hash: string;
    height: number;
    previousblockhash: string | null;
    isMainChain: boolean;
    isInvalid: boolean;
}

const generateHash = () => Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10) + 'sandbox';

export function useSandboxEngine() {
    const [blocks, setBlocks] = useState<SandboxBlock[]>([
        {
            hash: 'genesis-0000',
            height: 0,
            previousblockhash: null,
            isMainChain: true,
            isInvalid: false
        }
    ]);

    const calculateActiveChain = useCallback((currentBlocks: SandboxBlock[]) => {
        // 1. Find all valid nodes (nodes that are not invalid and all their ancestors are not invalid)
        // Wait, if a node is marked invalid, it and all descendants are invalid.
        const invalidHashes = new Set(currentBlocks.filter(b => b.isInvalid).map(b => b.hash));
        let changed = true;
        while (changed) {
            changed = false;
            for (const b of currentBlocks) {
                if (b.previousblockhash && invalidHashes.has(b.previousblockhash) && !invalidHashes.has(b.hash)) {
                    invalidHashes.add(b.hash);
                    changed = true;
                }
            }
        }

        // Apply true invalid state
        const blocksWithActualInvalidState = currentBlocks.map(b => ({
            ...b,
            isInvalid: invalidHashes.has(b.hash)
        }));

        // 2. Find the longest valid chain leaf
        let maxWorkLeaf: SandboxBlock | null = null;
        let maxHeight = -1;

        for (const b of blocksWithActualInvalidState) {
            if (!b.isInvalid && b.height > maxHeight) {
                maxHeight = b.height;
                maxWorkLeaf = b;
            }
        }

        // 3. Backtrack from the max work leaf to find the active chain
        const activeChainHashes = new Set<string>();
        let curr = maxWorkLeaf;
        while (curr) {
            activeChainHashes.add(curr.hash);
            curr = blocksWithActualInvalidState.find(b => b.hash === curr!.previousblockhash) || null;
        }

        // 4. Update the isMainChain property
        return blocksWithActualInvalidState.map(b => ({
            ...b,
            isMainChain: activeChainHashes.has(b.hash)
        }));
    }, []);

    const fetchBlocks = useCallback(async () => {
        const activeBlocks = blocks.filter(b => b.isMainChain);
        const maxHeight = activeBlocks.length > 0 ? Math.max(...activeBlocks.map(b => b.height)) : 0;

        // Find tips (blocks that are not someone's previousblockhash)
        const parentHashes = new Set(blocks.map(b => b.previousblockhash).filter(Boolean));
        const tips = blocks.filter(b => !parentHashes.has(b.hash));

        // Stale branches are the number of valid tips minus the main tip
        const validTips = tips.filter(b => !b.isInvalid);
        const staleBranches = Math.max(0, validTips.length - 1);

        return {
            success: true,
            data: {
                blocks,
                chainInfo: {
                    activeHeaders: maxHeight + 1,
                    blockHeight: maxHeight,
                    staleBranches: staleBranches
                }
            }
        };
    }, [blocks]);

    const mineBlock = useCallback(async (parentHash?: string) => {
        setBlocks(prev => {
            // Find parent
            let parent: SandboxBlock | undefined;
            if (parentHash) {
                parent = prev.find(b => b.hash === parentHash);
            } else {
                parent = [...prev].reverse().find(b => b.isMainChain);
            }

            if (!parent) return prev; // Cannot mine if parent doesn't exist

            const newBlock: SandboxBlock = {
                hash: generateHash(),
                height: parent.height + 1,
                previousblockhash: parent.hash,
                isMainChain: false, // Will calculate this next
                isInvalid: false
            };

            const newBlocksSnapshot = [...prev, newBlock];
            return calculateActiveChain(newBlocksSnapshot);
        });

        // Simulate network delay
        await new Promise(r => setTimeout(r, 150));

        // Let's pretend we just mined it and need to return the new hash right away
        // However, state update is async, we can just return a generated hash by predicting it
        // Or we just return success: true. The actual hash isn't strictly needed except for force reorg loops
        // where it needs the new blockhash immediately. So we should generate it here.
        const newBlockHash = generateHash();

        setBlocks(prev => {
            let parent: SandboxBlock | undefined;
            if (parentHash) {
                parent = prev.find(b => b.hash === parentHash);
            } else {
                parent = [...prev].reverse().find(b => b.isMainChain);
            }
            if (!parent) return prev;

            const newBlock: SandboxBlock = {
                hash: newBlockHash,
                height: parent.height + 1,
                previousblockhash: parent.hash,
                isMainChain: false,
                isInvalid: false
            };
            return calculateActiveChain([...prev, newBlock]);
        });

        return {
            success: true,
            data: {
                newBlockHashes: [newBlockHash]
            }
        };
    }, [calculateActiveChain]);

    const invalidateBlock = useCallback(async (hash: string) => {
        setBlocks(prev => {
            const target = prev.find(b => b.hash === hash);
            if (!target || target.height === 0) return prev; // Cannot invalidate genesis

            const updatedBlocks = prev.map(b =>
                b.hash === hash ? { ...b, isInvalid: true } : b
            );

            return calculateActiveChain(updatedBlocks);
        });

        // Simulate network delay
        await new Promise(r => setTimeout(r, 100));

        return { success: true };
    }, [calculateActiveChain]);

    return {
        blocks,
        fetchBlocks,
        mineBlock,
        invalidateBlock
    };
}
