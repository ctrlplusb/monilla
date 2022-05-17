import { parseConfig } from "~/parse-config";

describe("parse-config", () => {
  it("should throw if config does not match the expected schema", () => {
    expect(() => parseConfig(__dirname)).toThrow(Error);
  });
});
