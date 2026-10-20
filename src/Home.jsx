import React from "react";
import { useTranslation } from "react-i18next";
import AdUnit from "./AdUnit";
import "./i18n";

function Home() {
  const { t } = useTranslation();

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-visuals" aria-hidden="true">
          <img
            className="home-family-visual"
            src={`${import.meta.env.BASE_URL}imgs/Your_Image_Here.png`}
            alt=""
          />
          <img
            className="home-caregiver-visual"
            src={`${import.meta.env.BASE_URL}imgs/Layer_1.png`}
            alt=""
          />
        </div>

        <div className="home-copy">
          <img
            className="home-icons"
            src={`${import.meta.env.BASE_URL}imgs/Vector_Smart_Object_Doble_Clic_l.png`}
            alt=""
            aria-hidden="true"
          />
          <h1 id="home-title">{t("need-help")}</h1>
          <p>{t("homeIntro")}</p>
        </div>
      </section>
      <AdUnit />
    </main>
  );
}

export default Home;
