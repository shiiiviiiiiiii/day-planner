import React, { useState } from "react";
import { plannerStorage } from "../lib/storage";

interface AuthScreenProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (isLogin) {
      const res = plannerStorage.login(username, password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Authentication failed.");
      }
    } else {
      const res = plannerStorage.signup(username, password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Registration failed.");
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setUsername("");
    setPassword("");
  };

  return (
    <div className="admin-login-prompt font-typewriter select-none">
      {/* Title */}
      <h2 className="font-header login-title">
        {isLogin ? "Sign In" : "Register Account"}
      </h2>
      <p className="login-note italic text-center">
        {isLogin 
          ? "Welcome back. Log in to access your day out checklist." 
          : "Create a notebook to plan your perfect day out."}
      </p>

      {/* Tab Switcher */}
      <div className="auth-tab-row font-typewriter">
        <button
          type="button"
          onClick={() => !isLogin && toggleMode()}
          className={`auth-tab-btn ${isLogin ? "active" : ""}`}
        >
          [ Log In ]
        </button>
        <button
          type="button"
          onClick={() => isLogin && toggleMode()}
          className={`auth-tab-btn ${!isLogin ? "active" : ""}`}
        >
          [ Sign Up ]
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label className="input-label">Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Type username..."
            className="input-text"
            maxLength={15}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="input-label">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type password..."
            className="input-text"
          />
        </div>

        {error && (
          <p className="login-error font-semibold">
            ⚠ {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary auth-submit-btn font-typewriter font-semibold"
        >
          {isLogin ? "Unseal Journal" : "Create Journal"}
        </button>
      </form>

      <div className="login-footer-info">
        * Accounts are stored locally. Zero database setup required.
      </div>
    </div>
  );
};
