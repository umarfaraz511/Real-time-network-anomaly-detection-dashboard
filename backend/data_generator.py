"""
data_generator.py
-----------------
Realistic synthetic network telemetry using AR(1) autoregressive process.
Each value depends on previous value — smooth, correlated, LSTM-learnable.
Old approach (pure random noise) had autocorrelation ~0 = unlearnable.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

FEATURE_NAMES = [
    "cpu_usage",
    "memory_usage",
    "latency_ms",
    "packet_loss_pct",
    "bandwidth_mbps",
    "error_rate",
]

ANOMALY_TYPES = {
    "cpu_spike":      {"cpu_usage":       (85.0, 8.0)},
    "memory_leak":    {"memory_usage":    (88.0, 5.0)},
    "latency_surge":  {"latency_ms":      (180.0, 40.0)},
    "packet_storm":   {"packet_loss_pct": (18.0,  6.0)},
    "bandwidth_drop": {"bandwidth_mbps":  (40.0,  20.0)},
    "error_flood":    {"error_rate":      (0.45,  0.1)},
}


def _ar1(n, mu, sigma, phi=0.95, seed=None):
    """
    AR(1) autoregressive process.
    x[t] = mu + phi*(x[t-1] - mu) + noise
    phi near 1.0 = smooth temporal correlation = LSTM can learn this
    phi = 0.0    = pure white noise            = LSTM learns nothing
    """
    if seed is not None:
        np.random.seed(seed)
    x    = np.zeros(n)
    x[0] = mu
    for t in range(1, n):
        x[t] = mu + phi * (x[t-1] - mu) + np.random.normal(0, sigma * np.sqrt(1 - phi**2))
    return x


def generate_correlated_normal(n=5000, seed=42):
    """
    Generate n timesteps of smooth correlated normal network traffic.
    Features are temporally smooth AND cross-correlated like real networks.
    """
    np.random.seed(seed)
    t = np.arange(n)

    # Daily business-hours cycle (peak at midday)
    cycle_cpu = 10 * np.sin(2 * np.pi * t / 288)

    # CPU: business-hours cycle + AR(1) noise
    cpu_base = _ar1(n, mu=0, sigma=3.0, phi=0.97) + cycle_cpu
    cpu      = np.clip(45.0 + cpu_base, 5.0, 95.0)

    # Memory: slow drift correlated with CPU
    mem_drift = _ar1(n, mu=0, sigma=1.5, phi=0.99)
    memory    = np.clip(60.0 + mem_drift + 0.15 * cpu_base, 15.0, 95.0)

    # Latency: follows CPU load
    lat_noise = _ar1(n, mu=0, sigma=1.5, phi=0.90)
    latency   = np.clip(18.0 + 0.12 * cpu_base + lat_noise, 1.0, 150.0)

    # Packet loss: near zero with smooth variation
    pkt_base = _ar1(n, mu=0, sigma=0.08, phi=0.85)
    pkt_loss = np.clip(0.4 + pkt_base, 0.0, 5.0)

    # Bandwidth: inversely correlated with CPU
    bw_noise  = _ar1(n, mu=0, sigma=15.0, phi=0.96)
    bandwidth = np.clip(500.0 - 0.5 * cpu_base + bw_noise, 50.0, 1000.0)

    # Error rate: very low normally
    err_noise  = _ar1(n, mu=0, sigma=0.003, phi=0.88)
    error_rate = np.clip(0.018 + 0.005 * pkt_base + err_noise, 0.0, 0.5)

    return np.column_stack([cpu, memory, latency, pkt_loss, bandwidth, error_rate])


def generate_training_dataset(n_normal=5000, n_anomaly=300, save_path="../data/train_data.csv"):
    """Full training dataset: smooth normal traffic + injected anomalies."""
    records   = []
    base_time = datetime(2024, 1, 1)

    # Normal samples
    normal_data = generate_correlated_normal(n=n_normal, seed=42)
    for i in range(n_normal):
        s = {f: float(normal_data[i, j]) for j, f in enumerate(FEATURE_NAMES)}
        s["timestamp"]    = (base_time + timedelta(minutes=5 * i)).isoformat()
        s["is_anomaly"]   = 0
        s["anomaly_type"] = "normal"
        records.append(s)

    # Anomaly samples (spike injected on smooth background)
    anomaly_base = generate_correlated_normal(n=n_anomaly, seed=99)
    for i in range(n_anomaly):
        s     = {f: float(anomaly_base[i, j]) for j, f in enumerate(FEATURE_NAMES)}
        atype = np.random.choice(list(ANOMALY_TYPES.keys()))
        for feat, (mu, sigma) in ANOMALY_TYPES[atype].items():
            s[feat] = float(np.clip(np.random.normal(mu, sigma), 0, None))
        s["timestamp"]    = (base_time + timedelta(days=40, minutes=5 * i)).isoformat()
        s["is_anomaly"]   = 1
        s["anomaly_type"] = atype
        records.append(s)

    df = pd.DataFrame(records)
    df.to_csv(save_path, index=False)
    print(f"Generated {len(df)} samples ({n_normal} normal + {n_anomaly} anomaly) → {save_path}")
    return df


# ── Live streaming state for WebSocket ──
_live_state = None


def _init_live_state():
    global _live_state
    _live_state = {
        "cpu": 45.0, "memory": 60.0, "latency": 20.0,
        "pkt_loss": 0.4, "bandwidth": 500.0, "error": 0.018, "tick": 0,
    }


def get_live_sample(force_anomaly=False):
    """One live telemetry point via AR(1) — called every 500ms by WebSocket."""
    global _live_state
    if _live_state is None:
        _init_live_state()

    s    = _live_state
    tick = s["tick"]
    phi  = 0.95

    # Daily cycle
    cycle = 8.0 * np.sin(2 * np.pi * tick / 1440)

    # AR(1) update each feature
    s["cpu"]       = float(np.clip(s["cpu"]       * phi + 45.0  * (1-phi) + cycle * (1-phi) + np.random.normal(0, 1.2), 5,    95))
    s["memory"]    = float(np.clip(s["memory"]    * phi + 60.0  * (1-phi) + np.random.normal(0, 0.8),                   15,   95))
    s["latency"]   = float(np.clip(s["latency"]   * phi + 20.0  * (1-phi) + 0.05 * (s["cpu"] - 45) + np.random.normal(0, 0.8), 1, 100))
    s["pkt_loss"]  = float(np.clip(s["pkt_loss"]  * 0.90 + 0.4  * 0.10   + np.random.normal(0, 0.04),                  0,    5))
    s["bandwidth"] = float(np.clip(s["bandwidth"] * phi + 500.0 * (1-phi) - 0.3 * (s["cpu"] - 45) + np.random.normal(0, 8),  50, 1000))
    s["error"]     = float(np.clip(s["error"]     * 0.88 + 0.018 * 0.12  + np.random.normal(0, 0.001),                 0,    0.3))
    s["tick"]     += 1

    is_anomaly = force_anomaly or (np.random.random() < 0.08)
    node_id    = f"NODE-{(tick % 6) + 1:02d}"
    atype      = "normal"

    sample = {
        "cpu_usage":       s["cpu"],
        "memory_usage":    s["memory"],
        "latency_ms":      s["latency"],
        "packet_loss_pct": s["pkt_loss"],
        "bandwidth_mbps":  s["bandwidth"],
        "error_rate":      s["error"],
    }

    if is_anomaly:
        atype = np.random.choice(list(ANOMALY_TYPES.keys()))
        for feat, (mu, sigma) in ANOMALY_TYPES[atype].items():
            sample[feat] = float(np.clip(np.random.normal(mu, sigma), 0, None))

    sample["is_anomaly"]   = is_anomaly
    sample["anomaly_type"] = atype
    sample["severity"]     = _compute_severity(sample) if is_anomaly else 0.0
    sample["timestamp"]    = datetime.utcnow().isoformat()
    sample["node_id"]      = node_id
    return sample


def _compute_severity(sample):
    normal_stats = {
        "cpu_usage":       (45.0, 10.0),
        "memory_usage":    (60.0,  8.0),
        "latency_ms":      (20.0,  5.0),
        "packet_loss_pct": (0.4,   0.3),
        "bandwidth_mbps":  (500.0, 80.0),
        "error_rate":      (0.018, 0.01),
    }
    scores = []
    for feat, (mu, sigma) in normal_stats.items():
        if feat in sample:
            z = abs(sample[feat] - mu) / (sigma + 1e-8)
            scores.append(min(z / 5.0, 1.0))
    return round(float(np.mean(scores)) * 100, 1) if scores else 0.0


if __name__ == "__main__":
    import os
    os.makedirs("../data", exist_ok=True)
    generate_training_dataset()