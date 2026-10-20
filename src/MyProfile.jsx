import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";

const documentKinds = [
  ["nationalId", "nationalIdUpload"],
  ["passport", "passportUpload"],
  ["residency", "residencyUpload"],
];

function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoSource, setPhotoSource] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [openingDocument, setOpeningDocument] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "babysitter") {
      navigate(token ? "/" : "/login", { replace: true });
      return;
    }
    const controller = new AbortController();
    async function loadProfile() {
      try {
        const response = await fetch(apiUrl("/api/babysitter/profile"), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(t("loadProfileError"));
        setProfile(data);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(t("loadProfileError"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadProfile();
    return () => controller.abort();
  }, [navigate, t, token]);

  useEffect(() => {
    if (!profile?.photoUrl || !token) {
      setPhotoSource("");
      return undefined;
    }
    const controller = new AbortController();
    let objectUrl = "";
    setPhotoSource("");
    fetch(apiUrl(profile.photoUrl), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load profile photo");
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPhotoSource(objectUrl);
      })
      .catch((photoError) => {
        if (photoError.name !== "AbortError") setPhotoSource("");
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile?.photoUrl, token]);

  const availableDocuments = useMemo(() => {
    const uploaded = profile?.verificationDocuments || {};
    return documentKinds.filter(([kind]) => Boolean(uploaded[kind]));
  }, [profile]);

  const openDocument = async (kind) => {
    setOpeningDocument(kind);
    setDocumentError("");
    try {
      const response = await fetch(apiUrl(`/api/babysitter/profile/documents/${kind}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(t("documentLoadError"));
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (_) {
      setDocumentError(t("documentLoadError"));
    } finally {
      setOpeningDocument("");
    }
  };

  if (loading) return <main className="container"><p className="notice">{t("loading")}</p></main>;
  if (error || !profile) return <main className="container"><p className="form-error notice" role="alert">{error || t("loadProfileError")}</p></main>;

  const photoUrl = photoSource;
  const name = profile.name || profile.user?.name || profile.username || profile.user?.username || t("babysitterProfile");

  return (
    <main className="container policy-page">
      <div className="page-heading">
        <p className="eyebrow">{t("babysitterProfile")}</p>
        <h1>{t("myProfile")}</h1>
        <p>{t("myProfileDescription")}</p>
      </div>
      <section className="booking-panel own-profile-card">
        <div className="profile-intro">
          {photoUrl
            ? <img className="sitter-avatar large own-profile-photo" src={apiUrl(photoUrl)} alt={t("profilePhotoAlt", { name })} />
            : <div className="sitter-avatar large" aria-hidden="true">{name.slice(0, 1).toLocaleUpperCase()}</div>}
          <div>
            <p className="eyebrow">{t("babysitterProfile")}</p>
            <h2>{name}</h2>
            <p className="availability">{t(`moderation_${profile.moderationStatus || "pending"}`)}</p>
          </div>
        </div>
        <dl className="profile-details own-profile-facts">
          <div><dt>{t("phone")}</dt><dd>{profile.phone || t("notAvailable")}</dd></div>
          <div><dt>{t("age")}</dt><dd>{profile.age || t("notAvailable")}</dd></div>
          <div><dt>{t("nationality")}</dt><dd>{profile.nationality || t("notAvailable")}</dd></div>
          <div><dt>{t("city")}</dt><dd>{profile.city || t("notAvailable")}</dd></div>
          <div><dt>{t("monthlySalary")}</dt><dd>{profile.monthlySalary != null ? `${Number(profile.monthlySalary).toLocaleString()} ${profile.currency || "EGP"} ${t("perMonth")}` : t("notAvailable")}</dd></div>
          <div><dt>{t("servicesProvided")}</dt><dd>{profile.services?.filter((service) => service !== "studying").map((service) => t(service)).join(", ") || t("servicesNotListed")}</dd></div>
          <div><dt>{t("availability")}</dt><dd>{t(profile.available ? "availableForRequests" : "notTakingRequests")}</dd></div>
          <div><dt>{t("approvalStatus")}</dt><dd>{t(`moderation_${profile.moderationStatus || "pending"}`)}</dd></div>
        </dl>
        <section className="own-profile-bio">
          <h3>{t("aboutYou")}</h3>
          <p>{profile.bio || t("notAvailable")}</p>
        </section>
        <section className="own-profile-documents">
          <h3>{t("uploadedDocuments")}</h3>
          {profile.photoUrl && <p>{t("optionalPhoto")}: {t("uploaded")}</p>}
          {!availableDocuments.length && !profile.photoUrl
            ? <p>{t("noDocumentsUploaded")}</p>
            : <div className="admin-document-links">
              {availableDocuments.map(([kind, label]) => (
                <button key={kind} type="button" disabled={openingDocument === kind} onClick={() => openDocument(kind)}>
                  {openingDocument === kind ? t("loading") : t(label)}
                </button>
              ))}
            </div>}
          {documentError && <p className="form-error" role="alert">{documentError}</p>}
        </section>
        <Link className="primary-link own-profile-edit" to="/edit-profile">{t("editProfile")}</Link>
      </section>
    </main>
  );
}

export default MyProfile;
