import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const clientId = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "ca-pub-3496568058228119";
const slotId = import.meta.env.VITE_ADSENSE_SLOT?.trim() || "8692700542";
const isValidSlot = Boolean(slotId && slotId !== "0000000000" && slotId !== "undefined");

function AdUnit() {
  const { t } = useTranslation();
  const adRef = useRef(null);

  useEffect(() => {
    if (!clientId || !isValidSlot) return undefined;

    const scriptUrl = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    let script = document.querySelector(`script[src="${scriptUrl}"]`);
    if (!script) {
      script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = scriptUrl;
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
      }, { once: true });
      document.head.appendChild(script);
    }

    const requestAd = () => {
      const ad = adRef.current;
      if (!ad || ad.dataset.adRequested || ad.dataset.adsbygoogleStatus) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        ad.dataset.adRequested = "true";
      } catch (error) {
        console.error("Google AdSense could not load this ad unit.", error);
      }
    };

    if (script.dataset.loaded === "true") {
      requestAd();
    } else {
      const onLoad = () => {
        script.dataset.loaded = "true";
        requestAd();
      };
      script.addEventListener("load", onLoad, { once: true });
      return () => script.removeEventListener("load", onLoad);
    }
    return undefined;
  }, []);

  if (!clientId || !isValidSlot) return null;

  return (
    <aside className="ad-placement" aria-label={t("advertisement")}>
      <span className="ad-label">{t("advertisement")}</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

export default AdUnit;
