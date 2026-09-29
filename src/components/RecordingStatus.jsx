export default function RecordingStatus({ recording, received, busy, onToggle }) {
    let text = "Waiting for Reading";
    let dotClass = "dot-off";

    if (!recording) {
        text = "Recording Stopped";
    } else if (received) {
        text = "Reading Received";
        dotClass = "dot-on";
    }

    return (
        <section className="card status-card">
            <h2 className="card-title">Recording Status</h2>
            <div className="status-row">
                <span className={`dot ${dotClass}`} aria-hidden="true" />
                <span className="status-text">{text}</span>
                <button
                    type="button"
                    className={`btn btn-small ${recording ? "btn-outline" : ""}`}
                    onClick={onToggle}
                    disabled={busy}
                >
                    {recording ? "Stop Recording" : "Start Recording"}
                </button>
            </div>
        </section>
    );
}