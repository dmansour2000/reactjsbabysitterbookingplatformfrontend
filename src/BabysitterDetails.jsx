import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./i18n";
import { useParams, useNavigate } from "react-router-dom";

function BabysitterDetails() {
  const [babysitter, setBabysitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchBabysitterDetails = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert(
        t("loginRequired") || "You need to be logged in to view this page."
      );
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `https://babysitter-booking-backend-8e0cb4081e09.herokuapp.com/api/babysitter/users/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const user = await response.json();
        setBabysitter(user);
      } else if (response.status === 401) {
        alert(
          t("sessionExpired") ||
            "Your session has expired. Please log in again."
        );
        navigate("/login");
      } else {
        alert(
          t("fetchError") ||
            "Failed to fetch babysitter details. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert(
        t("errorOccurred") ||
          "An error occurred while fetching babysitter details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBabysitterDetails();
  }, [id, navigate]);

  if (loading) {
    return <p>{t("loading") || "Loading..."}</p>;
  }

  if (!babysitter || Object.keys(babysitter).length === 0) {
    return (
      <p>{t("noBabysitterDetails") || "No babysitter details available."}</p>
    );
  }

  return (
    <div className="container">
      <div
        className="user-details"
        style={{
          maxWidth: "600px",
          margin: "20px auto",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <h2>{t("babysitterDetails")}</h2>
        <p>
          <strong>{t("name")}</strong>{" "}
          <span>{babysitter.name || t("notAvailable")}</span>
        </p>
        <p>
          <strong>{t("phone")}</strong>{" "}
          <span>{babysitter.phone || t("notAvailable")}</span>
        </p>
        <p>
          <strong>{t("nationality")}</strong>{" "}
          <span>{babysitter.nationality || t("notAvailable")}</span>
        </p>
        <p>
          <strong>{t("services")}</strong>
          <span>
            {babysitter.services?.join(", ") || t("noServicesProvided")}
          </span>
        </p>
      </div>
    </div>
  );
}

export default BabysitterDetails;
