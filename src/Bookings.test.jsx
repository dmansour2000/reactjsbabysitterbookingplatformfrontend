import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Bookings from "./Bookings";

const { identityTranslation } = vi.hoisted(() => ({ identityTranslation: (key) => key }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: identityTranslation, i18n: { language: "en" } }),
}));

const booking = (id, status, phone) => ({
  _id: id,
  status,
  service: "babysitting",
  startAt: "2027-01-02T00:00:00.000Z",
  endAt: "2027-01-03T00:00:00.000Z",
  childrenCount: 1,
  babysitterId: { name: "Mona", phone },
});

describe("Bookings page", () => {
  beforeEach(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("role", "user");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("shows contact details only for accepted booking requests", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => [booking("pending-id", "pending", "01000000001"), booking("accepted-id", "accepted", "01000000002")],
    });

    render(<MemoryRouter><Bookings /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText("01000000002")).toBeInTheDocument());
    expect(screen.queryByText("01000000001")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "myBookings" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/bookings$/), expect.objectContaining({
      headers: { Authorization: "Bearer test-token" },
    }));
  });

  it("shows the empty state when there are no bookings", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => [] });
    render(<MemoryRouter><Bookings /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "noBookingsYet" })).toBeInTheDocument();
  });

  it("reactivates a cancelled family request", async () => {
    const cancelledBooking = booking("cancelled-id", "cancelled", "01000000002");
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [cancelledBooking] });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...cancelledBooking, status: "pending" }) });
    render(<MemoryRouter><Bookings /></MemoryRouter>);

    fireEvent.click(await screen.findByRole("button", { name: "reactivateBooking" }));
    await waitFor(() => expect(screen.getByText("status_pending")).toBeInTheDocument());
    expect(fetch).toHaveBeenLastCalledWith(expect.stringMatching(/cancelled-id\/status$/), expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ status: "pending" }),
    }));
  });

  it("lets a caregiver accept a request with an optional note", async () => {
    localStorage.setItem("role", "babysitter");
    const pendingBooking = { ...booking("pending-care-id", "pending", "01000000003"), parentId: { username: "family" } };
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [pendingBooking] });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...pendingBooking, status: "accepted", caregiverNotes: "I can arrive early." }) });
    render(<MemoryRouter><Bookings /></MemoryRouter>);

    fireEvent.change(await screen.findByLabelText("caregiverApprovalNote"), { target: { value: "I can arrive early." } });
    fireEvent.click(screen.getByRole("button", { name: "acceptBooking" }));
    await waitFor(() => expect(screen.getByText("status_accepted")).toBeInTheDocument());
    expect(fetch).toHaveBeenLastCalledWith(expect.stringMatching(/pending-care-id\/status$/), expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ status: "accepted", caregiverNotes: "I can arrive early." }),
    }));
  });

  it("places the approval-cancellation explanation directly below its button", async () => {
    localStorage.setItem("role", "babysitter");
    const acceptedBooking = { ...booking("accepted-care-id", "accepted", "01000000005"), parentId: { username: "family" } };
    fetch.mockResolvedValue({ ok: true, json: async () => [acceptedBooking] });
    render(<MemoryRouter><Bookings /></MemoryRouter>);

    const cancelApprovalButton = await screen.findByRole("button", { name: "cancelApproval" });
    const actionGroup = cancelApprovalButton.parentElement;
    expect(actionGroup).toHaveClass("booking-approval-actions");
    expect(actionGroup.querySelector("p")).toHaveTextContent("cancelApprovalHelp");
    expect(cancelApprovalButton.compareDocumentPosition(actionGroup.querySelector("p")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("confirms and deletes a family booking request", async () => {
    const pendingBooking = booking("delete-id", "pending", "01000000004");
    fetch.mockImplementation((url, options = {}) => Promise.resolve({
      ok: true,
      json: async () => options.method === "DELETE" ? { msg: "deleted" } : [pendingBooking],
    }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<MemoryRouter><Bookings /></MemoryRouter>);

    fireEvent.click(await screen.findByRole("button", { name: "deleteBooking" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "noBookingsYet" })).toBeInTheDocument());
    expect(window.confirm).toHaveBeenCalledWith("confirmDeleteBooking");
    expect(fetch).toHaveBeenLastCalledWith(expect.stringMatching(/\/api\/bookings\/delete-id$/), expect.objectContaining({ method: "DELETE" }));
  });
});
