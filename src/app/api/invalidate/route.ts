import { NextResponse } from 'next/server';
import { rpcClient } from '@/lib/bitcoin-rpc';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { blockHash } = body;

        if (!blockHash) {
            return NextResponse.json({ success: false, error: "blockHash is required" }, { status: 400 });
        }

        // Call the RPC to invalidate the block (and its descendants)
        await rpcClient.command('invalidateblock', blockHash);

        return NextResponse.json({
            success: true,
            message: `Block ${blockHash} invalidated successfully.`
        });

    } catch (error: any) {
        console.error("RPC Invalidate Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to invalidate block" },
            { status: 500 }
        );
    }
}
