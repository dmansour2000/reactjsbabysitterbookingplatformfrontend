import React from "react";
import { useTranslation } from "react-i18next";
import AdUnit from "./AdUnit";

function Contact() {
  const { t } = useTranslation();

  return (
    <main className="container policy-page information-page">
      <div className="page-heading">
        <p className="eyebrow">{t("contactEyebrow")}</p>
        <h1>{t("contactTitle")}</h1>
        <p>{t("contactIntro")}</p>
      </div>
      <section className="booking-panel contact-card" aria-labelledby="contact-email-heading">
        <h2 id="contact-email-heading">{t("contactEmailHeading")}</h2>
        <p>{t("contactEmailDescription")}</p>
        <a className="contact-email" href="mailto:dinamansour2000@gmail.com">
          dinamansour2000@gmail.com
        </a>
      </section>
      <AdUnit />
    </main>
  );
}

export default Contact;
