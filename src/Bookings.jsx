import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isSitter = role === "babysitter";

  const loadBookings = useCallback(async (signal) => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/bookings"), {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data.msg || t("loadBookingsError"));
      }
      setBookings(data);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message || t("loadBookingsError"));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [navigate, t, token]);

  useEffect(() => {
    const controller = new AbortController();
    loadBookings(controller.signal);
    return () => controller.abort();
  }, [loadBookings]);

  const updateStatus = async (bookingId, status) => {
    setBusyId(bookingId);
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/bookings/${bookingId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.msg || t("updateBookingError"));
      setBookings((current) => current.map((booking) => booking._id === bookingId ? data : booking));
    } catch (updateError) {
      setError(updateError.message || t("updateBookingError"));
    } finally {
      setBusyId("");
    }
  };

  const formatDate = (value) => new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

  const title = isSitter ? t("bookingRequests") : t("myBookings");

  return (
    <main className="container bookings-page">
      <div className="page-heading">
        <p className="eyebrow">{t("bookingDashboard")}</p>
        <h1>{title}</h1>
        <p>{isSitter ? t("sitterBookingsDescription") : t("parentBookingsDescription")}</p>
      </div>
      {error && <p className="form-error notice" role="alert">{error}</p>}
      {loading && <p className="notice">{t("loadingBookings")}</p>}
      {!loading && !error && bookings.length === 0 && (
        <section className="empty-state">
          <h2>{isSitter ? t("noBookingRequests") : t("noBookingsYet")}</h2>
          <p>{isSitter ? t("sitterBookingsEmpty") : t("parentBookingsEmpty")}</p>
          {!isSitter && <Link className="primary-link" to="/available-babysitters">{t("findBabysitters")}</Link>}
        </section>
      )}

      <div className="booking-list">
        {bookings.map((booking) => {
          const sitter = booking.babysitterId || {};
          const parent = booking.parentId || {};
          const otherParty = isSitter
            ? (parent.name || parent.username || t("parent"))
            : (sitter.name || t("babysitter"));
          return (
            <article className="booking-card" key={booking._id}>
              <div className="booking-card-header">
                <div>
                  <p className="eyebrow">{isSitter ? t("bookingFrom") : t("bookingWith")}</p>
                  <h2>{otherParty}</h2>
                </div>
                <span className={`status-badge status-${booking.status}`}>{t(`status_${booking.status}`)}</span>
              </div>
              <dl className="booking-facts">
                <div><dt>{t("service")}</dt><dd>{t(booking.service)}</dd></div>
                <div><dt>{t("startDateTime")}</dt><dd>{formatDate(booking.startAt)}</dd></div>
                <div><dt>{t("endDateTime")}</dt><dd>{formatDate(booking.endAt)}</dd></div>
                <div><dt>{t("childrenCount")}</dt><dd>{booking.childrenCount}</dd></div>
                {isSitter && parent.username && <div><dt>{t("parentUsername")}</dt><dd>{parent.username}</dd></div>}
                {!isSitter && sitter.phone && <div><dt>{t("phone")}</dt><dd>{sitter.phone}</dd></div>}
              </dl>
              {booking.notes && <p className="booking-notes"><strong>{t("bookingNotes")}:</strong> {booking.notes}</p>}
              <div className="booking-actions">
                {isSitter && booking.status === "pending" && <>
                  <button disabled={busyId === booking._id} onClick={() => updateStatus(booking._id, "accepted")}>{t("acceptBooking")}</button>
                  <button className="secondary-button" disabled={busyId === booking._id} onClick={() => updateStatus(booking._id, "declined")}>{t("declineBooking")}</button>
                </>}
                {!isSitter && ["pending", "accepted"].includes(booking.status) && (
                  <button className="secondary-button" disabled={busyId === booking._id} onClick={() => updateStatus(booking._id, "cancelled")}>{t("cancelBooking")}</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default Bookings;
