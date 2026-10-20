import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";
import SocialAuth from "./SocialAuth";
import "./i18n";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const navigate = useNavigate();

  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const completeRegistration = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    window.dispatchEvent(new Event("auth-change"));
    navigate(data.user.role === "babysitter" ? "/edit-profile" : "/available-babysitters");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(apiUrl(`/api/${role}/register`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, name }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        if (!data.token) throw new Error("registrationFailed");
        completeRegistration({ token: data.token, user: { role } });
      } else {
        setError(t("registrationFailed"));
      }
    } catch (error) {
      console.error("Error:", error);
      setError(t(error.message === "registrationFailed" ? "registrationFailed" : "registrationError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>{t("createAccount")}</h1>
      <div id="register">
        <h2>{t("register")}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            autoComplete="username"
            aria-label={t("username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("username")}
            required
          />
          <input
            type="email"
            name="email"
            autoComplete="email"
            aria-label={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email")}
            required
          />
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            aria-label={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password")}
            minLength={8}
            required
          />
          <input
            type="text"
            name="name"
            autoComplete="name"
            aria-label={t("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            required
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user" data-i18n="user">
              {t("user")}
            </option>
            <option value="babysitter" data-i18n="babysitter">
              {t("babysitter")}
            </option>
          </select>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" data-i18n="register" disabled={isSubmitting}>
            {isSubmitting ? t("registering") : t("register")}
          </button>
        </form>
        <SocialAuth role={role} onAuthenticated={completeRegistration} />
        <p>{t("alreadyHaveAccount")}</p>
        <Link to="/login" data-i18n="loginHere">
          {t("loginHere")}
        </Link>
      </div>
    </div>
  );
}

export default Register;
