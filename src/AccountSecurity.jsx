import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";
import "./i18n";

export default function AccountSecurity() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetch(apiUrl("/api/user"), { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((user) => setEmail(user.email || ""))
      .catch(() => setEmailError(t("emailLoadError")));
  }, [navigate, t]);

  const submitEmail = async (event) => {
    event.preventDefault();
    setEmailError(""); setEmailSuccess(""); setSaving(true);
    try {
      const response = await fetch(apiUrl("/api/user/email"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ email: newEmail, currentPassword: emailPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg === "Current password is incorrect" ? "emailPasswordIncorrect" : data.msg === "Email address is already in use" ? "emailAlreadyUsed" : "emailChangeError");
      setEmail(data.email); setNewEmail(""); setEmailPassword(""); setEmailSuccess(t("emailChanged"));
    } catch (err) { setEmailError(t(err.message || "emailChangeError")); }
    finally { setSaving(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!localStorage.getItem("token")) return navigate("/login");
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const response = await fetch(apiUrl("/api/user/password"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) throw new Error("passwordChangeError");
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(t("passwordChanged"));
    } catch (_) {
      setError(t("passwordChangeError"));
    } finally {
      setSaving(false);
    }
  };

  return <main className="container policy-page">
    <div className="page-heading"><h1>{t("accountSecurity")}</h1></div>
    <section className="booking-panel">
      <h2>{t("changeEmail")}</h2>
      <p>{t("currentEmail")}: <strong>{email || t("loading")}</strong></p>
      {email === "test@test.com" && <p className="form-error">{t("placeholderEmailNotice")}</p>}
      <form onSubmit={submitEmail}>
        <label htmlFor="new-email">{t("newEmail")}</label>
        <input id="new-email" type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required />
        <label htmlFor="email-current-password">{t("currentPassword")}</label>
        <input id="email-current-password" type="password" autoComplete="current-password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} required />
        {emailError && <p className="form-error" role="alert">{t(emailError)}</p>}
        {emailSuccess && <p className="success-message" role="status">{emailSuccess}</p>}
        <button type="submit" disabled={saving}>{saving ? t("saving") : t("saveEmail")}</button>
      </form>
    </section>
    <section className="booking-panel">
      <h2>{t("changePassword")}</h2>
      <form onSubmit={submit}>
        <label htmlFor="current-password">{t("currentPassword")}</label>
        <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
        <label htmlFor="new-password">{t("newPassword")}</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="success-message" role="status">{success}</p>}
        <button type="submit" disabled={saving}>{saving ? t("saving") : t("changePassword")}</button>
      </form>
      <p><Link to="/forgot-password">{t("forgotPassword")}</Link></p>
    </section>
  </main>;
}
