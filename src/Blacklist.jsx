import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";

const nationalities = ["Egypt", "Sudan", "Nigeria", "Ethiopia", "Philippines", "Other African", "Indonesia", "Other"];

function Blacklist() {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const [entries, setEntries] = useState([]);
  const [mine, setMine] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [photos, setPhotos] = useState({});
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState(nationalities[0]);
  const [otherNationality, setOtherNationality] = useState("");
  const [age, setAge] = useState("");
  const [reason, setReason] = useState("");
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionId, setActionId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requests = [fetch(apiUrl("/api/blacklist"))];
      if (role === "user" && token) requests.push(fetch(apiUrl("/api/blacklist/mine"), { headers: { Authorization: `Bearer ${token}` } }));
      if (role === "admin" && token) requests.push(fetch(apiUrl("/api/blacklist/admin/review"), { headers: { Authorization: `Bearer ${token}` } }));
      const responses = await Promise.all(requests);
      const values = await Promise.all(responses.map(async (response) => ({ response, data: await response.json().catch(() => ({})) })));
      if (!values[0].response.ok) throw new Error("blacklistLoadError");
      setEntries(Array.isArray(values[0].data) ? values[0].data : []);
      let index = 1;
      if (role === "user" && token) {
        if (!values[index].response.ok) throw new Error("blacklistLoadError");
        setMine(Array.isArray(values[index].data) ? values[index].data : []);
        index += 1;
      } else setMine([]);
      if (role === "admin" && token) {
        if (!values[index].response.ok) throw new Error("blacklistLoadError");
        setReviews(Array.isArray(values[index].data) ? values[index].data : []);
      } else setReviews([]);
    } catch (loadError) {
      setError(t(loadError.message || "blacklistLoadError"));
    } finally {
      setLoading(false);
    }
  }, [role, t, token]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (role !== "admin" || !token || !reviews.length) return undefined;
    const controller = new AbortController();
    const objectUrls = [];
    Promise.all(reviews.map(async (item) => {
      try {
        const response = await fetch(apiUrl(`/api/blacklist/admin/${item._id}/photo`), {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        if (!response.ok) return [item._id, ""];
        const objectUrl = URL.createObjectURL(await response.blob());
        objectUrls.push(objectUrl);
        return [item._id, objectUrl];
      } catch (_) { return [item._id, ""]; }
    })).then((photoEntries) => { if (!controller.signal.aborted) setPhotos(Object.fromEntries(photoEntries)); });
    return () => { controller.abort(); objectUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [reviews, role, token]);

  const nationalityValue = useMemo(() => nationality === "Other" ? otherNationality.trim() : nationality, [nationality, otherNationality]);

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setNotice("");
    if (!token || role !== "user") return;
    if (!photo) {
      setError(t("blacklistPhotoRequiredError"));
      return;
    }
    const body = new FormData();
    body.append("name", name.trim());
    body.append("nationality", nationalityValue);
    if (age) body.append("age", age);
    body.append("reason", reason.trim());
    body.append("photo", photo);
    Array.from(documents).slice(0, 3).forEach((file) => body.append("documents", file));
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/blacklist"), {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.msg === "A profile photo is required" ? "blacklistPhotoRequiredError" : "blacklistSubmitError");
      setName(""); setNationality(nationalities[0]); setOtherNationality(""); setAge(""); setReason(""); setPhoto(null); setDocuments([]);
      form.reset();
      setNotice(t("blacklistSubmitted"));
      await loadData();
    } catch (submitError) {
      setError(t(submitError.message || "blacklistSubmitError"));
    } finally { setSubmitting(false); }
  };

  const moderate = async (id, status) => {
    setActionId(id); setError(""); setNotice("");
    try {
      const response = await fetch(apiUrl(`/api/blacklist/admin/${id}/review`), {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("blacklistReviewError");
      setNotice(t(status === "approved" ? "blacklistApproved" : "blacklistRejected"));
      await loadData();
    } catch (moderationError) { setError(t(moderationError.message || "blacklistReviewError")); }
    finally { setActionId(""); }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm(t("blacklistConfirmDelete"))) return;
    setActionId(id); setError(""); setNotice("");
    try {
      const response = await fetch(apiUrl(`/api/blacklist/admin/${id}`), {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("blacklistDeleteError");
      setNotice(t("blacklistDeleted"));
      await loadData();
    } catch (deleteError) { setError(t(deleteError.message || "blacklistDeleteError")); }
    finally { setActionId(""); }
  };

  const openDocument = async (id, index) => {
    try {
      const response = await fetch(apiUrl(`/api/blacklist/admin/${id}/documents/${index}`), { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("blacklistDocumentError");
      const url = URL.createObjectURL(await response.blob());
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (_) { setError(t("blacklistDocumentError")); }
  };

  return <main className="container policy-page">
    <div className="page-heading"><p className="eyebrow">{t("blacklistEyebrow")}</p><h1>{t("blacklistTitle")}</h1><p>{t("blacklistDescription")}</p></div>
    {error && <p className="form-error notice" role="alert">{error}</p>}
    {notice && <p className="success-message notice" role="status">{notice}</p>}

    {role === "user" && <section className="booking-panel blacklist-form-panel">
      <h2>{t("blacklistSubmitTitle")}</h2>
      <p>{t("blacklistSubmitDescription")}</p>
      <form onSubmit={submit} noValidate>
        <label htmlFor="blacklist-name">{t("blacklistName")}</label>
        <input id="blacklist-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
        <label htmlFor="blacklist-nationality">{t("nationality")}</label>
        <select id="blacklist-nationality" value={nationality} onChange={(event) => setNationality(event.target.value)} required>
          {nationalities.map((item) => <option key={item} value={item}>{t(`nationality_${item.toLowerCase().replaceAll(" ", "_")}`)}</option>)}
        </select>
        {nationality === "Other" && <><label htmlFor="blacklist-other-nationality">{t("specifyNationality")}</label><input id="blacklist-other-nationality" value={otherNationality} onChange={(event) => setOtherNationality(event.target.value)} maxLength={80} required /></>}
        <label htmlFor="blacklist-age">{t("ageOptional")}</label>
        <input id="blacklist-age" type="number" min="18" max="100" value={age} onChange={(event) => setAge(event.target.value)} />
        <label htmlFor="blacklist-reason">{t("blacklistReason")}</label>
        <textarea id="blacklist-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={2000} rows={5} required />
        <label htmlFor="blacklist-photo">{t("blacklistPhotoRequired")}</label>
        <input id="blacklist-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)} required />
        <label htmlFor="blacklist-documents">{t("blacklistDocumentsOptional")}</label>
        <input id="blacklist-documents" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(event) => setDocuments(event.target.files || [])} />
        <p className="muted">{t("blacklistReviewNotice")}</p>
        <button type="submit" disabled={submitting || !photo}>{submitting ? t("loading") : t("blacklistSubmit")}</button>
      </form>
    </section>}
    {!token && <p className="notice">{t("blacklistLoginPrompt")} <Link to="/login">{t("login")}</Link></p>}

    {role === "admin" && <section className="booking-panel blacklist-review-panel">
      <h2>{t("blacklistReviewTitle")}</h2>
      {reviews.length ? reviews.map((item) => <article className="blacklist-card" key={item._id}>
        {photos[item._id] && <img className="blacklist-photo" src={photos[item._id]} alt={t("blacklistPhotoAlt", { name: item.name })} />}
        <h3>{item.name}</h3><p>{item.nationality}{item.age ? ` · ${item.age}` : ""}</p><p>{item.reason}</p>
        {item.documentCount > 0 && <div>{Array.from({ length: item.documentCount }, (_, index) => <button type="button" key={index} className="secondary-button" onClick={() => openDocument(item._id, index)}>{t("blacklistOpenDocument", { number: index + 1 })}</button>)}</div>}
        <div className="blacklist-actions"><button type="button" disabled={actionId === item._id} onClick={() => moderate(item._id, "approved")}>{t("blacklistApprove")}</button><button type="button" className="secondary-button" disabled={actionId === item._id} onClick={() => moderate(item._id, "rejected")}>{t("blacklistReject")}</button><button type="button" className="danger-button" disabled={actionId === item._id} onClick={() => deleteEntry(item._id)}>{t("blacklistDelete")}</button></div>
      </article>) : <p>{t("blacklistNoReviews")}</p>}
    </section>}

    {role === "user" && mine.length > 0 && <section className="booking-panel"><h2>{t("blacklistMySubmissions")}</h2>{mine.map((item) => <p key={item._id}>{item.name} · {t(`blacklistStatus_${item.status}`)}</p>)}</section>}
    <section className="blacklist-list" aria-live="polite">
      <h2>{t("blacklistApprovedTitle")}</h2>
      {loading ? <p>{t("loading")}</p> : entries.length ? entries.map((item) => <article className="booking-panel blacklist-card" key={item._id}>
        {item.photoUrl && <img className="blacklist-photo" src={apiUrl(item.photoUrl)} alt={t("blacklistPhotoAlt", { name: item.name })} />}
        <h3>{item.name}</h3><p>{item.nationality}{item.age ? ` · ${item.age}` : ""}</p><h4>{t("blacklistReason")}</h4><p>{item.reason}</p>
        {role === "admin" && <div className="blacklist-actions"><button type="button" className="danger-button" disabled={actionId === item._id} onClick={() => deleteEntry(item._id)}>{t("blacklistDelete")}</button></div>}
      </article>) : <p className="notice">{t("blacklistEmpty")}</p>}
    </section>
  </main>;
}

export default Blacklist;
