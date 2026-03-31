import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "./App.css";
import "./i18n";

function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // State for form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://babysitter-booking-backend-8e0cb4081e09.herokuapp.com/api/user/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Login successful!");
        localStorage.setItem("token", data.token); // Store the token

        const role = data.user.role; // Assuming the response includes the user's role
        if (role === "babysitter") {
          navigate("/edit-profile");
        } else if (role === "admin") {
          navigate("/admin-panel");
        } else {
          navigate("/available-babysitters"); // Redirect normal users to babysitters page
        }
      } else {
        alert(data.msg || "Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container">
      {/* Welcome Message */}
      <h1>{t("welcome")}</h1>

      {/* Login Section */}
      <div className="parent" id="login">
        <h2>{t("login")}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t("username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{t("login")}</button>
        </form>
        <p>
          {t("dontHaveAccount")} <a href="/register">{t("registerHere")}</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
