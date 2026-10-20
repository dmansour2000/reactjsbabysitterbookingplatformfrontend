import { describe, expect, it } from "vitest";
import { apiUrl } from "./api";

describe("apiUrl", () => {
  it("adds a leading slash to API paths", () => {
    expect(apiUrl("api/bookings")).toMatch(/\/api\/bookings$/);
  });

  it("does not add a second slash to paths that already start with one", () => {
    expect(apiUrl("/api/bookings")).toMatch(/\/api\/bookings$/);
  });
});
