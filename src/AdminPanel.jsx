import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./api";
import "./i18n";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [sitters, setSitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      alert(t("loginRequired") || "You must be logged in to view this page.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/user/users"), {
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
          alert(t("unexpectedResponse") || "Unexpected response format.");
          return;
        }

        setUsers(users);
      } else if (response.status === 401) {
        alert(
          t("sessionExpired") ||
            "Your session has expired. Please log in again."
        );
        navigate("/login");
      } else {
        alert(
          t("failedToFetchUsers") ||
            "Failed to fetch users. Please try again later."
        );
      }
      const sitterResponse = await fetch(apiUrl("/api/admin/babysitters"), { headers: { Authorization: `Bearer ${token}` } });
      const sitterData = await sitterResponse.json().catch(() => []);
      if (sitterResponse.ok && Array.isArray(sitterData)) setSitters(sitterData);
    } catch (error) {
      console.error("Error:", error);
      alert(
        t("errorOccurred") ||
          "An error occurred while fetching users. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const moderateSitter = async (sitterId, status) => {
    const token = localStorage.getItem("token");
    const response = await fetch(apiUrl(`/api/admin/babysitters/${sitterId}/moderation`), {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { alert(data.msg || t("moderationUpdateError")); return; }
    fetchUsers();
  };

  const openDocument = async (sitterId, kind) => {
    const token = localStorage.getItem("token");
    const response = await fetch(apiUrl(`/api/admin/babysitters/${sitterId}/documents/${kind}`), { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { alert(t("documentLoadError")); return; }
    const objectUrl = URL.createObjectURL(await response.blob());
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  };

  const removeSitter = async (sitterId) => {
    if (!window.confirm(t("confirmDeleteSitter"))) return;
    const response = await fetch(apiUrl(`/api/admin/babysitters/${sitterId}`), { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    if (!response.ok) { alert(t("deleteSitterError")); return; }
    fetchUsers();
  };

  const deleteUser = async (userId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(apiUrl(`/api/user/users/${userId}`), {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
      });

      if (!response.ok) {
        alert(
          t("failedToDeleteUser") ||
            "Failed to delete user. Please try again later."
        );
        return;
      }

      // Refresh the list after deletion
      fetchUsers();
    } catch (error) {
      console.error("Error:", error);
      alert(
        t("errorOccurredWhileDeleting") ||
          "An error occurred while deleting the user. Please try again later."
      );
    }
  };

  const confirmAndDeleteUser = (userId) => {
    if (
      window.confirm(
        t("confirmDelete") || "Are you sure you want to delete this user?"
      )
    ) {
      deleteUser(userId);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <p>{t("loading") || "Loading..."}</p>;
  }

  return (
    <div className="container">
      <h1>{t("adminPanel")}</h1>
      <section className="booking-panel">
        <h2>{t("sitterReview")}</h2>
        {sitters.length === 0 ? <p>{t("noSittersForReview")}</p> : <div className="booking-list">{sitters.map((sitter) => <article className="booking-card" key={sitter._id}>
          <h3>{sitter.name} <small>({sitter.userId?.username})</small></h3>
          <p>{t("moderationStatus")}: {t(`moderation_${sitter.moderationStatus || "pending"}`)}</p>
          <p>{t("nationalityType")}: {sitter.nationalityType === "other" ? t("otherNationality") : t("egyptian")}</p>
          <div className="admin-document-links">{(sitter.nationalityType === "other" ? [["passport", "passportUpload"], ["residency", "residencyUpload"]] : [["nationalId", "nationalIdUpload"]]).map(([kind, label]) => <button type="button" disabled={!sitter.verificationDocuments?.[kind]} key={kind} onClick={() => openDocument(sitter._id, kind)}>{t(label)}{sitter.verificationDocuments?.[kind] ? " ✓" : ` · ${t("missing")}`}</button>)}</div>
          <div className="form-actions">{sitter.moderationStatus !== "approved" && <button type="button" onClick={() => moderateSitter(sitter._id, "approved")}>{t("approve")}</button>}{sitter.moderationStatus !== "unapproved" && <button type="button" onClick={() => moderateSitter(sitter._id, "unapproved")}>{t("unapprove")}</button>}{sitter.moderationStatus !== "blacklisted" && <button type="button" onClick={() => moderateSitter(sitter._id, "blacklisted")}>{t("blacklist")}</button>}<button type="button" onClick={() => removeSitter(sitter._id)}>{t("removeProfile")}</button></div>
        </article>)}</div>}
      </section>
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
              <td>{user.role}</td>
              <td>
                {user.role === "babysitter" && (
                  <a
                    href={`/view-user/${user._id}`}
                    style={{ marginRight: "10px" }}
                  >
                    {t("viewDetails") || "View Details"}
                  </a>
                )}
                <button onClick={() => confirmAndDeleteUser(user._id)}>
                  {t("delete") || "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;
