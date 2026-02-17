"""
main.py
-------
FastAPI backend — WebSocket streaming + REST API endpoints.
"""

import os
import sys
import asyncio
import json
import pickle
import io
import csv
from datetime import datetime
from collections import deque

import numpy as np
import torch
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from data_generator import get_live_sample, FEATURE_NAMES
from model import LSTMAutoencoder, AnomalyDetector

# ──────── CONFIG ────────
MODEL_PATH  = "../models/lstm_autoencoder.pth"
SCALER_PATH = "../models/scaler.pkl"
SEQ_LEN     = 30
STREAM_HZ   = 0.5
MAX_HISTORY = 500
# ────────────────────────

app = FastAPI(title="NetPulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
detector          = None
scaler            = None
sequence_buffer   = deque(maxlen=SEQ_LEN)
anomaly_log       = deque(maxlen=MAX_HISTORY)
connected_clients = []
stats = {
    "total_points":    0,
    "total_anomalies": 0,
    "model_loaded":    False
}


@app.on_event("startup")
async def startup_event():
    global detector, scaler, stats

    print("NetPulse API starting...")

    # Load scaler
    if os.path.exists(SCALER_PATH):
        with open(SCALER_PATH, "rb") as f:
            scaler = pickle.load(f)
        print("Scaler loaded")
    else:
        print("Scaler not found — run train.py first")

    # Load model
    if os.path.exists(MODEL_PATH):
        model = LSTMAutoencoder(
            input_size=len(FEATURE_NAMES),
            hidden_size=128,
            num_layers=1,
            seq_len=SEQ_LEN
        )
        detector = AnomalyDetector.load(MODEL_PATH, model, scaler=scaler)
        stats["model_loaded"] = True
        print("Anomaly detector ready")
    else:
        print("Model not found — run train.py first")

    # Warm up buffer with normal samples
    for _ in range(SEQ_LEN):
        sample = get_live_sample(force_anomaly=False)
        sequence_buffer.append([sample[f] for f in FEATURE_NAMES])


def _score_sample(raw_sample):
    """Run LSTM anomaly detection on current sequence buffer."""
    features = [raw_sample[f] for f in FEATURE_NAMES]
    sequence_buffer.append(features)

    result = {
        "is_anomaly":           raw_sample["is_anomaly"],
        "anomaly_score":        0.0,
        "reconstruction_error": 0.0,
        "threshold":            0.0,
    }

    if detector and len(sequence_buffer) == SEQ_LEN:
        seq_np    = np.array(list(sequence_buffer))
        detection = detector.predict(seq_np)
        result.update(detection)
        result["is_anomaly"] = detection["is_anomaly"]

    return result


@app.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    print(f"Client connected | Total: {len(connected_clients)}")

    try:
        while True:
            raw    = get_live_sample()
            scores = _score_sample(raw)
            payload = {**raw, **scores}
            stats["total_points"] += 1

            if scores["is_anomaly"]:
                stats["total_anomalies"] += 1
                log_entry = {
                    "id":                   stats["total_anomalies"],
                    "timestamp":            raw["timestamp"],
                    "node_id":              raw["node_id"],
                    "anomaly_type":         raw["anomaly_type"],
                    "anomaly_score":        round(scores["anomaly_score"], 1),
                    "reconstruction_error": round(scores["reconstruction_error"], 6),
                    "cpu_usage":            round(raw["cpu_usage"], 1),
                    "latency_ms":           round(raw["latency_ms"], 1),
                    "packet_loss_pct":      round(raw["packet_loss_pct"], 2),
                }
                anomaly_log.append(log_entry)
                payload["log_entry"] = log_entry

            payload["stats"] = {
                "total_points":    stats["total_points"],
                "total_anomalies": stats["total_anomalies"],
                "anomaly_rate":    round(
                    stats["total_anomalies"] / max(stats["total_points"], 1) * 100, 2
                ),
            }

            await websocket.send_text(json.dumps(payload, default=str))
            await asyncio.sleep(STREAM_HZ)

    except WebSocketDisconnect:
        connected_clients.remove(websocket)
        print(f"Client disconnected | Total: {len(connected_clients)}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in connected_clients:
            connected_clients.remove(websocket)


@app.get("/api/status")
async def get_status():
    return {
        "status":            "online",
        "model_loaded":      stats["model_loaded"],
        "threshold":         float(detector.threshold) if detector else None,
        "connected_clients": len(connected_clients),
        "stats":             stats,
        "features":          FEATURE_NAMES,
        "seq_len":           SEQ_LEN,
    }


@app.get("/api/anomalies")
async def get_anomalies(limit: int = 50):
    log = list(anomaly_log)[-limit:]
    return {"anomalies": list(reversed(log)), "total": len(anomaly_log)}


@app.get("/api/anomalies/export")
async def export_anomalies():
    log = list(anomaly_log)
    if not log:
        return JSONResponse({"message": "No anomalies recorded yet"}, status_code=404)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=log[0].keys())
    writer.writeheader()
    writer.writerows(log)
    output.seek(0)

    filename = f"netpulse_anomalies_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/model/info")
async def get_model_info():
    return {
        "architecture":     "LSTM Autoencoder (Seq2Seq)",
        "input_features":   FEATURE_NAMES,
        "input_size":       len(FEATURE_NAMES),
        "hidden_size":      128,
        "num_layers":       1,
        "dropout":          0.3,
        "seq_len":          SEQ_LEN,
        "threshold":        float(detector.threshold) if detector else None,
        "detection_method": "Reconstruction Error > mean + 2.5 * std",
    }


@app.get("/")
async def root():
    return {"message": "NetPulse API is running", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, log_level="info")