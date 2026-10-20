import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";

function dateInputValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function minimumBookingDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return dateInputValue(date);
}

function BabysitterDetails() {
  const [babysitter, setBabysitter] = useState(null);
  const [photoSource, setPhotoSource] = useState("");
  const [photoOpen, setPhotoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingSent, setBookingSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [service, setService] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [childrenCount, setChildrenCount] = useState("1");
  const [notes, setNotes] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await fetch(apiUrl(`/api/babysitter/users/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?._id) {
          throw new Error(t("loadProfileError"));
        }
        setBabysitter(data);
        setService(data.services?.find((item) => item !== "studying") || "");
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(t("loadProfileError"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadProfile();
    return () => controller.abort();
  }, [id, navigate, t, token]);

  useEffect(() => {
    if (!photoOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPhotoOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [photoOpen]);

  useEffect(() => {
    if (!babysitter?.photoUrl) {
      setPhotoSource("");
      return undefined;
    }
    const controller = new AbortController();
    let objectUrl = "";
    setPhotoSource("");
    fetch(apiUrl(babysitter.photoUrl), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Profile photo request failed");
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
  }, [babysitter?.photoUrl, token]);

  const submitBooking = async (event) => {
    event.preventDefault();
    setBookingError("");
    setBookingSent(false);
    if (!token) {
      navigate("/login");
      return;
    }
    if (role !== "user") {
      setBookingError(t("parentAccountRequired"));
      return;
    }
    if (!startAt || !endAt || startAt < minimumBookingDate() || endAt < startAt) {
      setBookingError(t("chooseValidTime"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/bookings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          babysitterId: babysitter._id,
          service,
          startAt,
          endAt,
          childrenCount: Number(childrenCount),
          notes,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(t("bookingRequestError"));
      setBookingSent(true);
      setNotes("");
    } catch (requestError) {
      setBookingError(t("bookingRequestError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="container"><p className="notice">{t("loading")}</p></main>;
  if (error || !babysitter) {
    return <main className="container"><p className="form-error notice" role="alert">{error || t("loadProfileError")}</p></main>;
  }

  return (
    <main className="container details-layout">
      <section className="profile-card">
        <Link className="back-link" to="/available-babysitters">← {t("backToSitters")}</Link>
        <div className="profile-intro">
          {photoSource
            ? <button className="photo-open-button" type="button" onClick={() => setPhotoOpen(true)} aria-label={t("viewLargerPhoto", { name: babysitter.name })}>
              <img className="sitter-avatar large" src={photoSource} alt={babysitter.name} />
            </button>
            : <div className="sitter-avatar large" aria-hidden="true">{babysitter.name.slice(0, 1).toLocaleUpperCase()}</div>}
          <div>
            <p className="eyebrow">{t("babysitterProfile")}</p>
            <h1>{babysitter.name}</h1>
            <p className={babysitter.available ? "availability available" : "availability unavailable"}>
              {babysitter.available ? t("availableForRequests") : t("notTakingRequests")}
            </p>
            {babysitter.moderationStatus === "approved" && <p className="verification-badge">✓ {t("identityDocumentsReviewed")}</p>}
          </div>
        </div>
        <dl className="profile-facts">
          <div><dt>{t("age")}</dt><dd>{babysitter.age || t("notAvailable")}</dd></div>
          <div><dt>{t("nationality")}</dt><dd>{babysitter.nationality || t("notAvailable")}</dd></div>
          <div><dt>{t("city")}</dt><dd>{babysitter.city || t("notAvailable")}</dd></div>
          <div><dt>{t("monthlySalary")}</dt><dd>{babysitter.monthlySalary != null ? `${babysitter.monthlySalary.toLocaleString()} ${babysitter.currency || "EGP"} ${t("perMonth")}` : t("notAvailable")}</dd></div>
          <div><dt>{t("servicesProvided")}</dt><dd>{babysitter.services?.filter((item) => item !== "studying").map((item) => t(item)).join(", ") || t("servicesNotListed")}</dd></div>
        </dl>
        {babysitter.bio && <p className="profile-bio">{babysitter.bio}</p>}
      </section>

      {photoOpen && photoSource && <div className="photo-modal" role="presentation" onClick={() => setPhotoOpen(false)}>
        <section className="photo-modal-content" role="dialog" aria-modal="true" aria-label={t("viewLargerPhoto", { name: babysitter.name })} onClick={(event) => event.stopPropagation()}>
          <button className="photo-modal-close" type="button" onClick={() => setPhotoOpen(false)}>{t("close")}</button>
          <img src={photoSource} alt={babysitter.name} />
        </section>
      </div>}

      {role === "user" && babysitter.available && (
        <section className="booking-panel">
          <p className="eyebrow">{t("requestCare")}</p>
          <h2>{t("bookThisBabysitter")}</h2>
          <p className="muted">{t("bookingRequestHelp")}</p>
          {bookingSent && (
            <div className="success-message" role="status">
              <p>{t("bookingRequestSent")}</p>
              <Link to="/bookings">{t("viewMyBookings")}</Link>
            </div>
          )}
          {bookingError && <p className="form-error" role="alert">{bookingError}</p>}
          <form onSubmit={submitBooking}>
            <label htmlFor="booking-service">{t("service")}</label>
            <select id="booking-service" value={service} onChange={(event) => setService(event.target.value)} required>
              {babysitter.services?.filter((item) => item !== "studying").map((item) => <option key={item} value={item}>{t(item)}</option>)}
            </select>
            <label htmlFor="booking-start">{t("startDateTime")}</label>
            <input id="booking-start" type="date" min={minimumBookingDate()} value={startAt} onChange={(event) => setStartAt(event.target.value)} required />
            <label htmlFor="booking-end">{t("endDateTime")}</label>
            <input id="booking-end" type="date" min={startAt || minimumBookingDate()} value={endAt} onChange={(event) => setEndAt(event.target.value)} required />
            <label htmlFor="children-count">{t("childrenCount")}</label>
            <input id="children-count" type="number" min="1" max="10" value={childrenCount} onChange={(event) => setChildrenCount(event.target.value)} required />
            <label htmlFor="booking-notes">{t("bookingNotes")}</label>
            <textarea id="booking-notes" maxLength="1000" rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("bookingNotesHint")} />
            <button type="submit" disabled={submitting || !service || !babysitter.services?.length}>
              {submitting ? t("sendingRequest") : t("sendBookingRequest")}
            </button>
          </form>
        </section>
      )}
      {role === "user" && !babysitter.available && <p className="notice">{t("notTakingRequests")}</p>}
      {role === "babysitter" && <p className="notice">{t("sitterCannotBook")}</p>}
      {role === "admin" && <p className="notice">{t("parentAccountRequired")}</p>}
      {!role && <p className="notice"><Link to="/login">{t("signInToRequest")}</Link> {t("bookingRequestHelp")}</p>}
    </main>
  );
}

export default BabysitterDetails;
