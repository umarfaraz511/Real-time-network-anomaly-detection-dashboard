const NODE_POSITIONS = {
  'NODE-01': { x: 50, y: 15, label: 'Core-01', type: 'core' },
  'NODE-02': { x: 15, y: 45, label: 'Edge-01', type: 'edge' },
  'NODE-03': { x: 85, y: 45, label: 'Edge-02', type: 'edge' },
  'NODE-04': { x: 25, y: 78, label: 'Leaf-01', type: 'leaf' },
  'NODE-05': { x: 50, y: 82, label: 'Leaf-02', type: 'leaf' },
  'NODE-06': { x: 75, y: 78, label: 'Leaf-03', type: 'leaf' },
}

const CONNECTIONS = [
  ['NODE-01','NODE-02'],['NODE-01','NODE-03'],
  ['NODE-02','NODE-04'],['NODE-02','NODE-05'],
  ['NODE-03','NODE-05'],['NODE-03','NODE-06'],
]

export default function NodeMap({ nodeStatus }) {
  const getColor = (id) => {
    const s = nodeStatus[id]
    if (!s) return '#1a2540'
    if (s.is_anomaly) return '#ff3b5c'
    if (s.cpu_usage > 80) return '#ffcc00'
    return '#00ff88'
  }

  return (
    <div className="cyber-panel p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-xs font-semibold text-[#00d4ff] uppercase tracking-widest">Network Topology</h3>
        <span className="text-xs font-mono text-slate-500">
          {Object.values(nodeStatus).filter(n => n.is_anomaly).length}/{Object.keys(NODE_POSITIONS).length} ALERT
        </span>
      </div>
      <div className="relative w-full" style={{ paddingBottom: '90%' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {CONNECTIONS.map(([n1, n2]) => {
            const p1 = NODE_POSITIONS[n1], p2 = NODE_POSITIONS[n2]
            const anomaly = nodeStatus[n1]?.is_anomaly || nodeStatus[n2]?.is_anomaly
            return (
              <line key={`${n1}-${n2}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={anomaly ? '#ff3b5c' : '#1a2540'}
                strokeWidth={anomaly ? 0.8 : 0.4}
                strokeDasharray={anomaly ? '2,1' : ''}
                opacity={0.7}
              />
            )
          })}
          {Object.entries(NODE_POSITIONS).map(([id, pos]) => {
            const color = getColor(id)
            const r     = pos.type === 'core' ? 5 : pos.type === 'edge' ? 4 : 3
            return (
              <g key={id}>
                {nodeStatus[id]?.is_anomaly && (
                  <circle cx={pos.x} cy={pos.y} r={r+3} fill="none" stroke="#ff3b5c" strokeWidth="0.5" opacity="0.5">
                    <animate attributeName="r"       from={r+2} to={r+6} dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0"   dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={pos.x} cy={pos.y} r={r}   fill={`${color}20`} stroke={color} strokeWidth={pos.type==='core'?1.2:0.8} />
                <circle cx={pos.x} cy={pos.y} r={1.5} fill={color} />
                <text x={pos.x} y={pos.y+r+4} textAnchor="middle" fontSize="3.5" fill="#94a3b8" fontFamily="JetBrains Mono">
                  {pos.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-2 justify-center">
        {[['#00ff88','Normal'],['#ffcc00','Warning'],['#ff3b5c','Anomaly']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
            <span className="text-xs font-mono text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}