import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const LABELS = {
  cpu_spike: '⚡ CPU Spike', memory_leak: '💾 Memory Leak',
  latency_surge: '📡 Latency Surge', packet_storm: '🌊 Packet Storm',
  bandwidth_drop: '📉 Bandwidth Drop', error_flood: '🚨 Error Flood',
}

export default function AlertBanner({ alert, onDismiss }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!alert) return
    setProgress(100)
    const interval = setInterval(() => setProgress(p => p <= 0 ? 0 : p - 2), 100)
    return () => clearInterval(interval)
  }, [alert])

  if (!alert) return null

  const severity = alert.score > 80 ? 'CRITICAL' : alert.score > 50 ? 'HIGH' : 'MEDIUM'
  const sc       = severity === 'CRITICAL' ? '#ff3b5c' : severity === 'HIGH' ? '#ffcc00' : '#ff8c00'

  return (
    <div className="fixed top-4 right-4 z-50 w-80 cyber-panel animate-slideUp overflow-hidden" style={{ borderColor: sc }}>
      <div className="absolute top-0 left-0 h-0.5 transition-all duration-100" style={{ width: `${progress}%`, background: sc }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${sc}20`, border: `1px solid ${sc}` }}>
              <AlertTriangle size={14} style={{ color: sc }} />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: sc }}>{severity} ANOMALY</div>
              <div className="font-display font-bold text-white text-sm">{LABELS[alert.type] || alert.type}</div>
            </div>
          </div>
          <button onClick={onDismiss} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-[#ffffff08] rounded p-2">
            <span className="text-slate-500">NODE</span>
            <div className="text-[#00d4ff] font-semibold">{alert.node}</div>
          </div>
          <div className="bg-[#ffffff08] rounded p-2">
            <span className="text-slate-500">SCORE</span>
            <div style={{ color: sc }} className="font-semibold">{alert.score?.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}