import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0a0f1e] border border-[#1a2540] rounded p-2 text-xs font-mono shadow-xl">
      <p className="text-slate-500 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-semibold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

const xAxis = <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono' }} tickLine={false} interval="preserveStartEnd" />
const yAxis = <YAxis tick={{ fill: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono' }} tickLine={false} width={28} />
const grid  = <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />

export function CPUMemoryChart({ data }) {
  return (
    <div className="cyber-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-[10px] font-semibold text-slate-400 uppercase tracking-widest">CPU & Memory</h3>
        <div className="flex gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#00d4ff] inline-block" />CPU</span>
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#a855f7] inline-block" />Mem</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="cpuG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="memG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          {grid}{xAxis}{yAxis}
          <Tooltip content={<Tip />} />
          <ReferenceLine y={80} stroke="#ffcc0030" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="cpu"    name="CPU %"    stroke="#00d4ff" fill="url(#cpuG)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Area type="monotone" dataKey="memory" name="Memory %" stroke="#a855f7" fill="url(#memG)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LatencyChart({ data }) {
  return (
    <div className="cyber-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Latency & Pkt Loss</h3>
        <div className="flex gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#ffcc00] inline-block" />Lat</span>
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#ff3b5c] inline-block" />Pkt</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="latG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ffcc00" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ffcc00" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="plG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ff3b5c" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ff3b5c" stopOpacity={0} />
            </linearGradient>
          </defs>
          {grid}{xAxis}{yAxis}
          <Tooltip content={<Tip />} />
          <Area type="monotone" dataKey="latency"     name="Latency ms" stroke="#ffcc00" fill="url(#latG)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Area type="monotone" dataKey="packet_loss" name="Pkt Loss %"  stroke="#ff3b5c" fill="url(#plG)"  strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AnomalyScoreChart({ data }) {
  return (
    <div className="cyber-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Anomaly Score</h3>
        <span className="text-[9px] font-mono text-slate-600">LSTM Recon Error</span>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="scG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ff3b5c" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#ff3b5c" stopOpacity={0} />
            </linearGradient>
          </defs>
          {grid}{xAxis}
          <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono' }} tickLine={false} width={28} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={50} stroke="#ff3b5c30" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="anomaly_score" name="Score %" stroke="#ff3b5c" fill="url(#scG)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}