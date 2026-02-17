import { Cpu, MemoryStick, Wifi, BarChart2, Zap, AlertOctagon } from 'lucide-react'
import MetricCard from '../components/MetricCard.jsx'
import NodeMap from '../components/NodeMap.jsx'
import AnomalyTable from '../components/AnomalyTable.jsx'
import ModelInfo from '../components/ModelInfo.jsx'
import { CPUMemoryChart, LatencyChart, AnomalyScoreChart } from '../components/TelemetryChart.jsx'

export default function Dashboard({ data, chartData, anomalyLog, nodeStatus }) {

  const handleExport = () => {
    fetch('/api/anomalies/export')
      .then(r => {
        if (!r.ok) return alert('No anomalies to export yet.')
        const cd = r.headers.get('Content-Disposition') || ''
        const fn = cd.split('filename=')[1] || 'anomalies.csv'
        return r.blob().then(b => {
          const url = URL.createObjectURL(b)
          const a = document.createElement('a')
          a.href = url; a.download = fn; a.click()
          URL.revokeObjectURL(url)
        })
      })
      .catch(console.error)
  }

  const metrics = [
    { label: 'CPU',       value: data?.cpu_usage,                               unit: '%',    color: data?.cpu_usage > 80       ? 'red' : 'accent', icon: Cpu,         warning: 80  },
    { label: 'Memory',    value: data?.memory_usage,                            unit: '%',    color: data?.memory_usage > 85    ? 'red' : 'purple', icon: MemoryStick, warning: 85  },
    { label: 'Latency',   value: data?.latency_ms,                              unit: 'ms',   color: data?.latency_ms > 100     ? 'red' : 'yellow', icon: Wifi,        warning: 100 },
    { label: 'Bandwidth', value: data?.bandwidth_mbps,                          unit: 'Mbps', color: data?.bandwidth_mbps < 100 ? 'red' : 'green',  icon: BarChart2               },
    { label: 'Pkt Loss',  value: data?.packet_loss_pct,                         unit: '%',    color: data?.packet_loss_pct > 5  ? 'red' : 'accent', icon: Zap,         warning: 5   },
    { label: 'Errors',    value: data?.error_rate ? data.error_rate * 100 : undefined, unit: '%', color: data?.error_rate > 0.2 ? 'red' : 'green', icon: AlertOctagon, warning: 20 },
  ]

  return (
    <div className="h-full flex flex-col gap-2 p-2 overflow-hidden">

      {/* Anomaly alert bar */}
      {data?.is_anomaly && (
        <div className="flex-shrink-0 flex items-center gap-3 bg-[#ff3b5c0a] border border-[#ff3b5c30] rounded px-3 py-1.5 animate-fadeIn">
          <div className="w-2 h-2 rounded-full bg-[#ff3b5c] animate-pulse shadow-[0_0_8px_#ff3b5c]" />
          <span className="font-mono text-xs text-[#ff3b5c] uppercase tracking-widest">
            ⚠ {data.anomaly_type?.replace('_', ' ').toUpperCase()} — {data.node_id}
          </span>
          <span className="ml-auto font-mono text-xs text-[#ff3b5c80]">Score: {data.anomaly_score?.toFixed(1)}%</span>
        </div>
      )}

      {/* ROW 1 — 6 Metric Cards */}
      <div className="flex-shrink-0 grid grid-cols-6 gap-2">
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* ROW 2 — 3 Charts */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-2">
        <CPUMemoryChart    data={chartData} />
        <LatencyChart      data={chartData} />
        <AnomalyScoreChart data={chartData} />
      </div>

      {/* ROW 3 — NodeMap + ModelInfo + AnomalyTable (fills remaining height) */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-2">
        <div className="col-span-3 min-h-0"><NodeMap nodeStatus={nodeStatus} /></div>
        <div className="col-span-3 min-h-0"><ModelInfo /></div>
        <div className="col-span-6 min-h-0 h-full"><AnomalyTable anomalies={anomalyLog} onExport={handleExport} /></div>
      </div>

    </div>
  )
}