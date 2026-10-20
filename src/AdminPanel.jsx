import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./api";
import "./i18n";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [sitters, setSitters] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [accountDetails, setAccountDetails] = useState(null);
  const [reviewProfile, setReviewProfile] = useState(null);
  const [reviewPhoto, setReviewPhoto] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: "", email: "", password: "" });
  const [viewingDocument, setViewingDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      alert(t("loginRequired"));
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/admin/users"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
      });

      if (response.ok) {
        const data = await response.json();
        const users = Array.isArray(data) ? data : data.users;

        if (!Array.isArray(users)) {
          alert(t("unexpectedResponse"));
          return;
        }

        setUsers(users);
      } else if (response.status === 401) {
        alert(t("sessionExpired"));
        navigate("/login");
      } else {
        alert(t("failedToFetchUsers"));
      }
      const sitterResponse = await fetch(apiUrl("/api/admin/babysitters"), { headers: { Authorization: `Bearer ${token}` } });
      const sitterData = await sitterResponse.json().catch(() => []);
      if (sitterResponse.ok && Array.isArray(sitterData)) setSitters(sitterData);
      const [auditResponse, adminResponse] = await Promise.all([
        fetch(apiUrl("/api/admin/audit-logs"), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl("/api/admin/admins"), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const auditData = await auditResponse.json().catch(() => []);
      if (auditResponse.ok && Array.isArray(auditData)) setAuditLogs(auditData);
      const adminData = await adminResponse.json().catch(() => []);
      if (adminResponse.ok && Array.isArray(adminData)) {
        setAdmins(adminData);
        setIsSuperAdmin(true);
      } else {
        setAdmins([]);
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t("errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(apiUrl("/api/admin/admins"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(newAdmin),
      });
      if (response.status === 409) { alert(t("adminUsernameExists")); return; }
      if (!response.ok) { alert(t("createAdminError")); return; }
      setNewAdmin({ username: "", email: "", password: "" });
      fetchUsers();
    } catch (_) { alert(t("createAdminError")); }
  };

  const viewUserDetails = async (user) => {
    setDetailsError("");
    setAccountDetails({ user, loading: true });
    try {
      const response = await fetch(apiUrl(`/api/admin/users/${user._id}/details`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("detailsLoadError");
      setAccountDetails({ user, ...(await response.json()), loading: false });
    } catch (_) {
      setDetailsError(t("detailsLoadError"));
      setAccountDetails({ user, loading: false });
    }
  };

  const moderateSitter = async (sitterId, status) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(apiUrl(`/api/admin/babysitters/${sitterId}/moderation`), {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }),
      });
      if (!response.ok) { alert(t("moderationUpdateError")); return; }
      fetchUsers();
    } catch (_) { alert(t("moderationUpdateError")); }
  };

  const openDocument = async (sitterId, kind, title, sitterName) => {
    const token = localStorage.getItem("token");
    setViewingDocument({
      title: title || t(kind === "photo" ? "optionalPhoto" : kind),
      sitterName: sitterName || "",
      url: "",
      isPdf: false,
      loading: true,
      error: "",
    });
    try {
      const response = await fetch(apiUrl(`/api/admin/babysitters/${sitterId}/documents/${kind}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.msg || t("documentLoadError"));
      }
      const blob = await response.blob();
      const contentType = response.headers.get("content-type") || blob.type || "";
      const isPdf = contentType.toLowerCase().includes("pdf");
      const objectUrl = URL.createObjectURL(blob);
      setViewingDocument((prev) => (prev ? {
        ...prev,
        url: objectUrl,
        isPdf,
        loading: false,
        error: "",
      } : null));
    } catch (err) {
      setViewingDocument((prev) => (prev ? {
        ...prev,
        loading: false,
        error: err.message || t("documentLoadError"),
      } : null));
    }
  };

  const closeDocumentViewer = () => {
    if (viewingDocument?.url) {
      URL.revokeObjectURL(viewingDocument.url);
    }
    setViewingDocument(null);
  };

  const removeSitter = async (sitterId) => {
    if (!window.confirm(t("confirmDeleteSitter"))) return;
    try {
      const response = await fetch(apiUrl(`/api/admin/babysitters/${sitterId}`), { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!response.ok) { alert(t("deleteSitterError")); return; }
      fetchUsers();
    } catch (_) { alert(t("deleteSitterError")); }
  };

  const deleteUser = async (userId) => {
    const token = localStorage.getItem("token");
    setDeletingUserId(userId);

    try {
      const response = await fetch(apiUrl(`/api/admin/users/${userId}`), {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
      });

      if (!response.ok) {
        alert(t("failedToDeleteUser"));
        return;
      }

      setUserToDelete(null);
      // Refresh the list after deletion
      fetchUsers();
    } catch (error) {
      console.error("Error:", error);
      alert(t("errorOccurredWhileDeleting"));
    } finally {
      setDeletingUserId("");
    }
  };

  const confirmAndDeleteUser = (user) => setUserToDelete(user);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!accountDetails && !reviewProfile && !userToDelete && !viewingDocument) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setAccountDetails(null);
        setReviewProfile(null);
        setUserToDelete(null);
        if (viewingDocument?.url) URL.revokeObjectURL(viewingDocument.url);
        setViewingDocument(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [accountDetails, reviewProfile, userToDelete, viewingDocument]);

  useEffect(() => {
    if (!reviewProfile?.verificationDocuments?.photo) {
      setReviewPhoto("");
      return undefined;
    }
    const controller = new AbortController();
    let objectUrl = "";
    setReviewPhoto("");
    fetch(apiUrl(`/api/admin/babysitters/${reviewProfile._id}/documents/photo`), {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Profile photo request failed");
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setReviewPhoto(objectUrl);
      })
      .catch((photoError) => {
        if (photoError.name !== "AbortError") setReviewPhoto("");
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reviewProfile]);

  if (loading) {
    return <p>{t("loading") || "Loading..."}</p>;
  }

  return (
    <div className="container">
      <h1>{t("adminPanel")}</h1>
      {isSuperAdmin && <section className="booking-panel">
        <h2>{t("adminManagement")}</h2>
        <form className="form-actions" onSubmit={createAdmin}>
          <input aria-label={t("username")} placeholder={t("username")} autoComplete="off" value={newAdmin.username} onChange={(event) => setNewAdmin({ ...newAdmin, username: event.target.value })} required />
          <input aria-label={t("email")} placeholder={t("email")} type="email" autoComplete="email" value={newAdmin.email} onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })} required />
          <input aria-label={t("password")} placeholder={t("adminTemporaryPassword")} type="password" autoComplete="new-password" minLength={8} value={newAdmin.password} onChange={(event) => setNewAdmin({ ...newAdmin, password: event.target.value })} required />
          <button type="submit">{t("createAdmin")}</button>
        </form>
        <h3>{t("admins")}</h3>
        {admins.map((admin) => <p key={admin._id}>{admin.username}{admin.isSuperUser ? ` · ${t("superAdmin")}` : ""}</p>)}
      </section>}
      <section className="booking-panel">
        <h2>{t("sitterReview")}</h2>
        {sitters.length === 0 ? <p>{t("noSittersForReview")}</p> : <div className="booking-list">{sitters.map((sitter) => <article className="booking-card" key={sitter._id}>
          <h3>{sitter.name} <small>({sitter.userId?.username})</small></h3>
          <p>{t("moderationStatus")}: {t(`moderation_${sitter.moderationStatus || "pending"}`)}</p>
          <p>{t("nationalityType")}: {sitter.nationalityType === "other" ? t("otherNationality") : t("egyptian")}</p>
          <div className="admin-document-links">
            {[
              ["photo", "optionalPhoto"],
              ...(sitter.nationalityType === "other"
                ? [["passport", "passportUpload"], ["residency", "residencyUpload"]]
                : [["nationalId", "nationalIdUpload"]])
            ].map(([kind, label]) => (
              <button
                type="button"
                disabled={!sitter.verificationDocuments?.[kind]}
                key={kind}
                onClick={() => openDocument(sitter._id, kind, t(label), sitter.name)}
              >
                {t(label)}{sitter.verificationDocuments?.[kind] ? " ✓" : ` · ${t("missing")}`}
              </button>
            ))}
          </div>
          <button className="review-profile-button" type="button" onClick={() => setReviewProfile(sitter)}>{t("viewCaregiverProfile")}</button>
          <div className="form-actions">{sitter.moderationStatus !== "approved" && <button type="button" onClick={() => moderateSitter(sitter._id, "approved")}>{t("approve")}</button>}{sitter.moderationStatus !== "unapproved" && <button type="button" onClick={() => moderateSitter(sitter._id, "unapproved")}>{t("unapprove")}</button>}{sitter.moderationStatus !== "blacklisted" && <button type="button" onClick={() => moderateSitter(sitter._id, "blacklisted")}>{t("blacklist")}</button>}{isSuperAdmin && <button type="button" onClick={() => removeSitter(sitter._id)}>{t("removeProfile")}</button>}</div>
        </article>)}</div>}
      </section>
      {reviewProfile && <div className="photo-modal" role="presentation" onClick={() => setReviewProfile(null)}>
        <section className="caregiver-profile-modal" role="dialog" aria-modal="true" aria-labelledby="caregiver-review-profile-title" onClick={(event) => event.stopPropagation()}>
          <div className="caregiver-profile-modal-header">
            <h2 id="caregiver-review-profile-title">{t("babysitterProfile")}</h2>
            <button className="photo-modal-close" type="button" onClick={() => setReviewProfile(null)}>{t("close")}</button>
          </div>
          <div className="profile-intro">
            {reviewPhoto ? <img className="sitter-avatar large" src={reviewPhoto} alt={reviewProfile.name} /> : <div className="sitter-avatar large" aria-hidden="true">{(reviewProfile.name || "?").slice(0, 1).toLocaleUpperCase()}</div>}
            <div>
              <p className="eyebrow">{reviewProfile.userId?.username || ""}</p>
              <h3>{reviewProfile.name}</h3>
              <p>{t(`moderation_${reviewProfile.moderationStatus || "pending"}`)}</p>
            </div>
          </div>
          <dl className="profile-details caregiver-review-details">
            <div><dt>{t("email")}</dt><dd>{reviewProfile.userId?.email || t("notAvailable")}</dd></div>
            <div><dt>{t("phone")}</dt><dd>{reviewProfile.phone || t("notAvailable")}</dd></div>
            <div><dt>{t("age")}</dt><dd>{reviewProfile.age || t("notAvailable")}</dd></div>
            <div><dt>{t("nationality")}</dt><dd>{reviewProfile.nationality || t("notAvailable")}</dd></div>
            <div><dt>{t("city")}</dt><dd>{reviewProfile.city || t("notAvailable")}</dd></div>
            <div><dt>{t("monthlySalary")}</dt><dd>{reviewProfile.monthlySalary ?? t("notAvailable")} {reviewProfile.currency || ""}</dd></div>
            <div><dt>{t("servicesProvided")}</dt><dd>{(reviewProfile.services || []).filter((service) => service !== "studying").map((service) => t(service)).join(", ") || t("notAvailable")}</dd></div>
            <div><dt>{t("availability")}</dt><dd>{t(reviewProfile.available ? "availableForRequests" : "notTakingRequests")}</dd></div>
          </dl>
          <section className="caregiver-review-bio">
            <h3>{t("aboutYou")}</h3>
            <p>{reviewProfile.bio || t("notAvailable")}</p>
          </section>
          <section className="caregiver-review-uploads">
            <h3>{t("uploadedDocuments")}</h3>
            <p>{t("nationalityType")}: {reviewProfile.nationalityType === "other" ? t("otherNationality") : t("egyptian")}</p>
            <div className="admin-document-links" style={{ marginTop: "0.75rem" }}>
              {[
                ["photo", "optionalPhoto"],
                ...(reviewProfile.nationalityType === "other"
                  ? [["passport", "passportUpload"], ["residency", "residencyUpload"]]
                  : [["nationalId", "nationalIdUpload"]])
              ].map(([kind, label]) => (
                <button
                  type="button"
                  disabled={!reviewProfile.verificationDocuments?.[kind]}
                  key={kind}
                  onClick={() => openDocument(reviewProfile._id, kind, t(label), reviewProfile.name)}
                >
                  {t(label)}{reviewProfile.verificationDocuments?.[kind] ? " ✓" : ` · ${t("missing")}`}
                </button>
              ))}
            </div>
          </section>
        </section>
      </div>}
      <h2>{t("users")}</h2>
      {!users.length && <p>{t("noUsersFound")}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>{t("username")}</th>
            <th>{t("role")}</th>
            <th>{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.username}</td>
              <td>{t(user.role)}</td>
              <td>
                {(isSuperAdmin || user.role !== "user") && <button type="button" onClick={() => viewUserDetails(user)}>{t("viewDetails")}</button>}
                {(isSuperAdmin || user.role !== "user") && <button type="button" onClick={() => confirmAndDeleteUser(user)}>
                  {t("delete")}
                </button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {accountDetails && <div className="photo-modal account-details-backdrop" role="presentation" onClick={() => setAccountDetails(null)}>
        <section className="account-details-modal" role="dialog" aria-modal="true" aria-labelledby="account-details-title" onClick={(event) => event.stopPropagation()}>
        <div className="account-details-header"><h2 id="account-details-title">{t("accountDetails")}: {accountDetails.user.username}</h2><button type="button" onClick={() => setAccountDetails(null)}>{t("close")}</button></div>
        {accountDetails.loading ? <p>{t("loading")}</p> : detailsError ? <p className="form-error" role="alert">{detailsError}</p> : <>
          <dl className="profile-details">
            <div><dt>{t("username")}</dt><dd>{accountDetails.user.username}</dd></div>
            <div><dt>{t("role")}</dt><dd>{t(accountDetails.user.role)}</dd></div>
            {accountDetails.user.role !== "admin" && <div><dt>{t("name")}</dt><dd>{accountDetails.user.name || t("notAvailable")}</dd></div>}
            <div><dt>{t("email")}</dt><dd>{accountDetails.user.email || t("notAvailable")}</dd></div>
          </dl>
          {accountDetails.user.role === "user" && <section>
            <h3>{t("requestHistory")}</h3>
            {!accountDetails.requests?.length ? <p>{t("noBookingRequests")}</p> : <div className="booking-list">{accountDetails.requests.map((request) => <article className="booking-card" key={request._id}>
              <p><strong>{t(`status_${request.status}`)}</strong> · {t(request.service)} · {request.babysitterName || t("babysitter")}</p>
              <p>{new Date(request.startAt).toLocaleDateString(i18n.language, { timeZone: "UTC" })} – {new Date(request.endAt).toLocaleDateString(i18n.language, { timeZone: "UTC" })}</p>
              <p>{t("childrenCount")}: {request.childrenCount}</p>
              {request.notes && <p>{t("bookingNotes")}: {request.notes}</p>}
            </article>)}</div>}
          </section>}
          {accountDetails.user.role === "babysitter" && <section>
            <h3>{t("babysitterProfile")}</h3>
            {!accountDetails.profile ? <p>{t("profileNotFound")}</p> : <>
              <dl className="profile-details">
                <div><dt>{t("phone")}</dt><dd>{accountDetails.profile.phone || t("notAvailable")}</dd></div>
                <div><dt>{t("age")}</dt><dd>{accountDetails.profile.age || t("notAvailable")}</dd></div>
                <div><dt>{t("nationality")}</dt><dd>{accountDetails.profile.nationality || t("notAvailable")}</dd></div>
                <div><dt>{t("nationalityType")}</dt><dd>{t(accountDetails.profile.nationalityType === "other" ? "otherNationality" : "egyptian")}</dd></div>
                <div><dt>{t("city")}</dt><dd>{accountDetails.profile.city || t("notAvailable")}</dd></div>
                <div><dt>{t("monthlySalary")}</dt><dd>{accountDetails.profile.monthlySalary ?? t("notAvailable")} {accountDetails.profile.currency || ""}</dd></div>
                <div><dt>{t("servicesProvided")}</dt><dd>{(accountDetails.profile.services || []).filter((service) => service !== "studying").map((service) => t(service)).join(", ") || t("notAvailable")}</dd></div>
                <div><dt>{t("aboutYou")}</dt><dd>{accountDetails.profile.bio || t("notAvailable")}</dd></div>
                <div><dt>{t("availability")}</dt><dd>{t(accountDetails.profile.available ? "availableForRequests" : "notTakingRequests")}</dd></div>
                <div><dt>{t("approvalStatus")}</dt><dd>{t(`moderation_${accountDetails.profile.moderationStatus || "pending"}`)}</dd></div>
              </dl>
              <h4>{t("uploadedDocuments")}</h4>
              <div className="admin-document-links">{[["photo", "optionalPhoto"], ["nationalId", "nationalIdUpload"], ["passport", "passportUpload"], ["residency", "residencyUpload"]].map(([kind, label]) => <button key={kind} type="button" disabled={!accountDetails.documents?.[kind]} onClick={() => openDocument(accountDetails.profileId, kind, t(label), accountDetails.user.name || accountDetails.user.username)}>{t(label)}{accountDetails.documents?.[kind] ? " ✓" : ` · ${t("missing")}`}</button>)}</div>
            </>}
          </section>}
        </>}
        </section>
      </div>}
      {userToDelete && <div className="photo-modal account-details-backdrop" role="presentation" onClick={() => !deletingUserId && setUserToDelete(null)}>
        <section className="confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description" onClick={(event) => event.stopPropagation()}>
          <h2 id="delete-account-title">{t("deleteAccount")}</h2>
          <p id="delete-account-description">{t("confirmDeleteAccount", { username: userToDelete.username })}</p>
          <div className="confirmation-actions">
            <button type="button" className="secondary-button" disabled={Boolean(deletingUserId)} onClick={() => setUserToDelete(null)}>{t("cancel")}</button>
            <button type="button" className="danger-button" disabled={Boolean(deletingUserId)} onClick={() => deleteUser(userToDelete._id)}>{deletingUserId ? t("deleting") : t("delete")}</button>
          </div>
        </section>
      </div>}
      <section className="booking-panel">
        <h2>{t("adminActionHistory")}</h2>
        {!auditLogs.length ? <p>{t("noAdminActions")}</p> : <div className="booking-list">{auditLogs.map((entry) => <article className="booking-card" key={entry._id}>
          <p><strong>{t(`audit_${entry.action}`, entry.action)}</strong> · {entry.targetName || entry.targetUsername || entry.targetId || "—"}</p>
          {isSuperAdmin && <p>{t("adminActor")}: {entry.actorUsername}</p>}
          <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
        </article>)}</div>}
      </section>

      {viewingDocument && (
        <div className="photo-modal account-details-backdrop" role="presentation" onClick={closeDocumentViewer}>
          <section
            className="document-viewer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-viewer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="caregiver-profile-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <h2 id="doc-viewer-title" style={{ margin: 0 }}>{viewingDocument.title}</h2>
                {viewingDocument.sitterName && <p style={{ margin: "0.25rem 0 0", color: "#e2d9ea" }}>{viewingDocument.sitterName}</p>}
              </div>
              <button className="photo-modal-close" type="button" onClick={closeDocumentViewer}>
                {t("close")}
              </button>
            </div>

            <div className="document-viewer-content" style={{ minHeight: "280px", display: "grid", placeItems: "center", margin: "1rem 0" }}>
              {viewingDocument.loading && <p>{t("loading")}</p>}
              {viewingDocument.error && <p className="form-error" role="alert">{viewingDocument.error}</p>}
              {!viewingDocument.loading && !viewingDocument.error && viewingDocument.url && (
                viewingDocument.isPdf ? (
                  <iframe
                    src={viewingDocument.url}
                    title={viewingDocument.title}
                    style={{ width: "100%", height: "65vh", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", background: "#fff" }}
                  />
                ) : (
                  <img
                    src={viewingDocument.url}
                    alt={viewingDocument.title}
                    style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "8px" }}
                  />
                )
              )}
            </div>

            {!viewingDocument.loading && !viewingDocument.error && viewingDocument.url && (
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap", marginTop: "1rem" }}>
                <a
                  href={viewingDocument.url}
                  download={`${viewingDocument.sitterName || "caregiver"}-${viewingDocument.title}.${viewingDocument.isPdf ? "pdf" : "jpg"}`}
                  className="secondary-button"
                  style={{ display: "inline-block", padding: "0.6rem 1rem", borderRadius: "8px", textDecoration: "none" }}
                >
                  {t("download")}
                </a>
                <a
                  href={viewingDocument.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary-button"
                  style={{ display: "inline-block", padding: "0.6rem 1rem", borderRadius: "8px", textDecoration: "none" }}
                >
                  {t("openInNewTab")}
                </a>
                <button type="button" onClick={closeDocumentViewer}>
                  {t("close")}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
