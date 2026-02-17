import { Activity, GitBranch, Radio } from 'lucide-react'

export default function Header({ isConnected, isConnecting, stats }) {
  return (
    <header className="border-b border-[#1a2540] bg-[#050810] px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 rounded-full bg-[#ff3b5c20] border border-[#ff3b5c40] flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 rounded-full bg-[#ff3b5c60] border border-[#ff3b5c]" />
          </div>
        </div>
        <div>
          <h1 className="font-display text-xl font-black text-white glow-accent tracking-widest">
            NET<span className="text-[#ff3b5c]">PULSE</span>
          </h1>
          <p className="text-[10px] font-mono text-slate-600 tracking-wider">
            REAL-TIME ANOMALY DETECTION SYSTEM
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6">
        {[
          { icon: Activity,  label: 'TOTAL POINTS', value: stats.total_points.toLocaleString(), color: '#00d4ff' },
          { icon: GitBranch, label: 'ANOMALIES',     value: stats.total_anomalies,               color: '#ff3b5c' },
          { icon: Radio,     label: 'RATE',           value: `${stats.anomaly_rate}%`,            color: '#ffcc00' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon size={12} style={{ color }} className="opacity-70" />
            <div>
              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">{label}</div>
              <div className="text-sm font-mono font-bold" style={{ color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-[#0a0f1e] border border-[#1a2540] rounded px-3 py-1.5">
        {isConnecting ? (
          <><div className="w-2 h-2 rounded-full bg-[#ffcc00] animate-pulse" /><span className="text-xs font-mono text-[#ffcc00]">CONNECTING</span></>
        ) : isConnected ? (
          <><div className="live-dot" /><span className="text-xs font-mono text-[#00ff88]">LIVE</span></>
        ) : (
          <><div className="dead-dot" /><span className="text-xs font-mono text-slate-500">OFFLINE</span></>
        )}
      </div>
    </header>
  )
}