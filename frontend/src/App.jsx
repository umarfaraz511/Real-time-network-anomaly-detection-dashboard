import { useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AlertBanner from './components/AlertBanner.jsx'
import { useWebSocket } from './hooks/useWebSocket.js'

export default function App() {
  const {
    isConnected, isConnecting, latestPoint,
    chartData, anomalyLog, stats, currentAlert, nodeStatus
  } = useWebSocket()

  const [dismissed, setDismissed] = useState(false)

  if (!isConnected && !isConnecting && chartData.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-[#050810]">
        <Header isConnected={false} isConnecting={false} stats={stats} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#ff3b5c10] border border-[#ff3b5c30] flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#ff3b5c20] border border-[#ff3b5c] animate-pulse" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Backend Offline</h2>
            <p className="font-mono text-sm text-slate-500 mb-6">Start the FastAPI server to begin streaming</p>
            <div className="bg-[#0a0f1e] border border-[#1a2540] rounded-lg p-4 text-left inline-block">
              <p className="text-[#00d4ff] font-mono text-xs mb-1"># Terminal 1 — Backend</p>
              <p className="font-mono text-sm text-white">cd backend && python main.py</p>
              <p className="text-[#00d4ff] font-mono text-xs mt-3 mb-1"># Terminal 2 — Frontend</p>
              <p className="font-mono text-sm text-white">cd frontend && npm run dev</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050810]">
      <Header isConnected={isConnected} isConnecting={isConnecting} stats={stats} />
      <main className="flex-1 min-h-0 overflow-hidden">
        <Dashboard
          data={latestPoint}
          chartData={chartData}
          anomalyLog={anomalyLog}
          nodeStatus={nodeStatus}
        />
      </main>
      <AlertBanner
        alert={dismissed ? null : currentAlert}
        onDismiss={() => setDismissed(true)}
      />
    </div>
  )
}