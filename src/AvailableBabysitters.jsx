import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";

const services = ["babysitting", "cleaning", "cooking", "studying"];

function AvailableBabysitters() {
  const [babysitters, setBabysitters] = useState([]);
  const [search, setSearch] = useState("");
  const [service, setService] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const controller = new AbortController();
    async function loadBabysitters() {
      try {
        const response = await fetch(apiUrl("/api/babysitter"), {
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data.msg || t("loadSittersError"));
        }
        setBabysitters(data);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message || t("loadSittersError"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadBabysitters();
    return () => controller.abort();
  }, [t]);

  const visibleSitters = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return babysitters.filter((sitter) => {
      const matchesSearch = !term || [sitter.name, sitter.nationality]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase().includes(term));
      const matchesService = !service || sitter.services?.includes(service);
      return matchesSearch && matchesService;
    });
  }, [babysitters, search, service]);

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
        {visibleSitters.map((sitter) => (
          <article className="sitter-card" key={sitter._id}>
            {sitter.photoUrl ? <img className="sitter-avatar" src={apiUrl(sitter.photoUrl)} alt={sitter.name} /> : <div className="sitter-avatar" aria-hidden="true">{(sitter.name || "?").slice(0, 1).toLocaleUpperCase()}</div>}
            <div className="sitter-card-content">
              <h2>{sitter.name}</h2>
              <p className="muted">{sitter.nationality || t("nationalityNotListed")}</p>
              {sitter.city && <p>{sitter.city}</p>}
              {sitter.age && <p>{t("age")}: {sitter.age}</p>}
              {sitter.monthlySalary != null && <p className="rate-label">{sitter.monthlySalary.toLocaleString()} {sitter.currency || "EGP"} {t("perMonth")}</p>}
              <div className="tag-list">
                {(sitter.services || []).map((item) => (
                  <span className="service-tag" key={item}>{t(item)}</span>
                ))}
                {(!sitter.services || sitter.services.length === 0) && (
                  <span className="muted">{t("servicesNotListed")}</span>
                )}
              </div>
              <Link className="primary-link" to={`/view-user/${sitter.userId}`}>
                {t("viewProfileAndBook")}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export default AvailableBabysitters;
