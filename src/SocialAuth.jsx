import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";
import "./i18n";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "146671912539-sctdecp31oeebjq3868adrj9eqbsjl33.apps.googleusercontent.com";
let googleScriptPromise;
const fallbackMessages = {
  loadingGoogleSignIn: {
    en: "Loading Google sign-in…",
    ar: "جارٍ تحميل تسجيل الدخول عبر Google…",
  },
  retryGoogleSignIn: {
    en: "Retry Google sign-in",
    ar: "إعادة محاولة تسجيل الدخول عبر Google",
  },
  socialNonceError: {
    en: "Could not connect to the sign-in service. Check that the backend is awake and try again.",
    ar: "تعذر الاتصال بخدمة تسجيل الدخول. تأكدي من عمل الخادم ثم حاولي مرة أخرى.",
  },
  socialNonceMismatch: {
    en: "Google could not confirm this sign-in attempt. Please retry.",
    ar: "تعذر تأكيد محاولة تسجيل الدخول عبر Google. حاولي مرة أخرى.",
  },
  googleClientMismatch: {
    en: "Google rejected this account. Check that the frontend and backend use the same Google client ID.",
    ar: "رفضت Google هذا الحساب. تأكدي من تطابق معرّف العميل في الواجهة والخادم.",
  },
  socialEmailUnverified: {
    en: "Use a Google account with a verified email address.",
    ar: "استخدمي حساب Google ببريد إلكتروني تم التحقق منه.",
  },
};

function socialText(t, key, language) {
  const languageCode = language?.startsWith("ar") ? "ar" : "en";
  return t(key, { defaultValue: fallbackMessages[key]?.[languageCode] || key });
}

function loadScript(src, id) {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id);
    const script = existingScript || document.createElement("script");
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });

    if (!existingScript) {
      script.id = id;
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    googleScriptPromise = undefined;
    throw error;
  });

  return googleScriptPromise;
}

async function issueNonce(provider) {
  let response;
  try {
    response = await fetch(apiUrl("/api/user/oauth/nonce"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
  } catch {
    throw new Error("socialNonceError");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.nonce) {
    throw new Error(data.msg === "Social sign-in provider is not configured" ? "socialAuthNotConfigured" : "socialNonceError");
  }
  return data.nonce;
}

export default function SocialAuth({ role = "user", flow = "login", onAuthenticated, onRegistrationRequired }) {
  const { t, i18n } = useTranslation();
  const googleButton = useRef(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const configured = Boolean(googleClientId);

  const authenticate = async (provider, credential, name = "", nonce) => {
    setError("");
    try {
      const response = await fetch(apiUrl("/api/user/oauth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, credential, role, flow, name, nonce }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.registrationRequired && data.registrationToken) {
        onRegistrationRequired?.(data);
        return true;
      }
      if (!response.ok || !data.token || !data.user?.role) {
        const errorKey = {
          "Email is already registered to another account": "socialAccountConflict",
          "Google sign-in nonce is invalid or expired": "socialNonceError",
          "Google credential nonce does not match this sign-in attempt": "socialNonceMismatch",
          "Google credential could not be verified. Check the configured Google client ID.": "googleClientMismatch",
          "Google account email is not verified": "socialEmailUnverified",
          "No account was found for this Google account. Register first.": "socialAccountNotFound",
        }[data.msg] || "socialAuthError";
        throw new Error(errorKey);
      }
      onAuthenticated(data);
      return true;
    } catch (requestError) {
      setError(socialText(t, requestError.message || "socialAuthError", i18n.resolvedLanguage));
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    if (googleClientId) {
      loadScript("https://accounts.google.com/gsi/client", "google-identity-services")
        .then(async () => {
          if (!active || !googleButton.current) return;
          if (!window.google?.accounts?.id) throw new Error("socialProviderLoadError");
          const renderGoogleButton = (nonce) => {
            if (!active || !googleButton.current) return;
            googleButton.current.innerHTML = "";
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: async ({ credential }) => {
                const authenticated = await authenticate("google", credential, "", nonce);
                if (!authenticated && active) {
                  try { renderGoogleButton(await issueNonce("google")); }
          catch (nonceError) { setError(socialText(t, nonceError.message || "socialProviderLoadError", i18n.resolvedLanguage)); }
                }
              },
              nonce,
              ux_mode: "popup",
              auto_select: false,
            });
            window.google.accounts.id.renderButton(googleButton.current, {
              type: "standard", theme: "outline", size: "large", text: "continue_with",
              shape: "rectangular", width: Math.min(360, googleButton.current.clientWidth || 360),
              locale: i18n.resolvedLanguage || "ar",
            });
            setReady(true);
          };
          renderGoogleButton(await issueNonce("google"));
        })
        .catch((loadError) => setError(socialText(t, loadError.message || "socialProviderLoadError", i18n.resolvedLanguage)));
    }
    return () => { active = false; };
  }, [i18n.resolvedLanguage, retryCount, t]);

  if (!configured) return <section className="social-auth" aria-label={t("socialSignIn")}>
    <div className="social-auth-divider"><span>{t("orContinueWith")}</span></div>
    <p className="form-error" role="status">{t("socialAuthNotConfigured")}</p>
  </section>;

  return <section className="social-auth" aria-label={t("socialSignIn")}>
    <div className="social-auth-divider"><span>{t("orContinueWith")}</span></div>
    <div className="social-auth-buttons">
      <div className="google-auth-button" ref={googleButton} aria-label={t("continueWithGoogle")} />
      {!ready && !error && <span className="social-auth-loading" role="status">{socialText(t, "loadingGoogleSignIn", i18n.resolvedLanguage)}</span>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {error && <button type="button" className="social-auth-retry" onClick={() => { setError(""); setRetryCount((count) => count + 1); }}>{socialText(t, "retryGoogleSignIn", i18n.resolvedLanguage)}</button>}
  </section>;
}
