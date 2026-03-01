"use client";

import React, { useEffect, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    Node,
    Edge,
    ConnectionLineType,
    Position,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BlockNode } from './BlockNode';
import toast from 'react-hot-toast';

const nodeTypes = {
    block: BlockNode,
};

interface BlockData {
    hash: string;
    height: number;
    previousblockhash?: string;
    isMainChain: boolean;
    isInvalid?: boolean;
}

export default function BlockTree({ onChainInfo, onNodeSelect }: { onChainInfo?: (info: any) => void; onNodeSelect?: (node: any) => void; }) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { fitView } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState<any>(null);

    const fetchChainData = async () => {
        try {
            const response = await fetch('/api/blocks');
            const data = await response.json();

            if (data.success && data.data.blocks.length > 0) {
                const blocks: BlockData[] = data.data.blocks;

                if (onChainInfo && data.data.chainInfo) {
                    onChainInfo(data.data.chainInfo);
                }

                const childrenCount: Record<string, number> = {};
                blocks.forEach(b => {
                    if (b.previousblockhash) {
                        childrenCount[b.previousblockhash] = (childrenCount[b.previousblockhash] || 0) + 1;
                    }
                });

                const tips = blocks.filter(b => !childrenCount[b.hash]);

                let currentYOffset = 450;
                const hashToY: Record<string, number> = {};

                blocks.filter(b => b.isMainChain).forEach(b => hashToY[b.hash] = 300);

                tips.filter(b => !b.isMainChain).forEach(tip => {
                    let curr = tip.hash;
                    const y = currentYOffset;
                    currentYOffset += 150;

                    while (curr && !hashToY[curr]) {
                        hashToY[curr] = y;
                        const block = blocks.find(b => b.hash === curr);
                        curr = block?.previousblockhash || '';
                    }
                });

                const newNodes: Node[] = [];
                const newEdges: Edge[] = [];

                const minHeight = Math.min(...blocks.map(b => b.height));

                blocks.forEach(block => {
                    newNodes.push({
                        id: block.hash,
                        type: 'block',
                        position: { x: (block.height - minHeight) * 300 + 50, y: hashToY[block.hash] || 450 },
                        data: {
                            label: `Height: ${block.height}`,
                            hash: block.hash,
                            height: block.height,
                            isActive: block.isMainChain,
                            isInvalid: block.isInvalid
                        },
                        sourcePosition: Position.Right,
                        targetPosition: Position.Left,
                    });

                    if (block.previousblockhash) {
                        const parentExists = blocks.find(b => b.hash === block.previousblockhash);
                        if (parentExists) {
                            newEdges.push({
                                id: `e-${block.previousblockhash}-${block.hash}`,
                                source: block.previousblockhash,
                                target: block.hash,
                                type: 'smoothstep',
                                animated: block.isMainChain,
                                style: {
                                    stroke: block.isMainChain ? '#f7931a' : block.isInvalid ? '#e5e7eb' : '#fca5a5',
                                    strokeWidth: block.isMainChain ? 3 : 2
                                }
                            });
                        }
                    }
                });

                setNodes(newNodes);
                setEdges(newEdges);

                setTimeout(() => {
                    fitView({ padding: 0.2, duration: 800 });
                }, 100);
            }
        } catch (error) {
            console.error("Failed to load chain data:", error);
        }
    };

    useEffect(() => {
        fetchChainData();
    }, []);

    const handleMineBlock = async () => {
        try {
            const body = selectedNode ? { parentHash: selectedNode.hash } : {};
            const res = await fetch('/api/mine', { method: 'POST', body: JSON.stringify(body) });
            const data = await res.json();
            if (!data.success) {
                toast.error(`Failed to mine: ${data.error}`);
            } else {
                toast.success("Successfully mined new block!");
                fetchChainData();
            }
        } catch (e) {
            console.error(e);
            toast.error("Network error occurred while trying to mine.");
        }
    };

    const handleInvalidateTip = async () => {
        if (!selectedNode) {
            toast.error("Select a block first to invalidate it.");
            return;
        }

        if (selectedNode.height === 0) {
            toast.error("Cannot invalidate the Genesis block!");
            return;
        }

        try {
            const res = await fetch('/api/invalidate', { method: 'POST', body: JSON.stringify({ blockHash: selectedNode.hash }) });
            const data = await res.json();
            if (!data.success) {
                toast.error(`Failed to invalidate: ${data.error}`);
            } else {
                toast.success("Successfully invalidated branch!");
                fetchChainData();
                setSelectedNode(null);
                if (onNodeSelect) onNodeSelect(null);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="w-full h-full rounded-2xl border border-border bg-light-panel overflow-hidden shadow-sm relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(_, node) => {
                    setSelectedNode(node.data);
                    if (onNodeSelect) onNodeSelect(node.data);
                }}
                connectionLineType={ConnectionLineType.SmoothStep}
                className="w-full h-full"
                minZoom={0.2}
            >
                <Controls showInteractive={false} className="bg-white border-border shadow-sm rounded-lg overflow-hidden" />
                <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#e2e8f0" />
            </ReactFlow>

            {/* Floating Action Buttons overlaid on the graph corner */}
            <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3">
                {selectedNode && (
                    <button
                        onClick={handleInvalidateTip}
                        disabled={selectedNode.isInvalid}
                        className={`shadow-md rounded-xl py-3 px-6 font-medium transition-all flex items-center justify-center gap-2
                            ${selectedNode.isInvalid
                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-50 text-red-600 border border-red-200'}
                        `}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                        {selectedNode.isInvalid ? "Already Invalidated" : "Invalidate Block"}
                    </button>
                )}
                <button
                    onClick={handleMineBlock}
                    className="bg-bitcoin-orange hover:bg-bitcoin-orange-dark text-white shadow-lg shadow-orange-500/30 rounded-xl py-3 px-6 font-bold transition-all flex items-center justify-center gap-2">
                    <span>{selectedNode ? 'Mine on Selected Fork' : 'Mine Block (Active Tip)'}</span>
                </button>
            </div>
        </div>
    );
}
