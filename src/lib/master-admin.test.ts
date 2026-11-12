import { describe, it, expect } from "vitest";
import { validateAdminSignup } from "./master-admin";
describe("admin signup", () => {
  it("rejects other emails", () => expect(validateAdminSignup("x@y.com", "abcd1234", "abcd1234")).not.toBeNull());
  it("rejects mismatched confirm", () => expect(validateAdminSignup("ajaymeena787956@gmail.com", "abcd1234", "abcd1235")).toBe("Passwords do not match."));
  it("accepts master email", () => expect(validateAdminSignup("AjayMeena787956@gmail.com", "abcd1234", "abcd1234")).toBeNull());
});
