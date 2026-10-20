import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SITE_URL, publicMetadata, privateRoutes } from "./seo-data";

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export default function SEO() {
  const { pathname, search } = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const language = (i18n.resolvedLanguage || i18n.language || "ar").split("-")[0];
    const routePath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
    const localized = publicMetadata[routePath];
    const hasRecoveryToken = routePath === "/" && new URLSearchParams(search).has("token");
    const isPrivate = !localized || hasRecoveryToken || privateRoutes.some((route) => routePath === route || routePath.startsWith(`${route}/`));
    const privatePage = language === "ar"
      ? ["حساب كير نست", "إدارة حسابك في كير نست."]
      : ["Care Nest Account", "Manage your Care Nest account."];
    const [title, description] = localized?.[language] || localized?.ar || privatePage;
    const canonical = `${SITE_URL}${routePath === "/" ? "/" : `${routePath}/`}`;

    document.title = title;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    setMeta("name", "google-adsense-account", "ca-pub-3496568058228119");
    setMeta("name", "description", description);
    setMeta("name", "robots", isPrivate ? "noindex,nofollow" : "index,follow,max-image-preview:large");
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", "Care Nest");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:locale", language === "ar" ? "ar_EG" : "en_US");
    setMeta("name", "twitter:card", "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    let structuredData = document.getElementById("care-nest-structured-data");
    if (routePath === "/") {
      if (!structuredData) {
        structuredData = document.createElement("script");
        structuredData.id = "care-nest-structured-data";
        structuredData.type = "application/ld+json";
        document.head.appendChild(structuredData);
      }
      structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Care Nest", url: `${SITE_URL}/`, description: publicMetadata["/"][language]?.[1] || publicMetadata["/"].ar[1] },
          { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Care Nest", url: `${SITE_URL}/`, inLanguage: language === "ar" ? "ar-EG" : "en", publisher: { "@id": `${SITE_URL}/#organization` } },
        ],
      });
    }
  }, [pathname, search, i18n.language, i18n.resolvedLanguage]);

  return null;
}
