import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "./api";
import "./App.css";
import "./i18n";

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State for form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/api/user/login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (!data.token || !data.user?.role) {
          throw new Error("loginFailed");
        }
        localStorage.setItem("token", data.token);

        const role = data.user.role;
        localStorage.setItem("role", role);
        window.dispatchEvent(new Event("auth-change"));
        if (role === "babysitter") {
          navigate("/edit-profile");
        } else if (role === "admin") {
          navigate("/admin-panel");
        } else {
          navigate("/available-babysitters");
        }
      } else {
        setError(data.msg || t("loginFailed"));
      }
    } catch (error) {
      console.error("Error:", error);
      setError(t(error.message === "loginFailed" ? "loginFailed" : "loginError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      {/* Welcome Message */}
      <h1>{t("welcome")}</h1>

      {/* Login Section */}
      <div className="parent" id="login">
        <h2>{t("login")}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            autoComplete="username"
            aria-label={t("username")}
            placeholder={t("username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            aria-label={t("password")}
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("loggingIn") : t("login")}
          </button>
        </form>
        <p>
          {t("dontHaveAccount")} <Link to="/register">{t("registerHere")}</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
