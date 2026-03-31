import React from "react";
import { useTranslation } from "react-i18next";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
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
import "./App.css";
import "./i18n";

function App() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("language", language);
  };

  return (
    <div id="Canvas">
      <div className="tl">
        <button onClick={() => changeLanguage("en")}>English</button>
        <button onClick={() => changeLanguage("ar")}>عربي</button>
      </div>
      <div class="br"></div>
      {/* Header Section */}
      <Router>
        <div id="Design">
          <img id="Shape" src="imgs/Shape.png"></img>
        </div>

        <div id="Home__________About_Us________">
          {/* Navigation Links */}
          <nav>
            <Link to="/">{t("home")}</Link> |{" "}
            <Link to="/about">{t("aboutus")}</Link> |{" "}
            <Link to="/services">{t("services")}</Link> |{" "}
            <Link to="/contact">{t("contactus")}</Link> |{" "}
            <Link to="/login">{t("login")}</Link>
          </nav>
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/view-user/:id" element={<BabysitterDetails />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route
            path="/available-babysitters"
            element={<AvailableBabysitters />}
          />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/services" element={<Services />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
