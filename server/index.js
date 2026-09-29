// PulseTrack backend
// ESP32 + MAX30102 --(USB serial)--> this server --> SQLite database --> REST API --> website

import express from "express";
import Database from "better-sqlite3";
import { SerialPort, ReadlineParser } from "serialport";

const HTTP_PORT = 3001;
const SERIAL_PATH = process.env.SERIAL_PORT || "COM3"; // change to your ESP32 port
const BAUD_RATE = 115200;
const SIMULATE = process.env.SIMULATE === "1";          // fake readings, no hardware needed

// ---------- Database ----------
const db = new Database("pulsetrack.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    patient_id TEXT PRIMARY KEY,
    name       TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS readings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT    NOT NULL,
    bpm        INTEGER NOT NULL,
    timestamp  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_readings_patient ON readings (patient_id, timestamp DESC);
`);

const upsertPatient = db.prepare(
    "INSERT INTO patients (patient_id, name) VALUES (?, ?) ON CONFLICT(patient_id) DO UPDATE SET name = excluded.name"
);
const insertReading = db.prepare(
    "INSERT INTO readings (patient_id, bpm, timestamp) VALUES (?, ?, ?)"
);
const selectReadings = db.prepare(
    "SELECT id, bpm, timestamp FROM readings WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 20"
);

// ---------- Session (who is being monitored, and is recording on?) ----------
const session = { patientId: null, recording: false };

function saveReading(bpm) {
    if (!session.recording || !session.patientId) return; // ignored while stopped
    insertReading.run(session.patientId, bpm, Date.now());
    console.log(`Saved ${bpm} BPM for ${session.patientId}`);
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function createIrToBpmConverter() {
    const samples = [];
    let lastPeakMs = 0;
    let lastBpm = 72;

    return (rawValue) => {
        const value = Number(rawValue);
        if (!Number.isFinite(value)) return null;

        const now = Date.now();
        samples.push({ time: now, value });

        while (samples.length > 0 && now - samples[0].time > 15000) {
            samples.shift();
        }

        if (samples.length < 6) return lastBpm;

        const avg = samples.reduce((sum, sample) => sum + sample.value, 0) / samples.length;
        const min = Math.min(...samples.map((sample) => sample.value));
        const max = Math.max(...samples.map((sample) => sample.value));
        const amplitude = Math.max(max - avg, 1);
        const threshold = avg + amplitude * 0.35;

        const prev = samples[samples.length - 2];
        const current = samples[samples.length - 1];

        if (prev && current && prev.value < threshold && current.value >= threshold) {
            const delta = now - lastPeakMs;
            if (lastPeakMs !== 0 && delta > 300 && delta < 2000) {
                const bpm = 60000 / delta;
                lastBpm = clamp(Math.round(bpm), 35, 220);
            }
            lastPeakMs = now;
        }

        return lastBpm;
    };
}

const irToBpm = createIrToBpmConverter();

function convertIrToBpm(rawValue) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return null;

    if (value >= 30 && value <= 220) {
        return Math.round(value);
    }

    if (value > 220) {
        return irToBpm(value);
    }

    return null;
}

// ---------- Hardware input ----------
function startSerial() {
    const port = new SerialPort({ path: SERIAL_PATH, baudRate: BAUD_RATE }, (err) => {
        if (err) {
            console.error(`Could not open ${SERIAL_PATH}: ${err.message}`);
            SerialPort.list().then((ports) => {
                console.log("Available ports:", ports.map((p) => p.path).join(", ") || "none found");
                console.log("Set the right one, e.g.  set SERIAL_PORT=COM5  (Windows)");
            });
        } else {
            console.log(`Listening to ESP32 on ${SERIAL_PATH}`);
        }
    });
    port.on("error", (e) => console.error("Serial error:", e.message));

    const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
    parser.on("data", (line) => {
        const text = line.trim();
        if (!text) return;

        const match = text.match(/-?\d+(?:\.\d+)?/);
        if (!match) {
            console.log("[device]", text);
            return;
        }

        const value = Number(match[0]);
        const bpm = convertIrToBpm(value);

        if (bpm !== null) {
            saveReading(bpm);
        } else {
            console.log("[device] raw IR value ignored:", value);
        }
    });
}

function startSimulator() {
    console.log("SIMULATE mode: generating fake readings every 2 seconds");
    let bpm = 76;
    setInterval(() => {
        bpm = Math.min(95, Math.max(62, bpm + Math.round((Math.random() - 0.5) * 6)));
        saveReading(bpm);
    }, 2000);
}

// ---------- API ----------
const app = express();
app.use(express.json());

app.post("/api/session/start", (req, res) => {
    const name = String(req.body?.name || "").trim();
    const patientId = String(req.body?.patientId || "").trim();
    if (!name || !patientId) return res.status(400).json({ error: "name and patientId are required" });

    upsertPatient.run(patientId, name);
    session.patientId = patientId;
    session.recording = true;
    res.json({ recording: true });
});

app.post("/api/session/stop", (_req, res) => {
    session.recording = false;
    res.json({ recording: false });
});

app.get("/api/readings", (req, res) => {
    const patientId = String(req.query.patientId || "");
    res.json(selectReadings.all(patientId));
});

app.listen(HTTP_PORT, () => console.log(`API running on http://localhost:${HTTP_PORT}`));

if (SIMULATE) startSimulator();
else startSerial();