"""
train.py — NetPulse LSTM Autoencoder Training
ROOT CAUSE OF OVERFITTING WAS: sequential train/val split on AR(1) data
causes distribution shift (val has different statistics than train).
FIX: shuffle sequences before splitting so val is representative of all data.
"""

import os, sys, numpy as np, pandas as pd, torch, torch.nn as nn, pickle
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import StandardScaler

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from data_generator import generate_training_dataset, FEATURE_NAMES
from model import LSTMAutoencoder, AnomalyDetector

SEQ_LEN     = 30
BATCH_SIZE  = 64
EPOCHS      = 80
LR          = 0.001
HIDDEN      = 128
LAYERS      = 1
MODEL_PATH  = "../models/lstm_autoencoder.pth"
SCALER_PATH = "../models/scaler.pkl"
DATA_PATH   = "../data/train_data.csv"


class TelemetryDataset(Dataset):
    def __init__(self, s): self.s = torch.FloatTensor(s)
    def __len__(self): return len(self.s)
    def __getitem__(self, i): return self.s[i]


def train():
    print("=" * 55)
    print("  NetPulse — LSTM Autoencoder Training")
    print("=" * 55)
    os.makedirs("../models", exist_ok=True)
    os.makedirs("../data",   exist_ok=True)

    if not os.path.exists(DATA_PATH):
        print("\nGenerating realistic telemetry dataset...")
        generate_training_dataset(save_path=DATA_PATH)

    print("\nLoading data...")
    df     = pd.read_csv(DATA_PATH)
    normal = df[df["is_anomaly"] == 0][FEATURE_NAMES].values
    print(f"  Normal samples : {len(normal)}")

    scaler = StandardScaler()
    scaled = scaler.fit_transform(normal)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)
    print(f"  mean={scaled.mean():.3f}  std={scaled.std():.3f}")

    # Build sequences
    seqs = np.array([scaled[i:i+SEQ_LEN] for i in range(len(scaled)-SEQ_LEN+1)])

    # ── KEY FIX: SHUFFLE before split ──
    # Without shuffle: train=first 85%, val=last 15%
    # AR(1) drift makes val have different stats = distribution shift = overfitting
    # With shuffle: val has sequences from ALL parts = representative = no overfitting
    rng = np.random.default_rng(seed=42)
    idx = rng.permutation(len(seqs))
    cut = int(len(seqs) * 0.85)
    train_seqs = seqs[idx[:cut]]
    val_seqs   = seqs[idx[cut:]]

    print(f"  Train: {len(train_seqs)}  Val: {len(val_seqs)}")
    print(f"  Train mean: {train_seqs.mean():.4f}  Val mean: {val_seqs.mean():.4f}  (should match)")

    train_loader = DataLoader(TelemetryDataset(train_seqs), BATCH_SIZE, shuffle=True,  drop_last=True)
    val_loader   = DataLoader(TelemetryDataset(val_seqs),   BATCH_SIZE, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model  = LSTMAutoencoder(len(FEATURE_NAMES), HIDDEN, LAYERS, SEQ_LEN).to(device)
    print(f"\n  Device: {device} | Params: {sum(p.numel() for p in model.parameters()):,}")
    print(f"\n  Training {EPOCHS} epochs...\n")

    opt       = torch.optim.Adam(model.parameters(), lr=LR)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(opt, EPOCHS, eta_min=1e-5)
    loss_fn   = nn.MSELoss()
    best_loss = float("inf")
    best_path = MODEL_PATH.replace(".pth", "_best.pth")

    for ep in range(1, EPOCHS+1):
        model.train()
        tl = []
        for b in train_loader:
            b = b.to(device)
            opt.zero_grad()
            l = loss_fn(model(b), b)
            l.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            tl.append(l.item())

        model.eval()
        vl = []
        with torch.no_grad():
            for b in val_loader:
                b = b.to(device)
                vl.append(loss_fn(model(b), b).item())

        t, v = np.mean(tl), np.mean(vl)
        scheduler.step()

        if ep % 10 == 0 or ep == 1:
            gap    = abs(t - v)
            status = "✓" if gap < 0.05 else "~" if gap < 0.10 else "!"
            print(f"  Epoch [{ep:3d}/{EPOCHS}] | Train: {t:.5f} | Val: {v:.5f} | Gap: {gap:.4f} {status}")

        if v < best_loss:
            best_loss = v
            torch.save(model.state_dict(), best_path)

    # Compute threshold
    print("\n  Computing threshold...")
    model.load_state_dict(torch.load(best_path, map_location=device, weights_only=True))
    model.eval()
    errs = []
    with torch.no_grad():
        for b in val_loader:
            b = b.to(device)
            errs.extend(torch.mean((b - model(b))**2, dim=(1,2)).cpu().tolist())

    errs      = np.array(errs)
    mu        = errs.mean()
    sigma     = errs.std()
    threshold = float(mu + 2.5 * sigma)

    AnomalyDetector(model, threshold, scaler).save(MODEL_PATH)

    print(f"  Error mean  : {mu:.6f}")
    print(f"  Error std   : {sigma:.6f}")
    print(f"  Threshold   : {threshold:.6f}")
    print(f"  Best val    : {best_loss:.6f}")
    print("=" * 55)
    print("  Done! Run: python main.py")
    print("=" * 55)


if __name__ == "__main__":
    train()