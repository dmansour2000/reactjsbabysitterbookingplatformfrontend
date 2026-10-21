import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";
import AdUnit from "./AdUnit";

const services = ["babysitting", "cleaning", "cooking", "elderlyCare"];

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

function localizeNationality(nationality, language, t) {
  if (!nationality || !language.startsWith("ar")) return nationality || t("nationalityNotListed");
  const key = nationality.toLowerCase().trim().replaceAll(" ", "_");
  const translated = t(`nationality_${key}`);
  return translated === `nationality_${key}` ? nationality : translated;
}

function AvailableBabysitters() {
  const [babysitters, setBabysitters] = useState([]);
  const [egyptDistricts, setEgyptDistricts] = useState([]);
  const [search, setSearch] = useState("");
  const [service, setService] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}egypt-districts.json`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => { if (Array.isArray(data)) setEgyptDistricts(data); })
      .catch((loadError) => { if (loadError.name !== "AbortError") setEgyptDistricts([]); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadBabysitters() {
      try {
        const response = await fetch(apiUrl("/api/babysitter"), {
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(t("loadSittersError"));
        }
        setBabysitters(data);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(t("loadSittersError"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadBabysitters();
    return () => controller.abort();
  }, [t]);

  const visibleSitters = useMemo(() => {
    const term = normalizeSearchText(search);
    return babysitters.filter((sitter) => {
      const matchesSearch = !term || [
        sitter.name,
        sitter.nationality,
        localizeNationality(sitter.nationality, i18n.language, t),
      ]
        .filter(Boolean)
        .some((value) => normalizeSearchText(value).includes(term));
      const matchesService = !service || sitter.services?.includes(service);
      return matchesSearch && matchesService;
    });
  }, [babysitters, i18n.language, search, service, t]);

  const localizeCity = (city) => {
    if (!city || !i18n.language.startsWith("ar")) return city;
    const normalizedCity = city.trim().toLocaleLowerCase();
    const match = egyptDistricts.find((district) => {
      const fullName = `${district.name.en}, ${district.parent.name.en}`.toLocaleLowerCase();
      return normalizedCity === fullName
        || normalizedCity === district.name.en.toLocaleLowerCase()
        || normalizedCity === district.name.local.toLocaleLowerCase();
    });
    return match ? `${match.name.local}، ${match.parent.name.local}` : city;
  };

  return (
    <main className="container marketplace">
      <div className="page-heading">
        <p className="eyebrow">{t("trustedCare")}</p>
        <h1>{t("availableBabysitters")}</h1>
        <p>{t("browseSittersDescription")}</p>
      </div>

      <div className="sitter-filters" aria-label={t("filterSitters")}>
        <label>
          <span>{t("searchSitters")}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchByNameOrNationality")}
          />
        </label>
        <label>
          <span>{t("service")}</span>
          <select value={service} onChange={(event) => setService(event.target.value)}>
            <option value="">{t("allServices")}</option>
            {services.map((item) => <option key={item} value={item}>{t(item)}</option>)}
          </select>
        </label>
      </div>

      {loading && <p className="notice">{t("loadingSitters")}</p>}
      {error && <p className="form-error notice" role="alert">{error}</p>}
      {!loading && !error && visibleSitters.length === 0 && (
        <div className="empty-state">
          <h2>{t("noMatchingSitters")}</h2>
          <p>{t("adjustSearch")}</p>
        </div>
      )}

      <div className="sitter-grid">
        {visibleSitters.map((sitter) => {
          const isBusy = !!(sitter.hasAcceptedBooking || sitter.isBookedAndAccepted);
          const avatarUrl = sitter.photoUrl ? apiUrl(sitter.photoUrl) : "/carenest-icon.svg";
          return (
            <article className="sitter-card" key={sitter._id}>
              <img
                className="sitter-avatar"
                src={avatarUrl}
                alt={sitter.name}
                onError={(e) => { e.currentTarget.src = "/carenest-icon.svg"; }}
              />
              <div className="sitter-card-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2>{sitter.name}</h2>
                  <span className={!isBusy ? "availability available" : "availability unavailable"} style={{ fontSize: "0.8rem", padding: "2px 8px", borderRadius: "12px" }}>
                    {!isBusy ? t("availableForRequests") : t("notTakingRequests")}
                  </span>
                </div>
                <p className="muted" dir="auto">{localizeNationality(sitter.nationality, i18n.language, t)}</p>
                {sitter.city && <p dir="auto">{localizeCity(sitter.city)}</p>}
                {sitter.age && <p dir="auto"><span>{t("age")}: </span><bdi>{sitter.age}</bdi></p>}
                {sitter.monthlySalary != null && <p className="rate-label" dir="auto"><bdi>{sitter.monthlySalary.toLocaleString()} {sitter.currency || "EGP"}</bdi> {t("perMonth")}</p>}
                <div className="tag-list">
                  {(sitter.services || []).filter((item) => item !== "studying").map((item) => (
                    <span className="service-tag" key={item}>{t(item)}</span>
                  ))}
                  {!(sitter.services || []).some((item) => item !== "studying") && (
                    <span className="muted">{t("servicesNotListed")}</span>
                  )}
                </div>
                <Link className="primary-link" to={`/view-user/${sitter.userId || sitter._id}`}>
                  {t("viewProfileAndBook")}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <AdUnit />
    </main>
  );
}

export default AvailableBabysitters;
