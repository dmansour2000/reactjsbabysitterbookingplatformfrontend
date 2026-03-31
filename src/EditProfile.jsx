import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./i18n";

function EditProfile() {
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("");
  const [services, setServices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleServiceChange = (e) => {
    const value = e.target.value;
    setServices((prevServices) =>
      e.target.checked
        ? [...prevServices, value]
        : prevServices.filter((service) => service !== value)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const profileData = { phone, age, nationality, services };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to update your profile.");
        return;
      }

      const response = await fetch(
        "https://babysitter-booking-backend-8e0cb4081e09.herokuapp.com/api/babysitter/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        setError(data.msg || "Failed to update profile");
      }
    } catch (error) {
      setError("Error updating profile.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>{t("editProfile")}</h1>
      <form
        onSubmit={handleSubmit}
        style={{ border: "1px solid #ccc", padding: "20px", maxWidth: "400px" }}
      >
        {error && <p style={{ color: "red" }}>{error}</p>}

        <label htmlFor="phone">{t("mobilePhone")}</label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("mobilePhone") || "Enter your phone number"}
          required
        />

        <label htmlFor="age">{t("age")}</label>
        <input
          type="number"
          id="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder={t("age") || "Enter your age"}
          required
        />

        <label htmlFor="nationality">{t("nationality")}</label>
        <input
          type="text"
          id="nationality"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder={t("nationality") || "Enter your nationality"}
          required
        />

        <label data-i18n="servicesProvided">Services Provided:</label>
        <div
          className="checkbox-group"
          style={{ display: "flex", flexDirection: "column" }}
        >
          {["cleaning", "babysitting", "cooking", "studying"].map((service) => (
            <label key={service}>
              <input
                type="checkbox"
                value={service}
                checked={services.includes(service)}
                onChange={handleServiceChange}
              />
              {t(service) || service.charAt(0).toUpperCase() + service.slice(1)}
            </label>
          ))}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("saving") || "Saving..."
            : t("saveChanges") || "Save Changes"}
        </button>
      </form>
    </div>
  );
}

export default EditProfile;
