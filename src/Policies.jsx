import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

function Policies() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    } else if (location.pathname.includes("/privacy")) {
      const elem = document.getElementById("privacy-policy");
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <main className="container policy-page">
      <div className="page-heading">
        <p className="eyebrow">{t("publicInformation")}</p>
        <h1>{t("communityPolicies")}</h1>
        <p>{t("policyIntro")}</p>
        <div className="policy-quick-nav" style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", margin: "1rem 0" }}>
          <a href="#privacy-policy" className="button nav-signup" style={{ padding: "0.45rem 1rem", fontSize: "0.9rem", textDecoration: "none" }}>
            🛡️ {t("privacyPolicyTitle")}
          </a>
          <a href="#community-policies" className="button button-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.9rem", textDecoration: "none" }}>
            🤝 {t("communityPolicies")}
          </a>
        </div>
      </div>

      {/* Google Play Compliant Official Privacy Policy */}
      <section id="privacy-policy" className="policy-section">
        <article className="booking-panel policy-card" style={{ border: "2px solid #e5c4dc", borderRadius: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ marginBottom: "0.25rem" }}>{t("privacyPolicyTitle")}</h2>
            <span style={{ fontSize: "0.85rem", color: "#6c6270", fontWeight: "600", background: "#f3e8f1", padding: "0.2rem 0.6rem", borderRadius: "0.5rem" }}>
              {t("privacyLastUpdated")}
            </span>
          </div>
          <p style={{ color: "#7a3b79", fontWeight: "600", fontSize: "0.95rem", marginTop: "0.2rem" }}>
            {t("privacyPolicySubtitle")}
          </p>
          <p style={{ lineHeight: "1.7" }}>{t("privacyPolicyIntro")}</p>

          <hr style={{ border: "none", borderTop: "1px solid #ebd3e4", margin: "1.25rem 0" }} />

          {/* 1. Information We Collect */}
          <h3>{t("privacyDataCollectedHeading")}</h3>
          <p>{t("privacyDataCollectedBody")}</p>
          <ul style={{ paddingInlineStart: "1.25rem", lineHeight: "1.8" }}>
            <li>{t("privacyDataAccount")}</li>
            <li><strong>{t("privacyDataCaregiver")}</strong></li>
            <li>{t("privacyDataProfile")}</li>
            <li>{t("privacyDataBooking")}</li>
            <li>{t("privacyDataAuto")}</li>
          </ul>

          {/* 2. Mobile App Permissions */}
          <h3>{t("privacyPermissionsHeading")}</h3>
          <p>{t("privacyPermissionsBody")}</p>
          <ul style={{ paddingInlineStart: "1.25rem", lineHeight: "1.8" }}>
            <li>{t("privacyPermissionCamera")}</li>
            <li>{t("privacyPermissionStorage")}</li>
            <li>{t("privacyPermissionAdId")}</li>
          </ul>

          {/* 3. How We Use Information */}
          <h3>{t("privacyDataUseHeading")}</h3>
          <p>{t("privacyDataUseBody")}</p>
          <ul style={{ paddingInlineStart: "1.25rem", lineHeight: "1.8" }}>
            <li>{t("privacyDataUseItem1")}</li>
            <li>{t("privacyDataUseItem2")}</li>
            <li>{t("privacyDataUseItem3")}</li>
            <li>{t("privacyDataUseItem4")}</li>
            <li>{t("privacyDataUseItem5")}</li>
            <li>{t("privacyDataUseItem6")}</li>
          </ul>

          {/* 4. Third-Party Services */}
          <h3>{t("privacyThirdPartiesHeading")}</h3>
          <p>{t("privacyThirdPartiesBody")}</p>
          <ul style={{ paddingInlineStart: "1.25rem", lineHeight: "1.8" }}>
            <li>{t("privacyThirdPartyAdMob")}</li>
            <li>{t("privacyThirdPartyAuth")}</li>
          </ul>

          {/* 5. Data Retention & Security */}
          <h3>{t("privacyDataRetentionHeading")}</h3>
          <p>{t("privacyDataRetentionBody")}</p>

          {/* 6. Account & Data Deletion (Google Play Mandate) */}
          <div style={{ background: "#fbf3f8", borderLeft: "4px solid #c743a1", padding: "1rem 1.25rem", borderRadius: "0.5rem", margin: "1.25rem 0" }}>
            <h3 style={{ marginTop: "0", color: "#682c67" }}>{t("privacyDataDeletionHeading")}</h3>
            <p>{t("privacyDataDeletionBody")}</p>
            <p style={{ marginBottom: "0" }}><strong>{t("privacyDataDeletionHow")}</strong></p>
          </div>

          {/* 7. Children's Privacy */}
          <h3>{t("privacyChildrenHeading")}</h3>
          <p>{t("privacyChildrenBody")}</p>

          {/* 8. Contact Us */}
          <h3>{t("privacyContactHeading")}</h3>
          <p>{t("privacyContactBody")}</p>
        </article>
      </section>

      {/* Community Guidelines & Policies */}
      <section id="community-policies" className="policy-section" style={{ marginTop: "2rem" }}>
        <article className="booking-panel policy-card">
          <h2>{t("babysitterPolicyTitle")}</h2>
          <p>{t("sitterPolicyIntro")}</p>
          <h3>{t("sitterPolicyVerificationHeading")}</h3>
          <p>{t("sitterPolicyVerification")}</p>
          <h3>{t("sitterPolicySafetyHeading")}</h3>
          <p>{t("sitterPolicySafety")}</p>
          <h3>{t("sitterPolicyBookingsHeading")}</h3>
          <p>{t("sitterPolicyBookings")}</p>
          <h3>{t("sitterPolicyEnforcementHeading")}</h3>
          <p>{t("sitterPolicyEnforcement")}</p>
        </article>

        <article className="booking-panel policy-card">
          <h2>{t("familyPolicyTitle")}</h2>
          <p>{t("familyPolicyIntro")}</p>
          <h3>{t("familyPolicySafetyHeading")}</h3>
          <p>{t("familyPolicySafety")}</p>
          <h3>{t("familyPolicyBookingsHeading")}</h3>
          <p>{t("familyPolicyBookings")}</p>
          <h3>{t("familyPolicyPrivacyHeading")}</h3>
          <p>{t("familyPolicyPrivacy")}</p>
          <h3>{t("familyPolicyEnforcementHeading")}</h3>
          <p>{t("familyPolicyEnforcement")}</p>
        </article>
      </section>
    </main>
  );
}

export default Policies;
