import fs from "fs";
import path from "path";
import { temporaryDirectory } from "tempy";
import { describe, expect, test } from "vitest";

import { parseConfig, resolveConfig } from "../src/config";
import { configFileName } from "../src/constants";
import { ErrorCode, errorMessageFor } from "../src/monilla-error";

describe("resolve-config", () => {
  test("should throw when no config file exists", async () => {
    await expect(() => resolveConfig(temporaryDirectory())).rejects.toThrow(
      errorMessageFor(ErrorCode.MissingConfigFile),
    );
  });

  test("should return the config file contents", async () => {
    // ARRANGE
    const expected = '{ "verbose": false }';
    const workingDirectory = temporaryDirectory();
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
  test("should throw if config does not match the expected schema", () => {
    expect(() => parseConfig(__dirname)).toThrow(Error);
  });
});
