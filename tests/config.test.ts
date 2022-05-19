import fs from "fs";
import path from "path";
import tempy from "tempy";

import { parseConfig, resolveConfig } from "~/config";
import { configFileName } from "~/constants";
import { ErrorCode, errorMessageFor } from "~/monilla-error";

describe("resolve-config", () => {
  it("should throw when no config file exists", async () => {
    await expect(() => resolveConfig(tempy.directory())).rejects.toThrow(
      errorMessageFor(ErrorCode.MissingConfigFile),
    );
  });

  it("should return the config file contents", async () => {
    // ARRANGE
    const expected = '{ "verbose": false }';
    const workingDirectory = tempy.directory();
    fs.writeFileSync(path.join(workingDirectory, configFileName), expected, {
      encoding: "utf-8",
    });

    // ACT
    const actual = await resolveConfig(workingDirectory);

    // ASSERT
    expect(actual).toEqual(expected);
  });
});

describe("parse-config", () => {
  it("should throw if config does not match the expected schema", () => {
    expect(() => parseConfig(__dirname)).toThrow(Error);
  });
});
