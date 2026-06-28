import React, { useState } from "react";
import { plannerStorage } from "../lib/storage";

interface AuthScreenProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (isLogin) {
      const res = plannerStorage.login(email, password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Invalid email or password.");
      }
    } else {
      const res = plannerStorage.signup(email, password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Registration failed.");
      }
    }
  };

  const handleSocialMockClick = (provider: string) => {
    // A friendly helper to log in instantly for testing, since social logins are mocked client-side
    setError("");
    const mockEmail = `${provider.toLowerCase()}guest@dayplanner.com`;
    const res = plannerStorage.login(mockEmail, "guestpass");
    if (res.success) {
      onSuccess();
    } else {
      // If mock account does not exist, sign it up first!
      const signupRes = plannerStorage.signup(mockEmail, "guestpass");
      if (signupRes.success) {
        onSuccess();
      } else {
        setError(`Failed to sign in with ${provider}.`);
      }
    }
  };

  return (
    <div className="auth-overlay-backdrop">
      <div className="auth-peach-card">
        {/* Header row: Welcome title and Top-Right Switch Pill Button */}
        <div className="auth-header-row">
          <h2 className="auth-welcome-title">
            {isLogin ? "Hello, welcome back!" : "Hello, create account!"}
          </h2>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setEmail("");
              setPassword("");
            }}
            className="auth-toggle-pill-btn"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>

        {/* Inputs and Submit Form */}
        <form onSubmit={handleSubmit} className="auth-inputs-form">
          <div className="auth-underline-group">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="auth-underline-input"
              autoFocus
            />
          </div>

          <div className="auth-underline-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="auth-underline-input"
            />
          </div>

          {isLogin && (
            <div className="auth-forgot-password-row">
              <button
                type="button"
                onClick={() => setError("Password resets are mocked locally. Any 4+ char password works!")}
                className="btn-forgot-password"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p className="login-error" style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px" }}>
              ⚠ {error}
            </p>
          )}

          {/* Let me in button */}
          <button type="submit" className="btn-let-me-in">
            {isLogin ? "Let me in" : "Create account"}
          </button>
        </form>

        <div className="auth-divider-or">
          or
        </div>

        {/* Mock social auth buttons matching screenshot */}
        <div className="auth-social-buttons-row">
          <button
            type="button"
            onClick={() => handleSocialMockClick("Google")}
            className="btn-social-outline"
          >
            {/* Google G logo */}
            <svg viewBox="0 0 24 24" className="social-logo-svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <button
            type="button"
            onClick={() => handleSocialMockClick("Apple")}
            className="btn-social-outline"
          >
            {/* Apple logo */}
            <svg viewBox="0 0 24 24" className="social-logo-svg">
              <path
                d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.18.66-2.9 1.5-.64.73-1.2 1.87-1.05 2.98 1.12.09 2.24-.59 2.96-1.42z"
                fill="#000000"
              />
            </svg>
            Sign in with Apple
          </button>
        </div>
      </div>
    </div>
  );
};
