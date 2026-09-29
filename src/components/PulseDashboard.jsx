import { formatTime } from "../utils/format.js";

export default function PulseDashboard({ user, latest }) {
    return (
        <section className="card dashboard">
            <div className="user-row">
                <div>
                    <p className="label">Name</p>
                    <p className="value">{user.name}</p>
                </div>
                <div>
                    <p className="label">Patient ID</p>
                    <p className="value">{user.patientId}</p>
                </div>
            </div>

            <div className="bpm-block">
                <span className="heart" aria-hidden="true">❤️</span>
                <div className="bpm-number">{latest ? latest.bpm : "--"}</div>
                <div className="bpm-unit">BPM</div>
            </div>

            <p className="latest">
                Latest Reading: <strong>{latest ? formatTime(latest.timestamp) : "--"}</strong>
            </p>
        </section>
    );
}