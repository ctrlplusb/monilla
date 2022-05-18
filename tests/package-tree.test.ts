import path from "path";

import { ErrorCode, errorMessageFor } from "~/monilla-error";
import {
  buildPackageTree,
  executeAgainstPackageTree,
  PackageTreeLevel,
} from "~/package-tree";
import { PackageMeta, resolvePackages } from "~/resolve-packages";

describe("buildPackageTree", () => {
  const root: PackageMeta = {
    name: "root",
    packageJson: {},
    isRoot: true,
    packageJsonPath: "./package.json",
    directory: "./",
  };

  test("should return an empty array if no packageJsons are provided", () => {
    const actual = buildPackageTree([]);

    expect(actual).toEqual([]);
  });

  test("[integration] should resolve the expected graph", async () => {
    const packages = await resolvePackages(
      path.join(__dirname, "__fixtures__/simple-monorepo"),
    );

    const actual = buildPackageTree(packages);

    expect(actual).toMatchObject([
      [{ name: "example-monorepo" }],
      [{ name: "@my/messages" }],
      [{ name: "@my/terminal" }],
    ]);
  });

  test("case-1", () => {
    /*
    root
    |- a(b)
    |- b(c)
    |- c
    */

    // ARRANGE

    const a: PackageMeta = {
      name: "a",
      packageJson: { dependencies: { b: "*" } },
      isRoot: false,
      packageJsonPath: "./a/package.json",
      directory: "./a/",
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: { dependencies: { c: "*" } },
      isRoot: false,
      packageJsonPath: "./b/package.json",
      directory: "./b/",
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./c/package.json",
      directory: "./c/",
    };

    // ACT
    const actual = buildPackageTree([root, a, b, c]);

    // EXPECT
    expect(actual).toMatchObject([
      [{ name: "root" }],
      [{ name: "c" }],
      [{ name: "b" }],
      [{ name: "a" }],
    ]);
  });

  test("case-2", () => {
    /*
    root
    |- a(b, c)
    |- c
    */

    // ARRANGE

    const a: PackageMeta = {
      name: "a",
      packageJson: { dependencies: { b: "*", c: "*" } },
      isRoot: false,
      packageJsonPath: "./a/package.json",
      directory: "./a/",
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./b/package.json",
      directory: "./b/",
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./c/package.json",
      directory: "./c/",
    };

    // ACT
    const actual = buildPackageTree([root, a, b, c]);

    // EXPECT
    expect(actual).toMatchObject([
      [{ name: "root" }],
      [{ name: "b" }, { name: "c" }],
      [{ name: "a" }],
    ]);
  });

  test("case-3 - direct circular dependency", () => {
    /*
    root
    |- a(b)
    |- b(a)
    */

    // ARRANGE

    const a: PackageMeta = {
      name: "a",
      packageJson: { dependencies: { b: "*" } },
      isRoot: false,
      packageJsonPath: "./a/package.json",
      directory: "./a/",
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: { dependencies: { a: "*" } },
      isRoot: false,
      packageJsonPath: "./b/package.json",
      directory: "./b/",
    };

    // ACT + ASSERT
    expect(() => buildPackageTree([root, a, b])).toThrowError(
      errorMessageFor(ErrorCode.CircularDependency),
    );
  });

  test("case-4 - once removed circular dependency", () => {
    /*
    root
    |- a(b)
    |- b(c)
    |- c(a)
    */

    // ARRANGE

    const a: PackageMeta = {
      name: "a",
      packageJson: { dependencies: { b: "*" } },
      isRoot: false,
      packageJsonPath: "./a/package.json",
      directory: "./a/",
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: { dependencies: { c: "*" } },
      isRoot: false,
      packageJsonPath: "./b/package.json",
      directory: "./b/",
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: { dependencies: { a: "*" } },
      isRoot: false,
      packageJsonPath: "./c/package.json",
      directory: "./c/",
    };

    // ACT + ASSERT
    expect(() => buildPackageTree([root, a, b, c])).toThrowError(
      errorMessageFor(ErrorCode.CircularDependency),
    );
  });
});

describe("executeAgainstPackageTree", () => {
  test("executes actions in the expected order", async () => {
    const a: PackageMeta = {
      name: "a",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./a/package.json",
      directory: "./a/",
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./b/package.json",
      directory: "./b/",
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./c/package.json",
      directory: "./c/",
    };
    const d: PackageMeta = {
      name: "d",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./d/package.json",
      directory: "./d/",
    };

    const level1: PackageTreeLevel = [a];
    const level2: PackageTreeLevel = [b, c];
    const level3: PackageTreeLevel = [d];

    const actual: string[] = [];

    await executeAgainstPackageTree(
      [level1, level2, level3],
      async (packageMeta) => {
        actual.push(`start: ${packageMeta.name}`);
        await new Promise((resolve) => setTimeout(resolve, 8));
        actual.push(`end: ${packageMeta.name}`);
      },
    );

    expect(actual).toEqual([
      "start: a",
      "end: a",
      "start: b",
      "start: c",
      "end: b",
      "end: c",
      "start: d",
      "end: d",
    ]);
  });
});
