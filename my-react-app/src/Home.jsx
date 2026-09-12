import { useState } from "react";
import { anmeldenMitPasswort, verifiziere2FACode } from "./services/homeService";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState("login");
  const [otpCode, setOtpCode] = useState("");
  const [factorId, setFactorId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);

    const res = await anmeldenMitPasswort(email, password);

    setLoading(false);

    if (!res.success) {
      return alert(res.error);
    }

    if (res.requiresMfa) {
      setFactorId(res.factorId);
      setStep("mfa");
    } else {
      alert("Erfolgreich eingeloggt!");
    }
  };

  const handleVerify = async () => {
    setLoading(true);

    const res = await verifiziere2FACode(factorId, otpCode);

    setLoading(false);

    if (!res.success) {
      alert(res.error);
    } else {
      alert("2FA erfolgreich!");
      // Hier z. B. Weiterleitung: navigate('/dashboard')
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            {step === "login" ? "🔐" : "🛡️"}
          </div>
          <h2 className="login-title">
            {step === "login" ? "Willkommen zurück" : "2FA-Bestätigung"}
          </h2>
          <p className="login-subtitle">
            {step === "login"
              ? "Melde dich an, um auf dein Konto zuzugreifen."
              : "Gib den 6-stelligen Code aus deiner Authenticator-App ein."}
          </p>
        </div>

        {step === "login" ? (
          <div className="login-form">
            <div className="input-group">
              <label className="input-label">E-Mail-Adresse</label>
              <input
                placeholder="name@beispiel.de"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Passwort</label>
              <input
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
            </div>

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="login-button"
            >
              {loading ? "Anmelden..." : "Einloggen"}
            </button>
          </div>
        ) : (
          <div className="login-form">
            <div className="input-group">
              <label className="input-label">Sicherheitscode</label>
              <input
                placeholder="123456"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="login-input otp-input"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="login-button"
            >
              {loading ? "Prüfen..." : "Code Bestätigen"}
            </button>

            <button
              onClick={() => setStep("login")}
              className="back-button"
            >
              ← Zurück zum Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}