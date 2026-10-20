import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import Home from "./Home";
import About from "./About";
import Contact from "./Contact";
import Services from "./Services";
import Policies from "./Policies";
import Login from "./Login";
import Register from "./Register";
import AvailableBabysitters from "./AvailableBabysitters";
import BabysitterDetails from "./BabysitterDetails";
import AccountSecurity from "./AccountSecurity";
import PasswordRecovery from "./PasswordRecovery";
import AdminPanel from "./AdminPanel";
import EditProfile from "./EditProfile";
import MyProfile from "./MyProfile";
import SEO from "./SEO";
import App from "./App";

afterEach(cleanup);

const { translate } = vi.hoisted(() => ({
  translate: (key) => ({
    nationality_sudan: "السودان",
    "need-help": "Trusted care for children and older adults",
    aboutCareNestTitle: "About CareNest",
    contactTitle: "Contact CareNest",
    servicesTitle: "Care services",
    availableServiceOptions: "Available services",
    communityPolicies: "Community policies",
  }[key] || key),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate, i18n: { language: "ar", resolvedLanguage: "ar", changeLanguage: vi.fn() } }),
}));
vi.mock("./i18n", () => ({ default: {} }));
vi.mock("./AdUnit", () => ({ default: () => null }));
vi.mock("./SocialAuth", () => ({
  default: ({ onRegistrationRequired }) => (
    <button type="button" onClick={() => onRegistrationRequired?.({
      registrationToken: "pending-google-token",
      googleUser: { email: "caregiver@example.com", name: "Care Giver" },
    })}>Google sign-in</button>
  ),
}));

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

function renderWithRouter(element, initialEntries = ["/"]) {
  return render(<MemoryRouter initialEntries={initialEntries}>{element}<CurrentPath /></MemoryRouter>);
}

const jsonResponse = (body, options = {}) => ({ ok: true, status: 200, json: async () => body, ...options });

describe("public website pages", () => {
  it.each([
    [Home, "Trusted care for children and older adults"],
    [About, "About CareNest"],
    [Contact, "Contact CareNest"],
    [Services, "Care services"],
    [Policies, "Community policies"],
  ])("renders the %s page", (Page, heading) => {
    renderWithRouter(<Page />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("lists all offered care services on the services page", () => {
    renderWithRouter(<Services />);
    expect(screen.getByRole("heading", { name: "babysitting" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "cleaning" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "cooking" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "elderlyCare" })).toBeInTheDocument();
  });
});

describe("application navigation", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("navigates between public pages and exposes guest account links", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByRole("link", { name: "login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "register" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "services" }));
    expect(screen.getByRole("heading", { name: "Care services" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/services");
  });

  it("shows account navigation based on the signed-in role", () => {
    localStorage.setItem("role", "user");
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByRole("link", { name: "findCare" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "myBookings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "accountSecurity" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "adminPanel" })).not.toBeInTheDocument();
  });
});

describe("authentication pages", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a translated error when login credentials are rejected", async () => {
    fetch.mockResolvedValue(jsonResponse({}, { ok: false, status: 401 }));
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText("username"), { target: { value: "family" } });
    fireEvent.change(screen.getByLabelText("password"), { target: { value: "incorrect" } });
    fireEvent.click(screen.getByRole("button", { name: "login" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("loginFailed");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("signs a family in and navigates to caregiver search", async () => {
    fetch.mockResolvedValue(jsonResponse({ token: "family-token", user: { role: "user" } }));
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText("username"), { target: { value: "family" } });
    fireEvent.change(screen.getByLabelText("password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/available-babysitters"));
    expect(localStorage.getItem("role")).toBe("user");
    expect(localStorage.getItem("token")).toBe("family-token");
  });

  it("sends approved caregivers to requests and caregivers awaiting review to their profile", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ token: "caregiver-token", user: { role: "babysitter" } }));
    fetch.mockResolvedValueOnce(jsonResponse({ phone: "01012345678", age: 29, nationality: "Egypt", city: "Cairo", services: ["babysitting"], moderationStatus: "approved" }));
    const { unmount } = renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText("username"), { target: { value: "mona" } });
    fireEvent.change(screen.getByLabelText("password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/bookings"));
    unmount();

    cleanup();
    localStorage.clear();
    fetch.mockReset();
    fetch.mockResolvedValueOnce(jsonResponse({ token: "pending-token", user: { role: "babysitter" } }));
    fetch.mockResolvedValueOnce(jsonResponse({ phone: "01012345678", age: 29, nationality: "Egypt", city: "Cairo", services: ["babysitting"], moderationStatus: "pending" }));
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText("username"), { target: { value: "mona" } });
    fireEvent.change(screen.getByLabelText("password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/my-profile"));
  });

  it("registers a family account and navigates to caregiver search", async () => {
    fetch.mockResolvedValue(jsonResponse({ token: "new-token" }));
    renderWithRouter(<Register />);
    fireEvent.change(screen.getByLabelText("username"), { target: { value: "family" } });
    fireEvent.change(screen.getByLabelText("email"), { target: { value: "family@example.com" } });
    fireEvent.change(screen.getByLabelText("password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("name"), { target: { value: "A Family" } });
    fireEvent.click(screen.getByRole("button", { name: "register" }));

    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/available-babysitters"));
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/user\/register$/), expect.objectContaining({ method: "POST" }));
    expect(localStorage.getItem("token")).toBe("new-token");
    expect(localStorage.getItem("role")).toBe("user");
  });

  it("asks Google registrants to choose User or Care Giver before creating their account", async () => {
    fetch.mockResolvedValue(jsonResponse({ token: "caregiver-token", user: { role: "babysitter" } }));
    renderWithRouter(<Register />);
    fireEvent.click(screen.getByRole("button", { name: "Google sign-in" }));

    expect(await screen.findByRole("heading", { name: "completeGoogleRegistration" })).toBeInTheDocument();
    expect(screen.getByText(/caregiver@example.com/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("accountType"), { target: { value: "babysitter" } });
    fireEvent.click(screen.getByRole("button", { name: "completeRegistration" }));

    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/edit-profile"));
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/user\/oauth\/complete-registration$/), expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ registrationToken: "pending-google-token", role: "babysitter" }),
    }));
  });

  it("sends a forgotten-password request and displays the success state", async () => {
    fetch.mockResolvedValue(jsonResponse({ message: "sent" }));
    renderWithRouter(<PasswordRecovery />);
    fireEvent.change(screen.getByLabelText("email"), { target: { value: "family@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "sendResetLink" }));
    expect(await screen.findByText("passwordRecoverySent")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/user\/forgot-password$/), expect.objectContaining({ method: "POST" }));
  });

  it("resets a password using the token in the recovery link", async () => {
    fetch.mockResolvedValue(jsonResponse({ message: "reset" }));
    renderWithRouter(<PasswordRecovery reset />, ["/reset-password?token=reset-token"]);
    fireEvent.change(screen.getByLabelText("newPassword"), { target: { value: "a-new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "resetPassword" }));
    expect(await screen.findByText("passwordResetSuccess")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/user\/reset-password$/), expect.objectContaining({
      body: JSON.stringify({ token: "reset-token", newPassword: "a-new-password" }),
    }));
  });

  it("updates the signed-in user's password", async () => {
    localStorage.setItem("token", "session-token");
    fetch.mockResolvedValue(jsonResponse({ email: "family@example.com" }));
    fetch.mockResolvedValueOnce(jsonResponse({ email: "family@example.com" }));
    fetch.mockResolvedValueOnce(jsonResponse({ message: "changed" }));
    renderWithRouter(<AccountSecurity />);
    fireEvent.change(screen.getAllByLabelText("currentPassword")[1], { target: { value: "old-password" } });
    fireEvent.change(screen.getByLabelText("newPassword"), { target: { value: "new-password123" } });
    fireEvent.click(screen.getByRole("button", { name: "changePassword" }));
    expect(await screen.findByText("passwordChanged")).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith(expect.stringMatching(/\/api\/user\/password$/), expect.objectContaining({ method: "PATCH" }));
  });

  it("lets the signed-in user replace a placeholder email after password verification", async () => {
    localStorage.setItem("token", "session-token");
    fetch.mockResolvedValueOnce(jsonResponse({ email: "test@test.com" }));
    fetch.mockResolvedValueOnce(jsonResponse({ email: "family@example.com" }));
    renderWithRouter(<AccountSecurity />);
    fireEvent.change(screen.getByLabelText("newEmail"), { target: { value: "family@example.com" } });
    fireEvent.change(screen.getAllByLabelText("currentPassword")[0], { target: { value: "current-password" } });
    fireEvent.click(screen.getByRole("button", { name: "saveEmail" }));

    expect(await screen.findByText("emailChanged")).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith(expect.stringMatching(/\/api\/user\/email$/), expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ email: "family@example.com", currentPassword: "current-password" }),
    }));
  });
});

describe("caregiver search and booking flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("matches Arabic nationality searches and filters caregivers", async () => {
    fetch.mockImplementation((url) => Promise.resolve(String(url).endsWith("egypt-districts.json")
      ? jsonResponse([])
      : jsonResponse([
        { _id: "one", userId: "profile-one", name: "Mona", nationality: "Sudan", services: ["elderlyCare"] },
        { _id: "two", userId: "profile-two", name: "Salma", nationality: "Egypt", services: ["cleaning"] },
      ])));
    renderWithRouter(<AvailableBabysitters />);
    expect(await screen.findByRole("heading", { name: "Mona" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "searchSitters" }), { target: { value: "السودان" } });
    expect(screen.getByRole("heading", { name: "Mona" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Salma" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "service" }), { target: { value: "elderlyCare" } });
    expect(screen.getByRole("link", { name: "viewProfileAndBook" })).toHaveAttribute("href", "/view-user/profile-one");
  });

  it("submits a valid booking request without exposing a caregiver phone on the profile", async () => {
    localStorage.setItem("token", "family-token");
    localStorage.setItem("role", "user");
    fetch.mockResolvedValueOnce(jsonResponse({
      _id: "caregiver-id", name: "Mona", available: true, moderationStatus: "approved", age: 30,
      nationality: "Sudan", city: "Giza", monthlySalary: 7000, currency: "EGP", services: ["babysitting"], photoUrl: null,
    }));
    fetch.mockResolvedValueOnce(jsonResponse({ _id: "booking-id", status: "pending" }));
    renderWithRouter(<BabysitterDetails />, ["/view-user/caregiver-user-id"]);

    expect(await screen.findByRole("heading", { name: "Mona" })).toBeInTheDocument();
    expect(screen.queryByText("phone")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("startDateTime"), { target: { value: "2099-01-01" } });
    fireEvent.change(screen.getByLabelText("endDateTime"), { target: { value: "2099-01-03" } });
    fireEvent.click(screen.getByRole("button", { name: "sendBookingRequest" }));

    expect(await screen.findByText("bookingRequestSent")).toBeInTheDocument();
    const bookingCall = fetch.mock.calls.find(([url, options]) => String(url).endsWith("/api/bookings") && options?.method === "POST");
    expect(JSON.parse(bookingCall[1].body)).toMatchObject({ babysitterId: "caregiver-id", service: "babysitting", startAt: "2099-01-01" });
  });

  it("loads caregiver profile data and shows uploaded identity documents", async () => {
    localStorage.setItem("token", "caregiver-token");
    localStorage.setItem("role", "babysitter");
    fetch.mockResolvedValue(jsonResponse({
      name: "Mona", phone: "01012345678", age: 29, nationality: "Egypt", city: "Cairo, Cairo",
      monthlySalary: 7000, currency: "EGP", services: ["babysitting"], moderationStatus: "pending",
      verificationDocuments: { nationalId: true }, photoUrl: null,
    }));
    renderWithRouter(<MyProfile />);
    expect(await screen.findByRole("heading", { name: "Mona" })).toBeInTheDocument();
    expect(screen.getByText("01012345678")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "nationalIdUpload" })).toBeInTheDocument();
    expect(screen.getAllByText("moderation_pending")).toHaveLength(2);
  });

  it("validates and saves caregiver profile details with the selected currency", async () => {
    localStorage.setItem("token", "caregiver-token");
    const districts = [{ id: "cairo-district", name: { en: "Cairo", local: "القاهرة" }, parent: { id: "cairo", name: { en: "Cairo", local: "القاهرة" } } }];
    const profile = {
      phone: "01012345678", age: 29, nationality: "Egypt", city: "Cairo, Cairo", monthlySalary: 7000,
      currency: "EGP", services: ["babysitting"], moderationStatus: "pending", available: true,
    };
    fetch.mockImplementation((url, options = {}) => {
      if (String(url).endsWith("egypt-districts.json")) return Promise.resolve(jsonResponse(districts));
      if (options.method === "PUT") return Promise.resolve(jsonResponse({ message: "saved" }));
      return Promise.resolve(jsonResponse(profile));
    });
    renderWithRouter(<EditProfile />);
    expect(await screen.findByRole("heading", { name: "editProfile" })).toBeInTheDocument();
    expect(screen.getByLabelText("mobilePhone")).toHaveAttribute("maxLength", "11");
    fireEvent.change(screen.getByLabelText("currency"), { target: { value: "USD" } });
    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/my-profile"));
    const saveCall = fetch.mock.calls.find(([, options]) => options?.method === "PUT");
    expect(JSON.parse(saveCall[1].body)).toMatchObject({ phone: "01012345678", nationality: "Egypt", currency: "USD", services: ["babysitting"] });
  });
});

describe("admin account actions", () => {
  beforeEach(() => {
    localStorage.setItem("token", "admin-token");
    vi.stubGlobal("fetch", vi.fn((url, options = {}) => {
      const path = String(url);
      if (path.endsWith("/api/admin/users/account-id/details")) return Promise.resolve(jsonResponse({ user: { _id: "account-id", username: "family", role: "user", email: "family@example.com", name: "Family" }, requests: [] }));
      if (path.endsWith("/api/admin/users/account-id") && options.method === "DELETE") return Promise.resolve(jsonResponse({}));
      if (path.endsWith("/api/admin/users")) return Promise.resolve(jsonResponse([{ _id: "account-id", username: "family", role: "user" }]));
      if (path.endsWith("/api/admin/babysitters") || path.endsWith("/api/admin/audit-logs")) return Promise.resolve(jsonResponse([]));
      if (path.endsWith("/api/admin/admins")) return Promise.resolve(jsonResponse([], { ok: false, status: 403 }));
      return Promise.resolve(jsonResponse([]));
    }));
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("loads account details into a dialog and asks before deleting an account", async () => {
    renderWithRouter(<AdminPanel />);
    fireEvent.click(await screen.findByRole("button", { name: "viewDetails" }));
    expect(await screen.findByRole("dialog", { name: /accountDetails/ })).toBeInTheDocument();
    expect(screen.getByText("family@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("confirmDeleteAccount");
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\/admin\/users\/account-id$/), expect.objectContaining({ method: "DELETE" }));
  });

  it("deletes an account only after confirming the dialog", async () => {
    renderWithRouter(<AdminPanel />);
    fireEvent.click(await screen.findByRole("button", { name: "delete" }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "delete" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/admin\/users\/account-id$/), expect.objectContaining({ method: "DELETE" })));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("opens caregiver review details and submits an approval", async () => {
    fetch.mockImplementation((url, options = {}) => {
      const path = String(url);
      if (path.endsWith("/api/admin/babysitters")) return Promise.resolve(jsonResponse([{
        _id: "sitter-id", name: "Mona", userId: { username: "mona" }, moderationStatus: "pending",
        nationalityType: "egyptian", verificationDocuments: { nationalId: true }, services: ["babysitting"],
      }]));
      if (path.endsWith("/api/admin/babysitters/sitter-id/moderation") && options.method === "PATCH") return Promise.resolve(jsonResponse({ moderationStatus: "approved" }));
      if (path.endsWith("/api/admin/users")) return Promise.resolve(jsonResponse([]));
      if (path.endsWith("/api/admin/audit-logs") || path.endsWith("/api/admin/babysitters")) return Promise.resolve(jsonResponse([]));
      if (path.endsWith("/api/admin/admins")) return Promise.resolve(jsonResponse([], { ok: false, status: 403 }));
      return Promise.resolve(jsonResponse([]));
    });
    renderWithRouter(<AdminPanel />);
    fireEvent.click(await screen.findByRole("button", { name: "viewCaregiverProfile" }));
    expect(await screen.findByRole("dialog", { name: "babysitterProfile" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mona" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "approve" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/sitter-id\/moderation$/), expect.objectContaining({ method: "PATCH" })));
  });
});

describe("search engine metadata", () => {
  it("marks private pages noindex and keeps public metadata localized", async () => {
    renderWithRouter(<SEO />, ["/contact"]);
    await waitFor(() => expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "index,follow,max-image-preview:large"));
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", expect.stringMatching(/\/contact\/$/));

    cleanup();
    render(<MemoryRouter initialEntries={["/account-security"]}><SEO /></MemoryRouter>);
    await waitFor(() => expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow"));
  });
});
