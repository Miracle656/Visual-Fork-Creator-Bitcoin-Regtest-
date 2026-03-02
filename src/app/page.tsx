"use client";

import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import BlockTree from "@/components/BlockTree";

export default function Home() {
  const [chainInfo, setChainInfo] = useState({
    blockHeight: 0,
    activeHeaders: 0,
    staleBranches: 0
  });

  const [isSandbox, setIsSandbox] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#f9fafb] text-text-main p-4 lg:p-8 font-sans">

      {/* Header Container */}
      <div className="w-full flex justify-between items-center mb-6 max-w-[1400px]">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            Visual Fork Creator
            {isSandbox ? (
              <span className="bg-purple-600/10 text-purple-600 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-purple-600/20">Sandbox</span>
            ) : (
              <span className="bg-bitcoin-orange/10 text-bitcoin-orange text-xs px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-bitcoin-orange/20">Regtest</span>
            )}
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Interactive Chain Modeler for Bitcoin Developers</p>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => setIsSandbox(!isSandbox)}
            className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all border ${isSandbox ? 'bg-purple-600 border-purple-700 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {isSandbox ? 'Sandbox Mode: ON' : 'Sandbox Mode: OFF'}
          </button>
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm shadow-sm flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSandbox ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}></span>
            <span className="text-gray-500 font-medium">RPC Status:</span>
            <span className={isSandbox ? "text-gray-500 font-bold" : "text-green-600 font-bold"}>
              {isSandbox ? "Offline" : "Connected"}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Graph Container */}
      <div className="w-full flex-grow max-w-[1400px] h-full flex flex-col sm:flex-row gap-6">

        {/* Graph Layout Area */}
        <section className="flex-grow rounded-2xl relative min-h-[600px] shadow-sm border border-gray-100 bg-white">
          <ReactFlowProvider>
            <BlockTree isSandbox={isSandbox} onChainInfo={setChainInfo} onNodeSelect={setSelectedNode} />
          </ReactFlowProvider>
        </section>

        {/* Sidebar Info Panel */}
        <aside className="w-full sm:w-[320px] bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
              Chain Status
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 text-sm">
                <span className="text-gray-500">Block Height</span>
                <span className="font-mono font-bold text-gray-900">{chainInfo.blockHeight}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 text-sm">
                <span className="text-gray-500">Active Headers</span>
                <span className="font-mono font-bold text-gray-900">{chainInfo.activeHeaders}</span>
              </div>
              <div className="flex justify-between items-center bg-[#fef2f2] px-3 py-2 rounded-lg border border-[#fca5a5] text-sm">
                <span className="text-red-600 font-medium">Stale Branches</span>
                <span className="font-mono font-bold text-red-600">{chainInfo.staleBranches}</span>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
              Selected Node Info
            </h2>

            {selectedNode ? (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-3 text-sm break-all">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Height:</span>
                  <span className="font-bold text-gray-900">{selectedNode.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Status:</span>
                  <span className={selectedNode.isActive ? "text-bitcoin-orange font-bold" : selectedNode.isInvalid ? "text-gray-500 font-bold" : "text-red-500 font-bold"}>
                    {selectedNode.isActive ? "Active Chain" : selectedNode.isInvalid ? "Invalidated" : "Stale Block"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block mb-1">Hash:</span>
                  <span className="font-mono text-xs text-gray-700 bg-white p-2 rounded border border-gray-200 block shadow-sm">
                    {selectedNode.hash}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 h-[150px] flex items-center justify-center text-center">
                <span className="text-gray-400 text-sm font-medium">Click on a block<br />to view details</span>
              </div>
            )}
          </div>
        </aside>

      </div>
    </main>
  );
}
