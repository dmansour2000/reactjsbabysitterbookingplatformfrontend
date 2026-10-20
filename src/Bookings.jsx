import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [approvalNotes, setApprovalNotes] = useState({});
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isSitter = role === "babysitter";
  const isParent = role === "user";

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
        throw new Error(t("loadBookingsError"));
      }
      setBookings(data);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(t("loadBookingsError"));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [navigate, t, token]);

  useEffect(() => {
    const controller = new AbortController();
    loadBookings(controller.signal);
    return () => controller.abort();
  }, [loadBookings]);

  const updateStatus = async (bookingId, status, caregiverNotes = "") => {
    if (status === "cancelled" && !window.confirm(t("confirmCancelBooking"))) return;
    setBusyId(bookingId);
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/bookings/${bookingId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, ...(status === "accepted" && isSitter ? { caregiverNotes } : {}) }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) {
        setError(status === "accepted"
          ? t("anotherBookingApproved")
          : status === "pending" && isParent
            ? t("reactivateBookingError")
            : t("updateBookingError"));
        return;
      }
      if (!response.ok) throw new Error(t("updateBookingError"));
      setBookings((current) => current.map((booking) => booking._id === bookingId ? data : booking));
    } catch (_) {
      setError(t("updateBookingError"));
    } finally {
      setBusyId("");
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm(t("confirmDeleteBooking"))) return;
    setBusyId(bookingId);
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/bookings/${bookingId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(t("deleteBookingError"));
      setBookings((current) => current.filter((booking) => booking._id !== bookingId));
    } catch (_) {
      setError(t("deleteBookingError"));
    } finally {
      setBusyId("");
    }
  };

  const formatDate = (value) => new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
    timeZone: "UTC",
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
          const hasOtherApprovedRequest = isSitter && bookings.some((item) =>
            item._id !== booking._id
            && item.status === "accepted"
            && new Date(item.endAt).getTime() > Date.now()
          );
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
                {isParent && booking.status === "accepted" && sitter.phone && <div><dt>{t("phone")}</dt><dd><a href={`tel:${sitter.phone}`}>{sitter.phone}</a></dd></div>}
              </dl>
              {booking.notes && <p className="booking-notes"><strong>{t("bookingNotes")}:</strong> {booking.notes}</p>}
              {isParent && booking.status === "accepted" && booking.caregiverNotes && (
                <p className="booking-notes"><strong>{t("caregiverResponseNote")}:</strong> {booking.caregiverNotes}</p>
              )}
              <div className="booking-actions">
                {isSitter && booking.status === "pending" && <>
                  <label className="booking-note-label" htmlFor={`caregiver-note-${booking._id}`}>{t("caregiverApprovalNote")}</label>
                  <textarea
                    className="booking-approval-note"
                    id={`caregiver-note-${booking._id}`}
                    maxLength="1000"
                    rows="2"
                    value={approvalNotes[booking._id] || ""}
                    onChange={(event) => setApprovalNotes((current) => ({ ...current, [booking._id]: event.target.value }))}
                  />
                  <button disabled={busyId === booking._id || hasOtherApprovedRequest} onClick={() => updateStatus(booking._id, "accepted", approvalNotes[booking._id] || "")}>{t("acceptBooking")}</button>
                  <button className="secondary-button" disabled={busyId === booking._id} onClick={() => updateStatus(booking._id, "declined")}>{t("declineBooking")}</button>
                  {hasOtherApprovedRequest && <p className="booking-action-hint">{t("anotherBookingApproved")}</p>}
                </>}
                {isSitter && booking.status === "accepted" && (
                  <div className="booking-approval-actions">
                    <button className="secondary-button" disabled={busyId === booking._id} onClick={() => updateStatus(booking._id, "pending")}>{t("cancelApproval")}</button>
                    <p className="booking-action-hint">{t("cancelApprovalHelp")}</p>
                  </div>
                )}
                {isParent && ["pending", "accepted"].includes(booking.status) && (
                  <button className="secondary-button" disabled={busyId === booking._id} onClick={() => updateStatus(booking._id, "cancelled")}>{t("cancelBooking")}</button>
                )}
                {isParent && booking.status === "cancelled" && (
                  <button disabled={busyId === booking._id} onClick={() => updateStatus(booking._id, "pending")}>{t("reactivateBooking")}</button>
                )}
                {isParent && (
                  <button className="secondary-button" disabled={busyId === booking._id} onClick={() => deleteBooking(booking._id)}>{t("deleteBooking")}</button>
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
