import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";
import "./i18n";

export default function PasswordRecovery({ reset = false }) {
  const { t, i18n } = useTranslation();
  const languageCode = (i18n.resolvedLanguage || i18n.language || "ar").split("-")[0];
  const recoveryText = (key, arabic, english) => t(key, {
    defaultValue: languageCode === "ar" ? arabic : english,
  });
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl(reset ? "/api/user/reset-password" : "/api/user/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reset
          ? { token: params.get("token"), newPassword: password }
          : { email }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const key = response.status === 503 ? "passwordRecoveryNotConfigured" : reset ? "passwordResetError" : "passwordRecoveryError";
        throw new Error(data.msg === "Password recovery email is not configured" ? "passwordRecoveryNotConfigured" : key);
      }
      setSuccess(t(reset ? "passwordResetSuccess" : "passwordRecoverySent"));
      setEmail("");
      setPassword("");
    } catch (requestError) {
      setError(t(requestError.message === "passwordRecoveryNotConfigured" ? requestError.message : reset ? "passwordResetError" : "passwordRecoveryError"));
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="container policy-page">
    <div className="page-heading"><h1>{t(reset ? "resetPassword" : "forgotPassword")}</h1></div>
    <section className="booking-panel">
      <form onSubmit={submit}>
        {reset ? <>
          <label htmlFor="reset-new-password">{t("newPassword")}</label>
          <input id="reset-new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
        </> : <>
          <p>{t("passwordRecoveryInstructions")}</p>
          <label htmlFor="recovery-email">{t("email")}</label>
          <input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && (
          <div className="success-message" role="status">
            <p>{success}</p>
            {!reset && (
              <p className="check-spam-notice">
                {recoveryText(
                  "checkInboxSpamNotice",
                  "يرجى التحقق من صندوق الوارد (ومجلد الرسائل غير المرغوب فيها Spam إذا لم تجدها على الفور).",
                  "Please check your inbox (and Spam folder if you don't see it right away)."
                )}
              </p>
            )}
          </div>
        )}
        <button type="submit" disabled={submitting}>{submitting ? t("sendingRequest") : t(reset ? "resetPassword" : "sendResetLink")}</button>
      </form>
      <p><Link to="/login">{t("loginHere")}</Link></p>
    </section>
  </main>;
}
