import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = 'ws://localhost:8000/ws/telemetry'
const MAX_CHART_POINTS = 60
const RECONNECT_DELAY  = 3000

export function useWebSocket() {
  const [isConnected,   setIsConnected]   = useState(false)
  const [isConnecting,  setIsConnecting]  = useState(false)
  const [latestPoint,   setLatestPoint]   = useState(null)
  const [chartData,     setChartData]     = useState([])
  const [anomalyLog,    setAnomalyLog]    = useState([])
  const [stats,         setStats]         = useState({ total_points: 0, total_anomalies: 0, anomaly_rate: 0 })
  const [currentAlert,  setCurrentAlert]  = useState(null)
  const [nodeStatus,    setNodeStatus]    = useState({})

  const ws             = useRef(null)
  const reconnectTimer = useRef(null)
  const alertTimer     = useRef(null)
  const mountedRef     = useRef(true)

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return
    setIsConnecting(true)
    try {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => {
        if (!mountedRef.current) return
        setIsConnected(true)
        setIsConnecting(false)
      }

      ws.current.onmessage = (event) => {
        if (!mountedRef.current) return
        try { processMessage(JSON.parse(event.data)) }
        catch (e) { console.error('Parse error:', e) }
      }

      ws.current.onclose = () => {
        if (!mountedRef.current) return
        setIsConnected(false)
        setIsConnecting(false)
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
      }

      ws.current.onerror = () => setIsConnecting(false)

    } catch {
      setIsConnecting(false)
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
    }
  }, [])

  function processMessage(data) {
    setLatestPoint(data)
    if (data.stats) setStats(data.stats)

    if (data.node_id) {
      setNodeStatus(prev => ({
        ...prev,
        [data.node_id]: {
          id:            data.node_id,
          is_anomaly:    data.is_anomaly,
          anomaly_score: data.anomaly_score,
          cpu_usage:     data.cpu_usage,
          latency_ms:    data.latency_ms,
          lastSeen:      data.timestamp,
        }
      }))
    }

    setChartData(prev => [...prev, {
      time:          new Date(data.timestamp).toLocaleTimeString('en-US', { hour12: false }),
      cpu:           parseFloat(data.cpu_usage?.toFixed(1)       ?? 0),
      memory:        parseFloat(data.memory_usage?.toFixed(1)    ?? 0),
      latency:       parseFloat(data.latency_ms?.toFixed(1)      ?? 0),
      packet_loss:   parseFloat(data.packet_loss_pct?.toFixed(2) ?? 0),
      bandwidth:     parseFloat(data.bandwidth_mbps?.toFixed(0)  ?? 0),
      error_rate:    parseFloat((data.error_rate * 100).toFixed(3) ?? 0),
      anomaly_score: data.anomaly_score ?? 0,
      is_anomaly:    data.is_anomaly,
    }].slice(-MAX_CHART_POINTS))

    if (data.is_anomaly && data.log_entry) {
      setAnomalyLog(prev => [data.log_entry, ...prev].slice(0, 100))
      setCurrentAlert({ type: data.anomaly_type, node: data.node_id, score: data.anomaly_score, timestamp: data.timestamp })
      clearTimeout(alertTimer.current)
      alertTimer.current = setTimeout(() => setCurrentAlert(null), 5000)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      clearTimeout(alertTimer.current)
      ws.current?.close()
    }
  }, [connect])

  return { isConnected, isConnecting, latestPoint, chartData, anomalyLog, stats, currentAlert, nodeStatus }
}