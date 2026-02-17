export default function MetricCard({ label, value, unit, color, icon: Icon, warning }) {
  const colorMap = {
    accent: { text: 'text-[#00d4ff]', border: 'border-[#00d4ff20]' },
    red:    { text: 'text-[#ff3b5c]', border: 'border-[#ff3b5c20]' },
    green:  { text: 'text-[#00ff88]', border: 'border-[#00ff8820]' },
    yellow: { text: 'text-[#ffcc00]', border: 'border-[#ffcc0020]' },
    purple: { text: 'text-[#a855f7]', border: 'border-[#a855f720]' },
  }
  const c         = colorMap[color] || colorMap.accent
  const isWarning = warning && value > warning

  return (
    <div className={`cyber-panel px-3 py-2 ${c.border} ${isWarning ? 'animate-pulse-red' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
        {Icon && <Icon size={11} className={`${c.text} opacity-60`} />}
      </div>
      <div className="flex items-end gap-1">
        <span className={`font-display text-xl font-bold leading-none ${isWarning ? 'text-[#ff3b5c]' : c.text}`}>
          {typeof value === 'number' ? value.toFixed(1) : value ?? '--'}
        </span>
        <span className="text-slate-600 text-[10px] mb-0.5 font-mono">{unit}</span>
      </div>
      {isWarning && <div className="text-[8px] font-mono text-[#ff3b5c] mt-0.5 animate-pulse">⚠ HIGH</div>}
    </div>
  )
}