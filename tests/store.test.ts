import {
  existsSync as exists,
  readFileSync as read,
  removeSync as remove,
} from "fs-extra";
import path from "path";

import { signatureFileName } from "~/constants";
import { copyPackageToStore } from "~/store";

describe("copyPackageToStore", () => {
  let storeDirectory: string;

  beforeAll(() => {
    storeDirectory = path.join(
      __dirname,
      ".temp",
      new Date().getTime().toString(),
    );
  });

  afterAll(async () => {
    if (exists(storeDirectory)) {
      remove(storeDirectory);
    }
  });

  test("[integration] kitchen sink package", async () => {
    const signature = await copyPackageToStore({
      packageDirectory: path.join(
        __dirname,
        "__fixtures__/kitchen-sink-package",
      ),
      storeDirectory,
    });

    const pkgDir = path.join(storeDirectory, "kitchen-sink");

    expect(exists(pkgDir)).toBe(true);
    expect(exists(path.join(pkgDir, signatureFileName))).toBe(true);
    expect(read(path.join(pkgDir, signatureFileName), "utf-8")).toEqual(
      signature,
    );
    expect(exists(path.join(pkgDir, "dist"))).toBe(true);
    expect(exists(path.join(pkgDir, "dist/index.js"))).toBe(true);
    expect(exists(path.join(pkgDir, "readme.md"))).toBe(true);
    expect(exists(path.join(pkgDir, "package.json"))).toBe(true);
    expect(exists(path.join(pkgDir, "src"))).toBe(false);
  });
});
