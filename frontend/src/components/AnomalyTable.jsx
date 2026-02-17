import { Download, AlertTriangle, Clock } from 'lucide-react'

const TYPE_COLORS = {
  cpu_spike:      { bg: 'bg-[#ff3b5c15]', text: 'text-[#ff3b5c]',  label: 'CPU Spike'      },
  memory_leak:    { bg: 'bg-[#a855f715]', text: 'text-[#a855f7]',  label: 'Memory Leak'    },
  latency_surge:  { bg: 'bg-[#ffcc0015]', text: 'text-[#ffcc00]',  label: 'Latency Surge'  },
  packet_storm:   { bg: 'bg-[#00d4ff15]', text: 'text-[#00d4ff]',  label: 'Packet Storm'   },
  bandwidth_drop: { bg: 'bg-[#ff8c0015]', text: 'text-[#ff8c00]',  label: 'Bandwidth Drop' },
  error_flood:    { bg: 'bg-[#ff3b5c15]', text: 'text-[#ff3b5c]',  label: 'Error Flood'    },
}

function SeverityBar({ score }) {
  const color = score > 80 ? '#ff3b5c' : score > 50 ? '#ffcc00' : '#ff8c00'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-[#1a2540] rounded h-1.5 overflow-hidden">
        <div className="h-full rounded" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{score.toFixed(0)}</span>
    </div>
  )
}

export default function AnomalyTable({ anomalies, onExport }) {
  return (
    <div className="cyber-panel flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-[#1a2540]">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-[#ff3b5c]" />
          <h3 className="font-display text-xs font-semibold text-[#ff3b5c] uppercase tracking-widest">Anomaly Log</h3>
          <span className="text-xs font-mono bg-[#ff3b5c20] text-[#ff3b5c] px-2 py-0.5 rounded">{anomalies.length}</span>
        </div>
        <button onClick={onExport}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-[#00d4ff] border border-[#1a2540] hover:border-[#00d4ff40] px-2.5 py-1.5 rounded transition-colors">
          <Download size={11} /> EXPORT CSV
        </button>
      </div>
      <div className="overflow-auto flex-1">
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 py-10">
            <AlertTriangle size={24} className="mb-3" />
            <p className="font-mono text-sm">No anomalies detected</p>
            <p className="font-mono text-xs mt-1 text-slate-700">System operating normally</p>
          </div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-[#0a0f1e] border-b border-[#1a2540]">
              <tr>
                {['#','TIME','NODE','TYPE','CPU%','LAT ms','SCORE'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-slate-600 uppercase tracking-wider font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a, i) => {
                const t = TYPE_COLORS[a.anomaly_type] || { bg: 'bg-[#1a254015]', text: 'text-slate-400', label: a.anomaly_type }
                return (
                  <tr key={a.id || i} className={`border-b border-[#0d1525] hover:bg-[#ffffff04] ${i === 0 ? 'anomaly-flash' : ''}`}>
                    <td className="px-3 py-2 text-slate-600">{a.id}</td>
                    <td className="px-3 py-2 text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={10} className="opacity-50" />{a.timestamp?.slice(11,19)}</span>
                    </td>
                    <td className="px-3 py-2 text-[#00d4ff]">{a.node_id}</td>
                    <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] ${t.bg} ${t.text}`}>{t.label}</span></td>
                    <td className="px-3 py-2 text-slate-300">{a.cpu_usage?.toFixed(1)}</td>
                    <td className="px-3 py-2 text-slate-300">{a.latency_ms?.toFixed(0)}</td>
                    <td className="px-3 py-2 w-28"><SeverityBar score={a.anomaly_score ?? 0} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}