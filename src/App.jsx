import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import BabysitterDetails from "./BabysitterDetails";
import AdminPanel from "./AdminPanel";
import AvailableBabysitters from "./AvailableBabysitters";
import EditProfile from "./EditProfile";
import Home from "./Home"; // Login page component
import About from "./About"; // About page component
import Contact from "./Contact"; // Contact page component
import Services from "./Services"; // Services page component
import Bookings from "./Bookings";
import Policies from "./Policies";
import "./App.css";
import "./i18n";

function App() {
  const { t, i18n } = useTranslation();
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  useEffect(() => {
    const syncRole = () => setRole(localStorage.getItem("role"));
    window.addEventListener("auth-change", syncRole);
    return () => window.removeEventListener("auth-change", syncRole);
  }, []);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("language", language);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRole(null);
  };

  return (
    <div id="Canvas" className="bg-img">
      <div className="language-switcher">
        <button onClick={() => changeLanguage("en")}>English</button>
        <button onClick={() => changeLanguage("ar")}>عربي</button>
      </div>
      <Router>
        <header className="app-header">
          <Link className="brand" to="/">{t("brandName")}</Link>
          <nav className="app-nav" aria-label={t("mainNavigation")}>
            <Link to="/">{t("home")}</Link>
            <Link to="/about">{t("aboutus")}</Link>
            <Link to="/services">{t("services")}</Link>
            <Link to="/contact">{t("contactus")}</Link>
            <Link to="/policies">{t("communityPolicies")}</Link>
            {role === "user" && <>
              <Link to="/available-babysitters">{t("findCare")}</Link>
              <Link to="/bookings">{t("myBookings")}</Link>
            </>}
            {role === "babysitter" && <>
              <Link to="/bookings">{t("bookingRequests")}</Link>
              <Link to="/edit-profile">{t("editProfile")}</Link>
            </>}
            {role === "admin" && <Link to="/admin-panel">{t("adminPanel")}</Link>}
            {!role && <>
              <Link to="/login">{t("login")}</Link>
              <Link className="nav-signup" to="/register">{t("register")}</Link>
            </>}
            {role && <button className="nav-logout" onClick={logout}>{t("logout")}</button>}
          </nav>
        </header>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/view-user/:id" element={<BabysitterDetails />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route
            path="/available-babysitters"
            element={<AvailableBabysitters />}
          />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/services" element={<Services />} />
          <Route path="/policies" element={<Policies />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
