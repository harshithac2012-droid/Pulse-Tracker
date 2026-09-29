import { formatDate, formatTime } from "../utils/format.js";

export default function ReadingHistory({ readings }) {
    return (
        <section className="card">
            <h2 className="card-title">Reading History</h2>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>BPM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {readings.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="empty">No readings yet</td>
                            </tr>
                        ) : (
                            readings.map((r) => (
                                <tr key={r.id}>
                                    <td>{formatDate(r.timestamp)}</td>
                                    <td>{formatTime(r.timestamp)}</td>
                                    <td className="bpm-cell">{r.bpm}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}