"""
model.py
--------
LSTM Autoencoder for unsupervised network anomaly detection.
Encoder compresses sequence → decoder reconstructs it step by step.
High reconstruction error = anomaly.
Dropout(0.3) on decoder prevents overfitting.
"""

import torch
import torch.nn as nn
import numpy as np


class LSTMAutoencoder(nn.Module):
    def __init__(self, input_size=6, hidden_size=128, num_layers=1, seq_len=30):
        super().__init__()
        self.input_size  = input_size
        self.hidden_size = hidden_size
        self.num_layers  = num_layers
        self.seq_len     = seq_len

        # Encoder: reads full input sequence, compresses to hidden state
        self.encoder_lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True
        )

        # Decoder: reconstructs sequence from hidden state step by step
        self.decoder_lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True
        )

        # Dropout to prevent overfitting (closes train/val gap)
        self.dropout = nn.Dropout(p=0.3)

        # Project hidden state back to feature space
        self.output_layer = nn.Linear(hidden_size, input_size)

    def forward(self, x):
        """
        x: (batch, seq_len, input_size)
        returns: reconstructed x of same shape
        """
        batch_size = x.size(0)

        # Encode entire sequence into hidden + cell state
        _, (hidden, cell) = self.encoder_lstm(x)

        # Decode step by step, feeding previous output as next input
        decoder_input = torch.zeros(batch_size, 1, self.input_size, device=x.device)
        h, c = hidden, cell

        outputs = []
        for _ in range(self.seq_len):
            out, (h, c) = self.decoder_lstm(decoder_input, (h, c))
            out      = self.dropout(out)
            step_out = self.output_layer(out)
            outputs.append(step_out)
            decoder_input = step_out

        return torch.cat(outputs, dim=1)

    def get_reconstruction_error(self, x):
        """Per-sample mean squared reconstruction error."""
        with torch.no_grad():
            recon = self.forward(x)
            error = torch.mean((x - recon) ** 2, dim=(1, 2))
        return error.cpu().numpy()


class AnomalyDetector:
    """
    Wrapper with adaptive threshold.
    Threshold = mean + 2.5 * std of validation reconstruction errors.
    """
    def __init__(self, model, threshold=None, scaler=None):
        self.model     = model
        self.threshold = threshold
        self.scaler    = scaler
        self.model.eval()

    def save(self, path):
        torch.save({
            "model_state": self.model.state_dict(),
            "threshold":   self.threshold,
        }, path)
        print(f"Model saved to {path}")

    @classmethod
    def load(cls, path, model, scaler=None):
        checkpoint = torch.load(path, map_location="cpu", weights_only=True)
        model.load_state_dict(checkpoint["model_state"])
        model.eval()
        detector = cls(model, threshold=checkpoint["threshold"], scaler=scaler)
        print(f"Model loaded | Threshold: {detector.threshold:.6f}")
        return detector

    def predict(self, sequence_np):
        """
        sequence_np: (seq_len, features) or (batch, seq_len, features)
        Returns dict: reconstruction_error, threshold, is_anomaly, anomaly_score
        """
        if sequence_np.ndim == 2:
            sequence_np = sequence_np[np.newaxis, ...]

        if self.scaler is not None:
            shape = sequence_np.shape
            flat  = sequence_np.reshape(-1, shape[-1])
            flat  = self.scaler.transform(flat)
            sequence_np = flat.reshape(shape)

        x      = torch.FloatTensor(sequence_np)
        errors = self.model.get_reconstruction_error(x)

        results = []
        for err in errors:
            is_anomaly = bool(err > self.threshold)
            score = float(min(err / (self.threshold + 1e-9), 3.0) / 3.0 * 100)
            results.append({
                "reconstruction_error": float(err),
                "threshold":            float(self.threshold),
                "is_anomaly":           is_anomaly,
                "anomaly_score":        round(score, 1),
            })

        return results[0] if len(results) == 1 else results