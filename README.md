# 🔴 NetPulse — Real-Time Network Anomaly Detection Dashboard

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.2.2-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![WebSocket](https://img.shields.io/badge/WebSocket-Live-FF6B35?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Unsupervised deep learning system that detects network anomalies in real-time using LSTM Autoencoder reconstruction error.**

[Features](#-features) • [Architecture](#-ml-architecture) • [Quick Start](#-quick-start) • [Results](#-training-results) • [API](#-api-endpoints)

</div>

---

## 📌 Overview

NetPulse monitors **6 network metrics simultaneously** and detects anomalies the moment they occur — no labeled data required.

Traditional monitoring uses static rules *(if CPU > 90% → alert)*. This misses complex multi-feature anomalies where no single metric breaches a threshold but the **combination** of values is abnormal.

NetPulse solves this by training an **LSTM Autoencoder** exclusively on normal traffic. When anomalous data arrives, the model fails to reconstruct it accurately — producing a high reconstruction error that triggers an alert.

```
Live Data → LSTM Encoder → Latent Vector → LSTM Decoder → Reconstruction Error → Anomaly Decision
```

> If reconstruction error > threshold (μ + 2.5σ) → 🚨 Anomaly Detected

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔴 **Real-Time Streaming** | WebSocket at 500ms intervals — zero page refresh |
| 🧠 **Unsupervised ML** | LSTM Autoencoder — no labels needed |
| 📊 **6 Metrics** | CPU, Memory, Latency, Packet Loss, Bandwidth, Error Rate |
| 🚨 **6 Anomaly Types** | CPU Spike, Memory Leak, Latency Surge, Packet Storm, Bandwidth Drop, Error Flood |
| 🗺️ **Network Topology** | Live SVG map with 6 animated nodes |
| 📁 **CSV Export** | Download full anomaly log for post-incident analysis |
| ⚡ **Single Page** | No scrolling — entire dashboard visible at once |

---

## 🧠 ML Architecture

### LSTM Autoencoder (Seq2Seq)

```
Input Sequence (batch, 30, 6)
        │
        ▼
┌─────────────────┐
│  LSTM Encoder   │  128 hidden units · 1 layer
│  (reads input)  │
└────────┬────────┘
         │  hidden state (1, batch, 128)
         ▼
┌─────────────────┐
│  LSTM Decoder   │  128 hidden units · autoregressive
│  (reconstructs) │  feeds own output as next input
└────────┬────────┘
         │
         ▼
    Dropout(0.3)
         │
         ▼
   Linear(128 → 6)
         │
         ▼
Reconstructed Sequence (batch, 30, 6)
         │
         ▼
   MSE Loss = Reconstruction Error
```

### Anomaly Detection

```python
threshold = mean(val_errors) + 2.5 * std(val_errors)  # = 0.1852

if reconstruction_error > threshold:
    flag_anomaly()
```

### Why StandardScaler?

| Scaler | Variance | Baseline MSE | Model Learns? |
|---|---|---|---|
| MinMaxScaler | 0.027 | 0.022 (mean prediction) | ❌ No |
| **StandardScaler** | **1.000** | **1.000** | **✅ Yes** |

> MinMaxScaler caused the model to simply predict the mean — achieving near-zero loss without learning anything.

---

## 📁 Project Structure

```
netpulse/
├── backend/
│   ├── data_generator.py     # AR(1) synthetic telemetry + live streaming
│   ├── model.py              # LSTM Autoencoder + AnomalyDetector
│   ├── train.py              # Training pipeline
│   ├── main.py               # FastAPI server + WebSocket
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.js       # Real-time state management
│   │   ├── pages/
│   │   │   └── Dashboard.jsx         # Single-page layout
│   │   └── components/
│   │       ├── Header.jsx            # Live stats bar
│   │       ├── MetricCard.jsx        # 6 metric cards
│   │       ├── TelemetryChart.jsx    # 3 real-time area charts
│   │       ├── NodeMap.jsx           # SVG network topology
│   │       ├── AnomalyTable.jsx      # Anomaly log + CSV export
│   │       ├── AlertBanner.jsx       # Toast notifications
│   │       └── ModelInfo.jsx         # Model architecture panel
│   └── package.json
│
├── models/                   # Saved model weights (gitignored)
├── data/                     # Training data (gitignored)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

```bash
Python 3.10+
Node.js 18+
```

### 1. Clone the repository

```bash
git clone https://github.com/umarfaraz511/Real-time-network-anomaly-detection-dashboard.git
cd Real-time-network-anomaly-detection-dashboard
```

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Train the model

```bash
python train.py
```

Expected output:
```
Avg autocorrelation : 0.9342  (>0.85 = good temporal structure)
Scaled mean         : 0.0000  std: 1.0000

Epoch [  1/80] | Train: 0.84606 | Val: 0.79234 | Gap: 0.0472 ✓
Epoch [ 10/80] | Train: 0.43746 | Val: 0.41123 | Gap: 0.0262 ✓
Epoch [ 40/80] | Train: 0.17990 | Val: 0.18445 | Gap: 0.0045 ✓
Epoch [ 80/80] | Train: 0.12839 | Val: 0.13102 | Gap: 0.0026 ✓

Threshold : 0.185185
```

### 4. Start the backend

```bash
python main.py
# FastAPI running on http://localhost:8000
```

### 5. Install and start the frontend

```bash
cd ../frontend
npm install
npm run dev
# React running on http://localhost:5173
```

### 6. Open the dashboard

```
http://localhost:5173
```

---

## 📊 Training Results

| Metric | Value |
|---|---|
| Best Validation Loss | 0.1234 |
| Error Mean (μ) | 0.1233 |
| Error Std (σ) | 0.0247 |
| **Threshold (μ + 2.5σ)** | **0.1852** |
| Train / Val Gap | < 0.05 ✅ |
| Anomaly Separation | ~5.6× threshold |
| Avg Autocorrelation | 0.9342 |
| Total Parameters | 140,038 |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `WS` | `/ws/telemetry` | Live telemetry WebSocket stream |
| `GET` | `/api/status` | Server health and model status |
| `GET` | `/api/anomalies` | Last 50 detected anomalies |
| `GET` | `/api/anomalies/export` | Download anomaly log as CSV |
| `GET` | `/api/model/info` | Model architecture and threshold |
| `GET` | `/docs` | Swagger interactive API docs |

---

## 🔍 Anomaly Types

| Type | Feature | Normal | Anomaly |
|---|---|---|---|
| CPU Spike | `cpu_usage` | 45 ± 10 % | 85 ± 8 % |
| Memory Leak | `memory_usage` | 60 ± 8 % | 88 ± 5 % |
| Latency Surge | `latency_ms` | 20 ± 5 ms | 180 ± 40 ms |
| Packet Storm | `packet_loss_pct` | 0.4 ± 0.3 % | 18 ± 6 % |
| Bandwidth Drop | `bandwidth_mbps` | 500 ± 80 Mbps | 40 ± 20 Mbps |
| Error Flood | `error_rate` | 0.018 ± 0.01 | 0.45 ± 0.10 |

---

## ⚙️ Tech Stack

**Backend**
- Python 3.10+
- PyTorch 2.2.2 — LSTM Autoencoder
- FastAPI + Uvicorn — REST API and WebSocket server
- scikit-learn — StandardScaler
- NumPy + Pandas — Data generation

**Frontend**
- React 18 + Vite
- Recharts — Real-time animated area charts
- TailwindCSS v4 — Cyberpunk dark UI
- Lucide React — Icons

---

## 🧩 Key Engineering Challenges Solved

<details>
<summary><b>Bug #1 — Entangled Encoder/Decoder Tensors</b></summary>

**Problem:** The decoder reused `self.fc` for both LSTM hidden state and decoder input — feeding identical tensors making learning impossible. Loss stuck at 0.022 from epoch 1.

**Fix:** Redesigned as proper autoregressive seq2seq. Encoder hidden/cell state initializes decoder. Decoder feeds its own output as the next timestep input.
</details>

<details>
<summary><b>Bug #2 — MinMaxScaler Mean-Learning Trap</b></summary>

**Problem:** MinMaxScaler produced variance of 0.027. Predicting the constant mean achieved MSE = 0.022. Model never learned despite 100 epochs.

**Fix:** Replaced with StandardScaler (zero mean, unit variance). Anomalies now score 152× higher than normal data.
</details>

<details>
<summary><b>Bug #3 — Distribution Shift from Sequential Split</b></summary>

**Problem:** AR(1) data drifts over time. Sequential split gave validation a different distribution — causing overfitting (train 0.15, val 0.44, gap 0.29).

**Fix:** Shuffled all sliding-window sequences before splitting. Gap reduced from 0.29 to < 0.05.
</details>

<details>
<summary><b>Bug #4 — White Noise Data (Autocorrelation ≈ 0)</b></summary>

**Problem:** Original generator used `np.random.normal()` — pure white noise. LSTMs learn temporal dependencies and cannot learn from i.i.d. noise.

**Fix:** Replaced with AR(1) autoregressive process. Autocorrelation: 0.85–0.99 across all features.
</details>

---

## 🎓 Thesis Connection

This project extends research from a **Master's thesis on Generative AI for Predictive Maintenance**. The core principle — training an autoencoder on normal data and using reconstruction error as the anomaly signal — is the same approach applied with GANs and VAEs in industrial IoT systems.

NetPulse demonstrates this principle in a network monitoring context with a complete production-ready real-time pipeline.

---

## 👤 Author

**Umar Faraz**
ML Engineer


---
<img width="956" height="447" alt="net 1" src="https://github.com/user-attachments/assets/b0a5c1ff-e236-49e6-acbb-835fa151c5ff" />

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
Built with PyTorch · FastAPI · React · WebSocket
<br/>
⭐ Star this repo if you found it useful!
</div>
