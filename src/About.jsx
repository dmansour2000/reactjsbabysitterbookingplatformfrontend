import React from "react";
import { useTranslation } from "react-i18next";
import AdUnit from "./AdUnit";

function About() {
  const { t } = useTranslation();
  return <main className="container policy-page">
    <div className="page-heading">
      <p className="eyebrow">{t("aboutus")}</p>
      <h1>{t("aboutCareNestTitle")}</h1>
      <p>{t("aboutCareNestIntro")}</p>
      <p>{t("aboutCareNestDescription")}</p>
    </div>
    <AdUnit />
  </main>;
}

export default About;
