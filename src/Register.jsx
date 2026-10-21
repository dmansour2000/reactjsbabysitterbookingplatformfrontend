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
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const languageCode = (i18n.resolvedLanguage || i18n.language || "ar").split("-")[0];
  const registrationText = (key, arabic, english) => t(key, {
    defaultValue: languageCode === "ar" ? arabic : english,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [googleRegistration, setGoogleRegistration] = useState(null);
  const [googleRole, setGoogleRole] = useState("user");
  const [googleRegistrationError, setGoogleRegistrationError] = useState("");
  const [isCompletingGoogleRegistration, setIsCompletingGoogleRegistration] = useState(false);

  const completeRegistration = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    window.dispatchEvent(new Event("auth-change"));
    navigate(data.user.role === "babysitter" ? "/edit-profile" : "/available-babysitters");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError(registrationText("selectAccountType", "يرجى اختيار نوع الحساب", "Please select an account type"));
      return;
    }
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
      if (!response.ok) {
        const message = data.msg || "";
        if (/already exists/i.test(message)) throw new Error("usernameAlreadyUsed");
        if (/email is already registered|email address is already in use/i.test(message)) throw new Error("emailAlreadyUsed");
        if (/valid email/i.test(message)) throw new Error("registrationInvalidEmail");
        if (/password of at least 8 characters/i.test(message)) throw new Error("registrationRequirements");
        throw new Error(response.status >= 500 ? "registrationError" : "registrationFailed");
      }
      if (!data.token) throw new Error("registrationFailed");
      completeRegistration({ token: data.token, user: { role } });
    } catch (error) {
      console.error("Error:", error);
      setError(t(error.message || "registrationError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishGoogleRegistration = async (event) => {
    event.preventDefault();
    if (!googleRegistration?.registrationToken || isCompletingGoogleRegistration) return;
    setIsCompletingGoogleRegistration(true);
    setGoogleRegistrationError("");

    try {
      const response = await fetch(apiUrl("/api/user/oauth/complete-registration"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationToken: googleRegistration.registrationToken,
          role: googleRole,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token || !data.user?.role) {
        throw new Error("socialRegistrationError");
      }
      completeRegistration(data);
    } catch (requestError) {
      setGoogleRegistrationError(registrationText(
        requestError.message || "socialRegistrationError",
        "تعذر إكمال التسجيل عبر Google. حاولي مرة أخرى.",
        "Could not complete Google registration. Please try again.",
      ));
    } finally {
      setIsCompletingGoogleRegistration(false);
    }
  };

  if (googleRegistration) {
    return (
      <div className="container">
        <h1>{registrationText("completeGoogleRegistration", "أكملي إنشاء حسابك في كير نست", "Complete your CareNest account")}</h1>
        <div className="parent" id="google-registration-completion">
          <h2>{registrationText("chooseAccountType", "اختاري طريقة استخدامك لكير نست", "Choose how you want to use CareNest")}</h2>
          <p>{registrationText("googleAccountEmail", "حساب Google", "Google account")}: {googleRegistration.googleUser?.email}</p>
          <form onSubmit={finishGoogleRegistration}>
            <label htmlFor="google-account-role">{registrationText("accountType", "أرغب في الانضمام إلى كير نست بصفة", "I want to join CareNest as a")}</label>
            <select id="google-account-role" value={googleRole} onChange={(event) => setGoogleRole(event.target.value)}>
              <option value="user">{t("user")}</option>
              <option value="babysitter">{t("babysitter")}</option>
            </select>
            {googleRegistrationError && <p className="form-error" role="alert">{googleRegistrationError}</p>}
            <button type="submit" disabled={isCompletingGoogleRegistration}>
              {isCompletingGoogleRegistration ? t("registering") : registrationText("completeRegistration", "متابعة", "Continue")}
            </button>
          </form>
          <button type="button" className="secondary-button" onClick={() => { setGoogleRegistration(null); setGoogleRegistrationError(""); }}>
            {registrationText("backToRegistration", "العودة إلى التسجيل", "Back to registration")}
          </button>
        </div>
      </div>
    );
  }

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
          <label htmlFor="role" className="register-role-label">
            {registrationText("joinCareNestAs", "أرغب في الانضمام إلى كير نست بصفة:", "I want to join CareNest as a:")}
          </label>
          <select
            id="role"
            name="role"
            aria-label={registrationText("joinCareNestAs", "أرغب في الانضمام إلى كير نست بصفة:", "I want to join CareNest as a:")}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="" disabled>
              {registrationText("accountTypePlaceholder", "نوع الحساب", "Account Type")}
            </option>
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
        <SocialAuth
          role={role || "user"}
          flow="register"
          onAuthenticated={completeRegistration}
          onRegistrationRequired={(pendingRegistration) => {
            setGoogleRole(role || "user");
            setGoogleRegistration(pendingRegistration);
          }}
        />
        <p>{t("alreadyHaveAccount")}</p>
        <Link to="/login" data-i18n="loginHere">
          {t("loginHere")}
        </Link>
      </div>
    </div>
  );
}

export default Register;
