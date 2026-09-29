import { useState } from "react";

export default function RegistrationCard({ onRegister, error }) {
    const [name, setName] = useState("");
    const [patientId, setPatientId] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !patientId.trim()) return;
        onRegister({ name: name.trim(), patientId: patientId.trim() });
    };

    return (
        <section className="card register-card">
            <h2 className="card-title">User Registration</h2>
            <form onSubmit={handleSubmit}>
                <label className="field">
                    <span>Name</span>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        required
                    />
                </label>
                <label className="field">
                    <span>Patient ID</span>
                    <input
                        type="text"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        placeholder="Enter your Patient ID"
                        required
                    />
                </label>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn">Register</button>
            </form>
        </section>
    );
}