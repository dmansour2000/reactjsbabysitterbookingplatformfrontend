import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./i18n";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `https://babysitter-booking-backend-8e0cb4081e09.herokuapp.com/api/${role}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, name }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Registration successful!");
        localStorage.setItem("token", data.token);

        // Redirect based on the role
        if (role === "babysitter") {
          navigate("/edit-profile");
        } else {
          navigate("/available-babysitters"); // Redirect normal users to babysitters page
        }
      } else {
        alert(data.msg || "Registration failed");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="container">
      <h1>{t("createAccount")}</h1>
      <div id="register">
        <h2>{t("register")}</h2>
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            maxWidth: "300px",
          }}
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("username")}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password")}
            required
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            required
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user" data-i18n="user">
              {t("user")}
            </option>
            <option value="babysitter" data-i18n="babysitter">
              {t("babysitter")}
            </option>
          </select>
          <button type="submit" data-i18n="register">
            {t("register")}
          </button>
        </form>
        <p>{t("alreadyHaveAccount")}</p>
        <a href="/login" data-i18n="loginHere">
          {t("loginHere")}
        </a>
      </div>
    </div>
  );
}

export default Register;
