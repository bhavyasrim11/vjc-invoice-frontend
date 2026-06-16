import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ── SVG Illustration (lady with laptop + floating icons) ──────────────────────
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 340 300"
      xmlns="http://www.w3.org/2000/svg"
      className="hero-svg"
    >
      {/* outer circles */}
      <circle cx="170" cy="145" r="85"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
      />

      <circle cx="170" cy="145" r="55"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />

      {/* network lines */}
      <line x1="170" y1="145" x2="80" y2="70"
        stroke="white"
        strokeOpacity="0.4"
      />

      <line x1="170" y1="145" x2="260" y2="70"
        stroke="white"
        strokeOpacity="0.4"
      />

      <line x1="170" y1="145" x2="80" y2="220"
        stroke="white"
        strokeOpacity="0.4"
      />

      <line x1="170" y1="145" x2="260" y2="220"
        stroke="white"
        strokeOpacity="0.4"
      />

      {/* nodes */}
      {[80,260].map((x,i)=>(
        <circle
          key={i}
          cx={x}
          cy="70"
          r="16"
          fill="rgba(255,255,255,0.25)"
        />
      ))}

      {[80,260].map((x,i)=>(
        <circle
          key={i}
          cx={x}
          cy="220"
          r="16"
          fill="rgba(255,255,255,0.25)"
        />
      ))}

      {/* center */}
      <circle
        cx="170"
        cy="145"
        r="28"
        fill="rgba(255,255,255,0.30)"
      />

      {/* chart bars */}
      <rect x="157" y="132" width="6" height="22" rx="2" fill="white" />
      <rect x="168" y="122" width="6" height="32" rx="2" fill="white" />
      <rect x="179" y="112" width="6" height="42" rx="2" fill="white" />
    </svg>
  );
}
export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
     const res = await axios.post(
  "http://localhost:5000/api/auth/login",
  {
    email,
    password,
  }
);

localStorage.setItem("vjc_invoice_auth", res.data.token);

if (remember)
  localStorage.setItem("rememberedEmail", email);

navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
      {/* ── LEFT PANEL ── */}
      <div className="left-panel">
        <HeroIllustration />
        <h2 className="left-heading">
    Business Invoicing Platform
  </h2>


        <div className="features">
          {[
  {
    icon: "✓",
    title: "Invoice Creation",
    desc: "Generate professional invoices in seconds."
  },
  {
    icon: "✓",
    title: "Payment Tracking",
    desc: "Monitor paid, pending and overdue invoices."
  },
  {
    icon: "✓",
    title: "Customer Management",
    desc: "Manage customer records and billing history."
  }
].map((f, i) => (
            <div className="feature-item" key={i}>
              <span className="feature-check">{f.icon}</span>
              <div>
                <p className="feature-title">{f.title}</p>
                <p className="feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="right-panel">
        <div className="form-card">
          {/* Logo */}
       <div className="brand-header">
  <img
    src="/vjc-logo.png"
    alt="VJC Logo"
    className="company-logo"
  />
</div>

<h1 className="brand-title">
  VJC INVOICE
</h1>

          <p className="brand-tagline">
            Create invoices, track payments and manage<br/>
            <em>customers from a single platform.</em>
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="field-group">
             <input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={e => setEmail(e.target.value)}
  required
  className="input-field"
/>
            </div>

            <div className="field-group pw-wrap">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input-field"
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(p => !p)}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="form-row">
              <label className="remember-label">
                <input type="checkbox" checked={remember}
                       onChange={e => setRemember(e.target.checked)}/>
                <span>Remember Me</span>
              </label>
              <a href="#" className="forgot-link">Forgot your password?</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in…" : "LOGIN 🔒"}
            </button>
          </form>

          <p className="footer-note">VJC Overseas Immigration &amp; Visa Consultants</p>
        </div>
      </div>
      </div>{/* login-card */}

      <style>{`
        .login-root {
          display: flex;
          min-height: 100vh;
          background: #f0f0f0;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', sans-serif;
          padding: 24px;
        }

        .login-card {
          display: flex;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.15);
          max-width: 800px;
          width: 100%;
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          background: linear-gradient(
  135deg,
  #38bdf8,
  #2563eb,
  #1d4ed8
);
          width: 380px;
          min-height: 580px;
          padding: 32px 28px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }

        .hero-svg {
          width: 100%;
          max-width: 300px;
          margin-bottom: 16px;
        }
          .left-heading {
  color: white;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
}

        .features {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .feature-check {
  color: white;
  font-size: 20px;
}
          font-weight: 900;
          font-size: 18px;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .feature-title {
          color: white;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .feature-desc {
          color: rgba(255,255,255,0.82);
          font-size: 12.5px;
          line-height: 1.4;
        }

        /* ── RIGHT PANEL ── */
        .right-panel {
          background: #fafafa;
          flex: 1;
          min-height: 580px;
          padding: 40px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .form-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .logo-wrap {
          position: relative;
          width: 90px;
          height: 90px;
          margin-bottom: 14px;
        }

        .logo-wrap img {
          width: 90px;
          height: 90px;
          object-fit: contain;
        }

        .logo-fallback {
          position: absolute;
          inset: 0;
          background: linear-gradient(
  135deg,
  #2563eb,
  #1d4ed8
);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rupee-icon {
          color: white;
          font-size: 36px;
          font-weight: 800;
        }
         .brand-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
}

.company-logo {
  width: 300px;
  height: 120px;
  object-fit: contain;
  transform: scale(2);
}

.brand-title {
  font-size: 22px;
  font-weight: 900;
  color: #1a3a5c;
  letter-spacing: 1.5px;
  text-align: center;
  
  margin-bottom: 8px;
}
        .brand-tagline {
          font-size: 13px;
          color: #666;
          text-align: center;
          font-style: italic;
          line-height: 1.5;
          margin-bottom: 28px;
        }

        .brand-tagline em {
          font-style: italic;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .field-group {
          position: relative;
        }

        .input-field {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          outline: none;
          transition: border-color 0.2s;
          color: #333;
        }

        .input-field:focus {
          border-color: #2563eb;
        }

        .pw-wrap .input-field {
          padding-right: 44px;
        }

        .pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          opacity: 0.6;
        }

        .error-msg {
          color: #CC0000;
          font-size: 13px;
          text-align: center;
        }

        .form-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #555;
          cursor: pointer;
        }

        .remember-label input[type="checkbox"] {
          accaccent-color: #2563eb;
          width: 14px;
          height: 14px;
        }

        .forgot-link {
          font-size: 13px;
          color: #E87722;
          text-decoration: none;
          font-weight: 500;
        }

        .forgot-link:hover { text-decoration: underline; }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: #2563eb;
          color: white;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 1px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 4px;
        }

       .login-btn:hover:not(:disabled) {
   background: #1d4ed8;
}
        .login-btn:active:not(:disabled) { transform: scale(0.99); }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .footer-note {
          margin-top: 28px;
          font-size: 11.5px;
          color: #aaa;
          text-align: center;
        }

        /* ── responsive: stack on mobile ── */
        @media (max-width: 820px) {
          .login-root { padding: 0; flex-direction: column; }
          .left-panel  { width: 100%; border-radius: 0; min-height: auto; }
          .right-panel { width: 100%; border-radius: 0; padding: 32px 24px; }
        }
      `}</style>
    </div>
  );
}