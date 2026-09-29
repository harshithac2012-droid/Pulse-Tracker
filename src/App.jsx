import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import PulseDashboard from "./components/PulseDashboard.jsx";
import RecordingStatus from "./components/RecordingStatus.jsx";
import ReadingHistory from "./components/ReadingHistory.jsx";
import {
    fetchReadings,
    startSession,
    stopSession,
    POLL_INTERVAL,
} from "./services/pulseService.js";

const FRESH_MS = 10000; // a reading newer than this counts as "received"

export default function App() {
    const [user] = useState({ name: "Patient", patientId: "PULSE-001" });
    const [recording, setRecording] = useState(false);
    const [readings, setReadings] = useState([]);
    const [busy, setBusy] = useState(false);

    // Poll the database (through the API) only while recording
    useEffect(() => {
        if (!user || !recording) return;
        let active = true;

        const load = async () => {
            try {
                const data = await fetchReadings(user.patientId);
                if (active) setReadings(data);
            } catch (err) {
                console.error(err);
            }
        };

        load();
        const timer = setInterval(load, POLL_INTERVAL);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [user, recording]);

    const handleToggle = async () => {
        setBusy(true);
        try {
            if (recording) {
                await stopSession();
                setReadings(await fetchReadings(user.patientId)); // final refresh
                setRecording(false);
            } else {
                await startSession(user);
                setRecording(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setBusy(false);
        }
    };

    const latest = readings[0] || null;
    const received = recording && latest && Date.now() - latest.timestamp < FRESH_MS;

    return (
        <div className="app">
            <Header />
            <main className="container">
                <PulseDashboard user={user} latest={latest} />
                <RecordingStatus
                    recording={recording}
                    received={Boolean(received)}
                    busy={busy}
                    onToggle={handleToggle}
                />
                <ReadingHistory readings={readings} />
            </main>
        </div>
    );
}