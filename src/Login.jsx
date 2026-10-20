import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "./api";
import SocialAuth from "./SocialAuth";
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

  const completeLogin = async (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    window.dispatchEvent(new Event("auth-change"));

    if (data.user.role === "babysitter") {
      let destination = "/edit-profile";
      try {
        const profileResponse = await fetch(apiUrl("/api/babysitter/profile"), {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        const profile = await profileResponse.json().catch(() => ({}));
        const hasEditedProfile = profileResponse.ok
          && Boolean(profile.phone && profile.age && profile.nationality && profile.city)
          && Array.isArray(profile.services)
          && profile.services.some((service) => service !== "studying");

        if (hasEditedProfile) {
          destination = profile.moderationStatus === "approved" ? "/bookings" : "/my-profile";
        }
      } catch (profileError) {
        console.error("Could not check babysitter profile status:", profileError);
      }
      navigate(destination, { replace: true });
      return;
    }

    navigate(data.user.role === "admin" ? "/admin-panel" : "/available-babysitters", { replace: true });
  };

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
        await completeLogin(data);
      } else {
        setError(t("loginFailed"));
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
        <SocialAuth onAuthenticated={completeLogin} />
        <p>
          {t("dontHaveAccount")} <Link to="/register">{t("registerHere")}</Link>
        </p>
        <p><Link to="/forgot-password">{t("forgotPassword")}</Link></p>
      </div>
    </div>
  );
}

export default Login;
