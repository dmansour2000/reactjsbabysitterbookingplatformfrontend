import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "./api";

const serviceOptions = ["babysitting", "cleaning", "cooking", "elderlyCare"];
const nationalityOptions = ["Egypt", "Sudan", "Nigeria", "Ethiopia", "Philippines", "Other African", "Indonesia"];

function EditProfile() {
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalitySelection, setNationalitySelection] = useState("");
  const [otherNationality, setOtherNationality] = useState("");
  const [city, setCity] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [egyptDistricts, setEgyptDistricts] = useState([]);
  const [bio, setBio] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [nationalityType, setNationalityType] = useState("egyptian");
  const [documents, setDocuments] = useState({});
  const [photo, setPhoto] = useState(null);
  const [moderationStatus, setModerationStatus] = useState("pending");
  const [services, setServices] = useState([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingAvailability, setIsChangingAvailability] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const controller = new AbortController();
    async function loadProfile() {
      try {
        const locationsResponse = await fetch(`${import.meta.env.BASE_URL}egypt-districts.json`, { signal: controller.signal });
        if (!locationsResponse.ok) throw new Error(t("loadLocationsError"));
        const locationData = await locationsResponse.json();
        setEgyptDistricts(locationData);
        const response = await fetch(apiUrl("/api/babysitter/profile"), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(t("loadProfileError"));
        setPhone(data.phone || "");
        setAge(data.age || "");
        const existingNationality = data.nationality || "";
        const standardNationality = nationalityOptions.find((option) => option.toLowerCase() === existingNationality.toLowerCase());
        const isEgyptian = /^(egypt|egyptian)$/i.test(existingNationality);
        setNationality(existingNationality);
        const selection = standardNationality || (isEgyptian ? "Egypt" : existingNationality ? "Other" : "");
        setNationalitySelection(selection);
        setOtherNationality(standardNationality || isEgyptian ? "" : existingNationality);
        setCity(data.city || "");
        const storedCity = (data.city || "").toLocaleLowerCase();
        const savedDistrict = locationData.find((district) => {
          const fullName = `${district.name.en}, ${district.parent.name.en}`.toLocaleLowerCase();
          return storedCity === fullName || storedCity === district.name.en.toLocaleLowerCase() || storedCity === district.name.local.toLocaleLowerCase();
        });
        setDistrictId(savedDistrict?.id || "");
        setBio(data.bio || "");
        setMonthlySalary(data.monthlySalary ?? "");
        setCurrency(data.currency || "EGP");
        setNationalityType(selection === "Egypt" ? "egyptian" : "other");
        setDocuments(data.verificationDocuments || {});
        setModerationStatus(data.moderationStatus || "pending");
        setServices((data.services || []).filter((service) => service !== "studying"));
        setAvailable(data.available !== false);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(t("loadProfileError"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadProfile();
    return () => controller.abort();
  }, [navigate, t]);

  const handleServiceChange = (event) => {
    const { checked, value } = event.target;
    setServices((current) => checked
      ? [...new Set([...current, value])]
      : current.filter((service) => service !== value));
  };

  const handleNationalityChange = (event) => {
    const selection = event.target.value;
    setNationalitySelection(selection);
    setNationality(selection === "Other" ? otherNationality : selection);
    setNationalityType(selection === "Egypt" ? "egyptian" : "other");
  };

  const handleDistrictChange = (event) => {
    const selection = event.target.value;
    setDistrictId(selection);
    const district = egyptDistricts.find((item) => item.id === selection);
    setCity(district ? `${district.name.en}, ${district.parent.name.en}` : "");
  };

  const districtsByGovernorate = egyptDistricts.reduce((groups, district) => {
    const governorate = district.parent;
    if (!groups[governorate.id]) groups[governorate.id] = { name: governorate.name, districts: [] };
    groups[governorate.id].districts.push(district);
    return groups;
  }, {});

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    if (services.length === 0) {
      setError(t("chooseService"));
      return;
    }
    if (!/^01\d{9}$/.test(phone)) {
      setError(t("invalidEgyptianPhone"));
      return;
    }
    if (nationalitySelection === "Other" && !otherNationality.trim()) {
      setError(t("specifyNationality"));
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(apiUrl("/api/babysitter/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, age: Number(age), nationality: nationalitySelection === "Other" ? otherNationality.trim() : nationalitySelection, nationalityType: nationalitySelection === "Egypt" ? "egyptian" : "other", city, bio, monthlySalary: monthlySalary === "" ? undefined : Number(monthlySalary), currency, services }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(t("profileSaveError"));
      const formData = new FormData();
      if (photo) formData.append("photo", photo);
      if (nationalityType === "egyptian" && documents.nationalIdFile) formData.append("nationalId", documents.nationalIdFile);
      if (nationalityType === "other") {
        if (documents.passportFile) formData.append("passport", documents.passportFile);
        if (documents.residencyFile) formData.append("residency", documents.residencyFile);
      }
      if ([...formData.keys()].length) {
        const uploadResponse = await fetch(apiUrl("/api/babysitter/profile/documents"), {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
        });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error(t("documentUploadError"));
        setModerationStatus(uploadData.moderationStatus || "pending");
      }
      setSaved(true);
      navigate("/my-profile", { replace: true });
    } catch (saveError) {
      setError(t("profileSaveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeAvailability = async (event) => {
    const nextAvailability = event.target.checked;
    const token = localStorage.getItem("token");
    setIsChangingAvailability(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/babysitter/availability"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ available: nextAvailability }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(t("availabilitySaveError"));
      setAvailable(data.available);
    } catch (availabilityError) {
      setError(t("availabilitySaveError"));
    } finally {
      setIsChangingAvailability(false);
    }
  };

  if (loading) return <main className="container"><p className="notice">{t("loading")}</p></main>;

  return (
    <main className="container profile-editor">
      <div className="page-heading">
        <p className="eyebrow">{t("babysitterProfile")}</p>
        <h1>{t("editProfile")}</h1>
      <p>{t("profileEditorDescription")}</p>
      <p className="notice">{t(`moderation_${moderationStatus}`)}</p>
      </div>
      {error && <p className="form-error notice" role="alert">{error}</p>}
      {saved && <p className="success-message" role="status">{t("profileUpdated")}</p>}
      <label className="availability-control">
        <input type="checkbox" checked={available} disabled={isChangingAvailability} onChange={changeAvailability} />
        <span><strong>{available ? t("availableForRequests") : t("notTakingRequests")}</strong><small>{t("availabilityHint")}</small></span>
      </label>
      <form onSubmit={handleSubmit}>
        <label htmlFor="phone">{t("mobilePhone")}</label>
        <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" pattern="01[0-9]{9}" minLength={11} maxLength={11} title={t("invalidEgyptianPhone")} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="01XXXXXXXXX" required />
        <div className="form-columns">
          <div>
            <label htmlFor="age">{t("age")}</label>
            <input id="age" type="number" min="18" max="100" value={age} onChange={(event) => setAge(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="nationality">{t("nationality")}</label>
            <select id="nationality" value={nationalitySelection} onChange={handleNationalityChange} required>
              <option value="" disabled>{t("chooseNationality")}</option>
              {nationalityOptions.map((option) => <option key={option} value={option}>{t(`nationality_${option.toLowerCase().replaceAll(" ", "_")}`)}</option>)}
              <option value="Other">{t("nationality_other")}</option>
            </select>
          </div>
        </div>
        {nationalitySelection === "Other" && <><label htmlFor="nationality-other">{t("specifyNationality")}</label><input id="nationality-other" value={otherNationality} onChange={(event) => { setOtherNationality(event.target.value); setNationality(event.target.value); }} maxLength={80} required /></>}
        <label htmlFor="city">{t("city")}</label>
        <select id="city" value={districtId} onChange={handleDistrictChange} required>
          <option value="" disabled>{t("chooseCityOrArea")}</option>
          {Object.entries(districtsByGovernorate).sort(([, a], [, b]) => a.name.en.localeCompare(b.name.en)).map(([governorateId, group]) => (
            <optgroup key={governorateId} label={i18n.language.startsWith("ar") ? group.name.local : group.name.en}>
              {group.districts.sort((a, b) => a.name.en.localeCompare(b.name.en)).map((district) => (
                <option key={district.id} value={district.id}>{i18n.language.startsWith("ar") ? district.name.local : district.name.en}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="form-columns">
          <div><label htmlFor="monthly-salary">{t("monthlySalary")}</label><input id="monthly-salary" type="number" min="0" step="1" value={monthlySalary} onChange={(event) => setMonthlySalary(event.target.value)} /></div>
          <div><label htmlFor="currency">{t("currency")}</label><select id="currency" value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="EGP">EGP</option><option value="USD">USD</option></select></div>
        </div>
        <label htmlFor="bio">{t("aboutYou")}</label>
        <textarea id="bio" rows="5" maxLength="1500" value={bio} onChange={(event) => setBio(event.target.value)} placeholder={t("bioHint")} />
        <fieldset className="service-options">
          <legend>{t("identityVerification")}</legend>
          <label htmlFor="nationality-type">{t("nationalityType")}</label>
          <p>{nationalityType === "egyptian" ? t("egyptian") : t("otherNationality")}</p>
          <p className="muted">{nationalityType === "egyptian" ? t("nationalIdRequired") : t("passportResidencyRequired")}</p>
          {nationalityType === "egyptian" ? <label>{t("nationalIdUpload")}<input type="file" accept="image/*,.pdf" onChange={(event) => setDocuments((current) => ({ ...current, nationalIdFile: event.target.files[0] }))} /></label> : <><label>{t("passportUpload")}<input type="file" accept="image/*,.pdf" onChange={(event) => setDocuments((current) => ({ ...current, passportFile: event.target.files[0] }))} /></label><label>{t("residencyUpload")}<input type="file" accept="image/*,.pdf" onChange={(event) => setDocuments((current) => ({ ...current, residencyFile: event.target.files[0] }))} /></label></>}
          <label>{t("optionalPhoto")}<input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files[0] || null)} /></label>
        </fieldset>
        <fieldset className="service-options">
          <legend>{t("servicesProvided")}</legend>
          {serviceOptions.map((service) => (
            <label className="checkbox-option" key={service}>
              <input type="checkbox" value={service} checked={services.includes(service)} onChange={handleServiceChange} />
              {t(service)}
            </label>
          ))}
        </fieldset>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("saving") : t("saveChanges")}
        </button>
      </form>
    </main>
  );
}

export default EditProfile;
