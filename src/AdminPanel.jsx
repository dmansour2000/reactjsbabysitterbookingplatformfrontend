import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "./i18n";

function AdminPanel() {
  const [users, setUsers] = useState([]);
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
      const response = await fetch(
        "https://babysitter-booking-backend-8e0cb4081e09.herokuapp.com/api/user/users",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  const deleteUser = async (userId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `https://babysitter-booking-backend-8e0cb4081e09.herokuapp.com/api/user/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  if (!users || users.length === 0) {
    return <p>{t("noUsersFound") || "No users found."}</p>;
  }

  return (
    <div className="container">
      <h1>{t("adminPanel")}</h1>
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
