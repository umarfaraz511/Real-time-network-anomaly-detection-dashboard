import { Brain, Layers, Sliders, Target } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ModelInfo() {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    fetch('/api/model/info').then(r => r.json()).then(setInfo).catch(() => {})
  }, [])

  const layers = [
    { layer: 'Input',        detail: '6 features × 30 steps', color: '#00d4ff' },
    { layer: 'LSTM Encoder', detail: '128 units, 1 layer',     color: '#a855f7' },
    { layer: 'Hidden State', detail: 'Compressed repr.',       color: '#ffcc00' },
    { layer: 'LSTM Decoder', detail: '128 units, 1 layer',     color: '#a855f7' },
    { layer: 'Output',       detail: 'Reconstruction (6 feat)',color: '#00ff88' },
  ]

  return (
    <div className="cyber-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={14} className="text-[#a855f7]" />
        <h3 className="font-display text-xs font-semibold text-[#a855f7] uppercase tracking-widest">Model Architecture</h3>
      </div>
      <div className="space-y-1.5 mb-4">
        {layers.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: a.color, opacity: 0.6 }} />
            <div>
              <div className="text-xs font-mono font-semibold text-white">{a.layer}</div>
              <div className="text-[10px] font-mono text-slate-500">{a.detail}</div>
            </div>
            {i < layers.length - 1 && <div className="ml-auto text-slate-700 text-xs">↓</div>}
          </div>
        ))}
      </div>
      <div className="border-t border-[#1a2540] pt-3 grid grid-cols-2 gap-2">
        {[
          { icon: Target,  label: 'Threshold', value: info?.threshold ? info.threshold.toFixed(4) : '...', color: '#ff3b5c' },
          { icon: Layers,  label: 'Seq Len',   value: '30 steps',     color: '#00d4ff' },
          { icon: Sliders, label: 'Dropout',   value: '0.3',          color: '#ffcc00' },
          { icon: Brain,   label: 'Type',      value: 'Autoencoder',  color: '#a855f7' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-[#ffffff04] border border-[#1a2540] rounded p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Icon size={9} style={{ color }} />
              <span className="text-[9px] font-mono text-slate-600 uppercase">{label}</span>
            </div>
            <div className="text-xs font-mono font-semibold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}