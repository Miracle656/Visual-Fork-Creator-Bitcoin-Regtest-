import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface CustomNodeData {
    label: string;
    hash: string;
    height: number;
    isActive: boolean;
    isInvalid?: boolean;
}

export const BlockNode = memo(({ data, selected }: { data: CustomNodeData, selected?: boolean }) => {
    const { label, hash, height, isActive, isInvalid } = data;

    return (
        <div
            className={`
        bg-white rounded-2xl shadow-sm border p-4 flex flex-col gap-2 min-w-[200px]
        transition-all duration-200 hover:shadow-md
        ${isActive ? 'border-bitcoin-orange ring-1 ring-bitcoin-orange ring-opacity-50' : isInvalid ? 'border-gray-300 bg-gray-50 opacity-70' : 'border-border'}
        ${selected ? 'ring-4 ring-bitcoin-orange outline-none scale-105 shadow-xl ring-offset-2 z-50 relative' : ''}
      `}
        >
            <Handle type="target" position={Position.Left} className={isActive ? 'bg-bitcoin-orange' : isInvalid ? 'bg-gray-400' : ''} />

            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">
                    {height === 0 ? 'Genesis' : 'Regtest Block'}
                </span>
                <div className="flex items-center gap-2">
                    {isInvalid && <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-200 px-1 py-0.5 rounded">Invalidated</span>}
                    {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-bitcoin-orange shadow-[0_0_5px_#f7931a]"></span>
                    ) : isInvalid ? (
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-border"></span>
                    )}
                </div>
            </div>

            <h3 className={`text-sm font-semibold m-0 ${isInvalid ? 'text-gray-400 line-through' : 'text-text-main'}`}>{label}</h3>
            <div className={`text-[10px] font-mono px-2 py-1 rounded ${isInvalid ? 'text-gray-400 bg-gray-200' : 'text-text-muted bg-light-bg'}`}>
                {hash.slice(0, 12)}...
            </div>

            <Handle type="source" position={Position.Right} className={isActive ? 'bg-bitcoin-orange' : isInvalid ? 'bg-gray-400' : ''} />
        </div>
    );
});

BlockNode.displayName = 'BlockNode';
