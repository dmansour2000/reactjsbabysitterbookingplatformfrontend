import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import SocialAuth from "./SocialAuth";

const { translate } = vi.hoisted(() => ({ translate: (key) => key }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate, i18n: { language: "en", resolvedLanguage: "en" } }),
}));
vi.mock("./i18n", () => ({ default: {} }));

describe("Google sign-in", () => {
  let initialize;
  let renderButton;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    initialize = vi.fn();
    renderButton = vi.fn();
    Object.defineProperty(window, "google", {
      configurable: true,
      value: { accounts: { id: { initialize, renderButton } } },
    });
    const script = document.createElement("script");
    script.id = "google-identity-services";
    document.head.appendChild(script);
  });

  afterEach(() => {
    cleanup();
    document.getElementById("google-identity-services")?.remove();
    delete window.google;
    vi.unstubAllGlobals();
  });

  it("requests a nonce, initializes Google, and authenticates the returned credential", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ nonce: "nonce-value" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "session-token", user: { role: "user" } }) });
    const onAuthenticated = vi.fn();
    render(<SocialAuth role="user" onAuthenticated={onAuthenticated} />);

    await waitFor(() => expect(renderButton).toHaveBeenCalled());
    const googleConfiguration = initialize.mock.calls[0][0];
    expect(googleConfiguration).toMatchObject({ client_id: expect.any(String), nonce: "nonce-value", ux_mode: "popup" });
    await googleConfiguration.callback({ credential: "google-id-token" });

    expect(onAuthenticated).toHaveBeenCalledWith({ token: "session-token", user: { role: "user" } });
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
      provider: "google",
      credential: "google-id-token",
      role: "user",
      nonce: "nonce-value",
    });
  });

  it("shows a translated error when the backend has not configured Google sign-in", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ msg: "Social sign-in provider is not configured" }),
    });
    render(<SocialAuth />);
    expect(await screen.findByRole("alert")).toHaveTextContent("socialAuthNotConfigured");
  });
});
