import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";
import "./i18n";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "146671912539-sctdecp31oeebjq3868adrj9eqbsjl33.apps.googleusercontent.com";

function loadScript(src, id) {
  if (document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function issueNonce(provider) {
  const response = await fetch(apiUrl("/api/user/oauth/nonce"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.nonce) throw new Error(data.msg === "Social sign-in provider is not configured" ? "socialAuthNotConfigured" : "socialProviderLoadError");
  return data.nonce;
}

export default function SocialAuth({ role = "user", onAuthenticated }) {
  const { t, i18n } = useTranslation();
  const googleButton = useRef(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const configured = Boolean(googleClientId);

  const authenticate = async (provider, credential, name = "", nonce) => {
    setError("");
    try {
      const response = await fetch(apiUrl("/api/user/oauth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, credential, role, name, nonce }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token || !data.user?.role) {
        throw new Error(data.msg === "Email is already registered to another account" ? "socialAccountConflict" : "socialAuthError");
      }
      onAuthenticated(data);
      return true;
    } catch (requestError) {
      setError(t(requestError.message || "socialAuthError"));
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    if (googleClientId) {
      loadScript("https://accounts.google.com/gsi/client", "google-identity-services")
        .then(async () => {
          if (!active || !window.google?.accounts?.id || !googleButton.current) return;
          const renderGoogleButton = (nonce) => {
            if (!active || !googleButton.current) return;
            googleButton.current.innerHTML = "";
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: async ({ credential }) => {
                const authenticated = await authenticate("google", credential, "", nonce);
                if (!authenticated && active) {
                  try { renderGoogleButton(await issueNonce("google")); }
                  catch (nonceError) { setError(t(nonceError.message || "socialProviderLoadError")); }
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
        .catch((loadError) => setError(t(loadError.message || "socialProviderLoadError")));
    }
    return () => { active = false; };
  }, [i18n.resolvedLanguage, t]);

  if (!configured) return <section className="social-auth" aria-label={t("socialSignIn")}>
    <div className="social-auth-divider"><span>{t("orContinueWith")}</span></div>
    <p className="form-error" role="status">{t("socialAuthNotConfigured")}</p>
  </section>;

  return <section className="social-auth" aria-label={t("socialSignIn")}>
    <div className="social-auth-divider"><span>{t("orContinueWith")}</span></div>
    <div className="social-auth-buttons">
      <div className="google-auth-button" ref={googleButton} aria-label={t("continueWithGoogle")} />
      {!ready && <button type="button" className="social-auth-fallback" disabled>{t("continueWithGoogle")}</button>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
