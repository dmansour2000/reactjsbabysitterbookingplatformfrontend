import React from "react";
import { useTranslation } from "react-i18next";
import AdUnit from "./AdUnit";

function About() {
  const { t } = useTranslation();

  const values = [
    { title: t("aboutValue1Title"), desc: t("aboutValue1Desc"), icon: "🛡️" },
    { title: t("aboutValue2Title"), desc: t("aboutValue2Desc"), icon: "💎" },
    { title: t("aboutValue3Title"), desc: t("aboutValue3Desc"), icon: "🌍" },
  ];

  return (
    <main className="container policy-page information-page">
      <div className="page-heading">
        <p className="eyebrow">{t("aboutus")}</p>
        <h1>{t("aboutCareNestTitle")}</h1>
        <p>{t("aboutCareNestIntro")}</p>
        <p>{t("aboutCareNestDescription")}</p>
      </div>

      <section className="policy-section">
        <article className="booking-panel policy-card" style={{ marginBottom: "1.5rem" }}>
          <h2>{t("aboutMissionHeading")}</h2>
          <p style={{ lineHeight: "1.8", color: "#4a4050" }}>{t("aboutMissionBody")}</p>
        </article>

        <article className="booking-panel policy-card" style={{ marginBottom: "1.5rem" }}>
          <h2>{t("aboutStandardsHeading")}</h2>
          <p style={{ lineHeight: "1.8", color: "#4a4050" }}>{t("aboutStandardsBody")}</p>
        </article>
      </section>

      <section className="available-services" style={{ marginTop: "1rem" }} aria-label={t("aboutValuesHeading")}>
        <h2>{t("aboutValuesHeading")}</h2>
        <div className="available-service-grid">
          {values.map((val) => (
            <article className="available-service-card" key={val.title}>
              <span style={{ fontSize: "1.75rem", display: "block", marginBottom: "0.5rem" }} aria-hidden="true">
                {val.icon}
              </span>
              <h3>{val.title}</h3>
              <p>{val.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <AdUnit />
    </main>
  );
}

export default About;
