import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./i18n";

function AvailableBabysitters() {
  const [babysitters, setBabysitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const fetchBabysitters = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://babysitter-booking-backend-8e0cb4081e09.herokuapp.com/api/babysitter"
      );
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setBabysitters(data);
      } else {
        console.error("Unexpected API response format:", data);
        alert(
          t("unexpectedResponse") || "Unexpected response from the server."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert(
        t("errorFetchingBabysitters") ||
          "An error occurred while fetching babysitters. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBabysitters();
  }, [t]);

  if (loading) {
    return <p>{t("loading") || "Loading..."}</p>;
  }

  if (babysitters.length === 0) {
    return (
      <p>
        {t("noBabysittersAvailable") ||
          "No babysitters are currently available."}
      </p>
    );
  }

  return (
    <div className="container">
      <h1>{t("availableBabysitters") || "Available Babysitters"}</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #ccc",
        }}
      >
        <thead>
          <tr>
            <th>{t("name")}</th>
            <th>{t("servicesProvided")}</th>
            <th>{t("age")}</th>
            <th>{t("nationality")}</th>
            <th>{t("phone")}</th>
          </tr>
        </thead>
        <tbody>
          {babysitters.map((babysitter, index) => (
            <tr key={index}>
              <td>{babysitter.name}</td>
              <td>
                {Array.isArray(babysitter.services)
                  ? babysitter.services.join(", ")
                  : t("noServices") || "No services listed"}
              </td>
              <td>{babysitter.age}</td>
              <td>{babysitter.nationality}</td>
              <td>{babysitter.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AvailableBabysitters;
