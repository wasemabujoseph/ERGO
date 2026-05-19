'use client';

import React, { useState } from 'react';
import { Globe, Info } from 'lucide-react';
import { worldPaths } from './worldPaths';


export function EnterpriseRiskHeatmap() {
  const [activeToggle, setActiveToggle] = useState('score');
  const [selectedPlant, setSelectedPlant] = useState({
    name: 'Detroit Auto Assembly',
    code: 'USA-DET-04',
    x: 146,
    y: 123,
    severity: 'CRITICAL',
    workstationsCount: 18,
    unmitigatedRisks: 4,
    averageRiskScore: 7.2
  });

  const plants = [
    { name: 'Detroit Auto Assembly', code: 'USA-DET-04', x: 146, y: 123, severity: 'CRITICAL', workstationsCount: 18, unmitigatedRisks: 4, averageRiskScore: 7.2 },
    { name: 'Nashville Powertrain', code: 'USA-NAS-02', x: 141, y: 130, severity: 'HIGH', workstationsCount: 15, unmitigatedRisks: 3, averageRiskScore: 6.1 },
    { name: 'Spartanburg Body & Paint', code: 'USA-SPA-08', x: 148, y: 133, severity: 'HIGH', workstationsCount: 12, unmitigatedRisks: 2, averageRiskScore: 5.8 },
    { name: 'Aguascalientes Stamping', code: 'MEX-AGU-11', x: 131, y: 162, severity: 'MEDIUM', workstationsCount: 19, unmitigatedRisks: 1, averageRiskScore: 4.5 },
    { name: 'Munich Body Frame', code: 'DEU-MUN-02', x: 358, y: 114, severity: 'CRITICAL', workstationsCount: 14, unmitigatedRisks: 2, averageRiskScore: 7.0 },
    { name: 'Shanghai Metal Stamp', code: 'CHN-SHA-01', x: 564, y: 141, severity: 'MEDIUM', workstationsCount: 22, unmitigatedRisks: 1, averageRiskScore: 4.2 },
    { name: 'Tokyo Logistics Center', code: 'JPN-TOK-01', x: 604, y: 132, severity: 'OPTIMAL', workstationsCount: 20, unmitigatedRisks: 0, averageRiskScore: 1.8 }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden font-sans select-none shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_30px_rgba(0,0,0,0.03)] flex flex-col">
      
      {/* Visual Header matching the reference exactly */}
      <div className="px-4.5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-900">Enterprise Risk Heatmap</span>
          <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
        </div>
        
        {/* Risk toggle selectors - Perfect Pill Styling */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button 
            onClick={() => setActiveToggle('score')}
            className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
              activeToggle === 'score' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Risk Score
          </button>
          <button 
            onClick={() => setActiveToggle('actions')}
            className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
              activeToggle === 'actions' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overdue Actions
          </button>
        </div>
      </div>

      {/* SVG Canvas Map grid */}
      <div className="relative w-full h-[320px] bg-gradient-to-br from-[#0b1220] to-[#111c30] flex items-center justify-center overflow-hidden border-b border-slate-800">
        
        {/* Soft grid matrix background overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        {/* Real, highly detailed SVG world map projection */}
        <svg 
          className="w-full h-full text-slate-800/80 transition-all duration-300" 
          viewBox="0 0 710 350" 
          fill="currentColor" 
          stroke="#111c30" 
          strokeWidth="0.4"
        >
          {/* Render parsed detailed countries */}
          <g id="world-continents">
            {worldPaths.map((c) => (
              <path
                key={c.id}
                id={c.id}
                d={c.d}
                className="fill-[#1f2937] stroke-[#0b1220] hover:fill-[#374151] transition-colors duration-150"
              >
                <title>{c.name}</title>
              </path>
            ))}
          </g>

          {/* Glowing Country/Regional indicators directly underneath our active pins */}
          <g id="radar-glows" className="pointer-events-none opacity-50">
            {plants.map((p) => {
              const glowColors = {
                OPTIMAL: 'rgba(16, 185, 129, 0.15)',
                MEDIUM: 'rgba(245, 158, 11, 0.15)',
                HIGH: 'rgba(249, 115, 22, 0.2)',
                CRITICAL: 'rgba(239, 68, 68, 0.25)'
              };
              return (
                <circle
                  key={`glow-${p.code}`}
                  cx={p.x}
                  cy={p.y}
                  r={22}
                  fill={glowColors[p.severity]}
                  className="blur-md"
                />
              );
            })}
          </g>

          {/* Pulsing Coordinate Pins aligned perfectly to Natural Earth coordinates */}
          <g id="coordinate-pins">
            {plants.map((p) => {
              const pinColors = {
                OPTIMAL: { fill: '#10b981', ring: 'rgba(16, 185, 129, 0.4)' },
                MEDIUM: { fill: '#f59e0b', ring: 'rgba(245, 158, 11, 0.4)' },
                HIGH: { fill: '#f97316', ring: 'rgba(249, 115, 22, 0.4)' },
                CRITICAL: { fill: '#ef4444', ring: 'rgba(239, 68, 68, 0.4)' }
              };

              const colors = pinColors[p.severity];
              const isSelected = selectedPlant?.code === p.code;

              return (
                <g
                  key={p.code}
                  className="cursor-pointer group"
                  onClick={() => setSelectedPlant(p)}
                >
                  {/* Outer animated radar pulse */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 9 : 6.5}
                    fill="none"
                    stroke={colors.fill}
                    strokeWidth={1.2}
                    className="animate-ping"
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  />
                  {/* Subtle outer static glow block */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 5.5 : 4}
                    fill={colors.fill}
                    fillOpacity={0.15}
                    stroke={colors.fill}
                    strokeWidth={0.8}
                  />
                  {/* Interactive solid core */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 3.5 : 2.5}
                    fill={colors.fill}
                    className="transition-transform duration-200 group-hover:scale-130"
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* Elegant Legend Panel matching ServiceNow standard layout */}
        <div className="absolute bottom-3 left-3 bg-[#1e293b]/95 border border-slate-700/80 p-2.5 rounded-xl flex flex-col gap-1.5 shadow-xl text-[9px] font-bold text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded bg-[#ef4444] shadow-sm shadow-[#ef4444]/30" />
            <span>Extreme (20+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded bg-[#f97316] shadow-sm shadow-[#f97316]/30" />
            <span>High (15-19)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded bg-[#f59e0b] shadow-sm shadow-[#f59e0b]/30" />
            <span>Moderate (10-14)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded bg-[#10b981] shadow-sm shadow-[#10b981]/30" />
            <span>Low (&lt;10)</span>
          </div>
        </div>

      </div>

      {/* Selected Node Drawer */}
      <div className="px-4.5 py-3 bg-slate-50/50 min-h-[60px] flex items-center justify-between border-t border-slate-100">
        {selectedPlant ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-bold text-xs block">{selectedPlant.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold border ${
                  selectedPlant.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                  selectedPlant.severity === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  selectedPlant.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {selectedPlant.severity}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block leading-none">Boundary Scope: {selectedPlant.code}</span>
            </div>

            <div className="flex gap-4 text-[10.5px] text-slate-650">
              <div className="text-right">
                <span className="text-slate-450 block font-semibold text-[9px] uppercase tracking-wider">Workstations</span>
                <span className="text-slate-900 font-bold block mt-0.5">{selectedPlant.workstationsCount} active</span>
              </div>
              <div className="w-px h-6 bg-slate-200 self-center" />
              <div className="text-right">
                <span className="text-slate-450 block font-semibold text-[9px] uppercase tracking-wider">Unmitigated Risks</span>
                <span className="text-red-650 font-bold block mt-0.5">{selectedPlant.unmitigatedRisks} hazards</span>
              </div>
              <div className="w-px h-6 bg-slate-200 self-center" />
              <div className="text-right">
                <span className="text-slate-450 block font-semibold text-[9px] uppercase tracking-wider">Rolling Index</span>
                <span className="text-slate-900 font-bold block mt-0.5">{selectedPlant.averageRiskScore.toFixed(1)} score</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-xs w-full">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Select any plant coordinate on the global telemetry system above to review details.</span>
          </div>
        )}
      </div>

    </div>
  );
}

export default EnterpriseRiskHeatmap;
