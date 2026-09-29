// Talks to the PulseTrack backend (server/index.js) through the Vite proxy.

export const POLL_INTERVAL = 2000; // ms between checks for new readings

async function request(path, options) {
    const res = await fetch(`/api${path}`, options);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
}

export function startSession(user) {
    return request("/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
    });
}

export function stopSession() {
    return request("/session/stop", { method: "POST" });
}

export function fetchReadings(patientId) {
    return request(`/readings?patientId=${encodeURIComponent(patientId)}`);
}