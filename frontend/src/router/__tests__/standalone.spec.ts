import { describe, expect, it } from "vitest";
import router from "../index";

describe("standalone routes skip the PIN gate", () => {
  it.each(["/sounds", "/audio", "/admin", "/epicwheel"])("%s is standalone", (path) => {
    expect(router.resolve(path).meta.standalone).toBe(true);
  });

  it("/audio shows the Sounds page", () => {
    expect(router.resolve("/audio").name).toBe("sounds");
  });

  it.each(["/", "/agenda/AER-1", "/summary", "/nope"])("%s stays behind the PIN", (path) => {
    expect(router.resolve(path).meta.standalone).toBeFalsy();
  });
});
