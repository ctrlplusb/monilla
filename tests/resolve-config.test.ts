import fs from "fs";
import path from "path";
import tempy from "tempy";

import { configFileName } from "~/constants";
import { ErrorCode, errorMessageFor } from "~/monilla-error";
import { resolveConfig } from "~/resolve-config";

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
