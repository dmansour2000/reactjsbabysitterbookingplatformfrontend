import React from "react";
import { useTranslation } from "react-i18next";
import AdUnit from "./AdUnit";

const serviceKeys = [
  ["serviceApprovedProfilesTitle", "serviceApprovedProfilesDescription"],
  ["serviceCareOptionsTitle", "serviceCareOptionsDescription"],
  ["serviceBookingTitle", "serviceBookingDescription"],
];

const availableServiceKeys = [
  ["babysitting", "serviceOptionBabysitting"],
  ["cleaning", "serviceOptionCleaning"],
  ["cooking", "serviceOptionCooking"],
  ["elderlyCare", "serviceOptionElderlyCare"],
];

function Services() {
  const { t } = useTranslation();

  return (
    <main className="container policy-page information-page">
      <div className="page-heading">
        <p className="eyebrow">{t("servicesEyebrow")}</p>
        <h1>{t("servicesTitle")}</h1>
        <p>{t("servicesIntro")}</p>
      </div>
      <section className="service-grid" aria-label={t("servicesTitle")}>
        {serviceKeys.map(([titleKey, descriptionKey], index) => (
          <article className="booking-panel service-panel" key={titleKey}>
            <span className="service-number" aria-hidden="true">0{index + 1}</span>
            <h2>{t(titleKey)}</h2>
            <p>{t(descriptionKey)}</p>
          </article>
        ))}
      </section>
      <section className="available-services" aria-labelledby="available-services-title">
        <h2 id="available-services-title">{t("availableServiceOptions")}</h2>
        <div className="available-service-grid">
          {availableServiceKeys.map(([serviceKey, descriptionKey]) => (
            <article className="available-service-card" key={serviceKey}>
              <h3>{t(serviceKey)}</h3>
              <p>{t(descriptionKey)}</p>
            </article>
          ))}
        </div>
      </section>
      <AdUnit />
    </main>
  );
}

export default Services;
