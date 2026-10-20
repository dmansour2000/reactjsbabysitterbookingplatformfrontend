import React from "react";
import { useTranslation } from "react-i18next";
import AdUnit from "./AdUnit";

function Policies() {
  const { t } = useTranslation();
  return <main className="container policy-page">
    <div className="page-heading"><p className="eyebrow">{t("publicInformation")}</p><h1>{t("communityPolicies")}</h1><p>{t("policyIntro")}</p></div>
    <article className="booking-panel policy-card"><h2>{t("babysitterPolicyTitle")}</h2>
      <p>{t("sitterPolicyIntro")}</p>
      <h3>{t("sitterPolicyVerificationHeading")}</h3><p>{t("sitterPolicyVerification")}</p>
      <h3>{t("sitterPolicySafetyHeading")}</h3><p>{t("sitterPolicySafety")}</p>
      <h3>{t("sitterPolicyBookingsHeading")}</h3><p>{t("sitterPolicyBookings")}</p>
      <h3>{t("sitterPolicyEnforcementHeading")}</h3><p>{t("sitterPolicyEnforcement")}</p>
    </article>
    <article className="booking-panel policy-card"><h2>{t("familyPolicyTitle")}</h2>
      <p>{t("familyPolicyIntro")}</p>
      <h3>{t("familyPolicySafetyHeading")}</h3><p>{t("familyPolicySafety")}</p>
      <h3>{t("familyPolicyBookingsHeading")}</h3><p>{t("familyPolicyBookings")}</p>
      <h3>{t("familyPolicyPrivacyHeading")}</h3><p>{t("familyPolicyPrivacy")}</p>
      <h3>{t("familyPolicyEnforcementHeading")}</h3><p>{t("familyPolicyEnforcement")}</p>
    </article>
    <AdUnit />
  </main>;
}

export default Policies;
