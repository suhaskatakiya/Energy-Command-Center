import React, { useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// Node Type definition
interface GraphNode {
  id: string;
  label: string;
  type: 'supplier' | 'crude_grade' | 'corridor' | 'port' | 'refinery' | 'spr_site';
  riskScore?: number;
  color?: string;
  x?: number;
  y?: number;
}

// Edge Type definition
interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}

const TYPE_COLORS: Record<string, string> = {
  supplier: '#3b82f6',     // blue
  crude_grade: '#f59e0b',  // amber
  corridor: '#ef4444',     // red
  port: '#10b981',         // green
  refinery: '#8b5cf6',     // purple
  spr_site: '#06b6d4',     // cyan
};

const KnowledgeGraph: React.FC = () => {
  const [highlightNode, setHighlightNode] = useState<string | null>(null);

  // Nodes List
  const nodes: GraphNode[] = useMemo(() => [
    // SUPPLIERS
    { id: "sup_sa",  label: "Saudi Aramco",     type: "supplier" },
    { id: "sup_ir",  label: "Iraq SOMO",         type: "supplier" },
    { id: "sup_uae", label: "ADNOC (UAE)",        type: "supplier" },
    { id: "sup_ru",  label: "Rosneft (Russia)",   type: "supplier" },
    { id: "sup_ng",  label: "NNPC (Nigeria)",     type: "supplier" },
    { id: "sup_us",  label: "US WTI Exporters",  type: "supplier" },

    // CRUDE GRADES
    { id: "gr_al",   label: "Arab Light",         type: "crude_grade" },
    { id: "gr_bh",   label: "Basrah Heavy",       type: "crude_grade" },
    { id: "gr_mu",   label: "Murban (UAE)",        type: "crude_grade" },
    { id: "gr_ur",   label: "URALS Blend",         type: "crude_grade" },
    { id: "gr_bon",  label: "Bonny Light",         type: "crude_grade" },
    { id: "gr_wti",  label: "WTI Light Sweet",     type: "crude_grade" },

    // CORRIDORS
    { id: "cor_horm", label: "Strait of Hormuz",  type: "corridor", riskScore: 78 },
    { id: "cor_red",  label: "Red Sea / Suez",     type: "corridor", riskScore: 65 },
    { id: "cor_cape", label: "Cape of Good Hope",  type: "corridor", riskScore: 18 },
    { id: "cor_mal",  label: "Strait of Malacca",  type: "corridor", riskScore: 22 },

    // INDIAN PORTS
    { id: "port_jam",  label: "Jamnagar Port",    type: "port" },
    { id: "port_par",  label: "Paradip Port",     type: "port" },
    { id: "port_koc",  label: "Kochi Port",       type: "port" },
    { id: "port_viz",  label: "Vizag Port",       type: "port" },
    { id: "port_mum",  label: "Mumbai (JNPT)",    type: "port" },

    // REFINERIES
    { id: "ref_rjam", label: "Jamnagar (RIL) 1.24 MBPD",   type: "refinery" },
    { id: "ref_hjam", label: "Jamnagar (HPCL) 0.18 MBPD",  type: "refinery" },
    { id: "ref_par",  label: "Paradip (IOCL) 0.30 MBPD",   type: "refinery" },
    { id: "ref_koc",  label: "Kochi (BPCL) 0.31 MBPD",     type: "refinery" },
    { id: "ref_viz",  label: "Vizag (HPCL) 0.17 MBPD",     type: "refinery" },
    { id: "ref_che",  label: "Chennai (CPCL) 0.21 MBPD",   type: "refinery" },

    // SPR SITES
    { id: "spr_vis", label: "SPR Visakhapatnam", type: "spr_site" },
    { id: "spr_man", label: "SPR Mangaluru",     type: "spr_site" },
    { id: "spr_pad", label: "SPR Padur",         type: "spr_site" }
  ].map(node => ({
    ...node,
    color: TYPE_COLORS[node.type]
  })), []);

  // Links/Edges List
  const links: GraphLink[] = useMemo(() => [
    { source: "sup_sa",  target: "gr_al",    label: "produces" },
    { source: "sup_ir",  target: "gr_bh",    label: "produces" },
    { source: "sup_uae", target: "gr_mu",    label: "produces" },
    { source: "sup_ru",  target: "gr_ur",    label: "produces" },
    { source: "sup_ng",  target: "gr_bon",   label: "produces" },
    { source: "sup_us",  target: "gr_wti",   label: "produces" },

    { source: "gr_al",  target: "cor_horm",  label: "transits" },
    { source: "gr_bh",  target: "cor_horm",  label: "transits" },
    { source: "gr_mu",  target: "cor_horm",  label: "transits" },
    { source: "gr_ur",  target: "cor_cape",  label: "transits" },
    { source: "gr_bon", target: "cor_cape",  label: "transits" },
    { source: "gr_wti", target: "cor_cape",  label: "transits" },
    { source: "gr_al",  target: "cor_red",   label: "alt route" },
    { source: "gr_bon", target: "cor_red",   label: "alt route" },

    { source: "cor_horm", target: "port_jam",  label: "arrives at" },
    { source: "cor_horm", target: "port_par",  label: "arrives at" },
    { source: "cor_horm", target: "port_koc",  label: "arrives at" },
    { source: "cor_horm", target: "port_viz",  label: "arrives at" },
    { source: "cor_red",  target: "port_koc",  label: "arrives at" },
    { source: "cor_red",  target: "port_mum",  label: "arrives at" },
    { source: "cor_cape", target: "port_koc",  label: "arrives at" },
    { source: "cor_cape", target: "port_mum",  label: "arrives at" },

    { source: "port_jam", target: "ref_rjam",  label: "feeds" },
    { source: "port_jam", target: "ref_hjam",  label: "feeds" },
    { source: "port_par", target: "ref_par",   label: "feeds" },
    { source: "port_koc", target: "ref_koc",   label: "feeds" },
    { source: "port_viz", target: "ref_viz",   label: "feeds" },
    { source: "port_viz", target: "spr_vis",   label: "stores to" },
    { source: "port_koc", target: "spr_man",   label: "stores to" },
    { source: "port_koc", target: "spr_pad",   label: "stores to" }
  ], []);

  const data = useMemo(() => ({ nodes, links }), [nodes, links]);

  // Helper to determine if a link is connected to the clicked node
  const isLinkHighlighted = (link: any) => {
    if (!highlightNode) return false;
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return sourceId === highlightNode || targetId === highlightNode;
  };

  return (
    <div className="bg-[#0a0f1e] border border-brand-border rounded-xl p-6 relative overflow-hidden flex flex-col min-h-[500px]">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider">Supply Chain Knowledge Graph</h2>
        <p className="text-xs text-slate-400">Supplier → Grade → Corridor → Port → Refinery → SPR</p>
      </div>

      {/* Graph Area */}
      <div className="flex-1 bg-[#0f172a] rounded-lg border border-brand-border/60 overflow-hidden min-h-[400px]">
        <ForceGraph2D
          graphData={data}
          backgroundColor="#0f172a"
          height={400}
          cooldownTicks={100}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkColor={(link) => isLinkHighlighted(link) ? '#f97316' : 'rgba(255,255,255,0.15)'}
          linkWidth={(link) => isLinkHighlighted(link) ? 2.5 : 1.2}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const r = node.type === 'refinery' ? 8 : 5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color || '#94a3b8';
            ctx.fill();

            // Corridor border: red if riskScore > 65, amber if 40-65, green if <40
            if (node.type === 'corridor') {
              ctx.lineWidth = 1.8 / globalScale;
              let borderColor = '#10b981';
              if (node.riskScore > 65) borderColor = '#ef4444';
              else if (node.riskScore >= 40) borderColor = '#f59e0b';
              ctx.strokeStyle = borderColor;
              ctx.stroke();
            }

            // Draw label below node
            const label = node.label;
            const fontSize = Math.max(3.5, 9 / globalScale);
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(label, node.x, node.y + r + 3);
          }}
          onNodeClick={(node: any) => {
            console.log(`Knowledge Graph Clicked: ${node.id}`);
            setHighlightNode(prev => prev === node.id ? null : node.id);
          }}
          onBackgroundClick={() => {
            setHighlightNode(null);
          }}
          nodeLabel={(node: any) => {
            const riskStr = node.riskScore !== undefined ? `<br/><span style="color:#f43f5e">Risk Score: ${node.riskScore}</span>` : '';
            return `
              <div style="background:#090d16; color:#f1f5f9; border:1px solid #1e293b; padding:6px 10px; border-radius:6px; font-size:11px; font-family:sans-serif; pointer-events:none;">
                <strong style="color:#38bdf8">${node.label}</strong> <span style="color:#64748b">(${node.type})</span>
                ${riskStr}
              </div>
            `;
          }}
        />
      </div>

      {/* Legend overlay */}
      <div className="absolute top-24 right-10 bg-slate-950/90 border border-brand-border rounded-lg p-3 z-10 text-[10px] space-y-1.5 pointer-events-auto">
        <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Graph Legend</p>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-350 capitalize font-medium">{type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeGraph;
