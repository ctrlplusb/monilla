import path from "path";
import tempy from "tempy";

import { ErrorCode, errorMessageFor } from "~/monilla-error";
import {
  buildPackageTree,
  executeAgainstPackageTree,
  PackageMeta,
  PackageNode,
  PackageTreeLevel,
  resolvePackages,
} from "~/packages";

describe("buildPackageTree", () => {
  const root: PackageMeta = {
    name: "root",
    packageJson: {},
    isRoot: true,
    packageJsonPath: "./package.json",
    directory: "./",
    internalPackageDependencies: [],
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
      [{ packageMeta: { name: "example-monorepo" } }],
      expect.arrayContaining([
        expect.objectContaining({
          packageMeta: expect.objectContaining({ name: "@my/logger" }),
        }),
        expect.objectContaining({
          packageMeta: expect.objectContaining({ name: "@my/messages" }),
        }),
      ]),
      [
        {
          packageMeta: { name: "@my/terminal" },
          dependencies: expect.arrayContaining([
            expect.objectContaining({ name: "@my/logger" }),
            expect.objectContaining({ name: "@my/messages" }),
          ]),
        },
      ],
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
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./a/package.json",
      directory: "./a/",
      internalPackageDependencies: ["b"],
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./b/package.json",
      directory: "./b/",
      internalPackageDependencies: ["c"],
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./c/package.json",
      directory: "./c/",
      internalPackageDependencies: [],
    };

    // ACT
    const actual = buildPackageTree([root, a, b, c]);

    // EXPECT
    expect(actual).toMatchObject([
      [{ packageMeta: { name: "root" }, dependencies: [] }],
      [{ packageMeta: { name: "c" }, dependencies: [] }],
      [{ packageMeta: { name: "b" }, dependencies: [{ name: "c" }] }],
      [{ packageMeta: { name: "a" }, dependencies: [{ name: "b" }] }],
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
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./a/package.json",
      directory: "./a/",
      internalPackageDependencies: ["b", "c"],
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./b/package.json",
      directory: "./b/",
      internalPackageDependencies: [],
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./c/package.json",
      directory: "./c/",
      internalPackageDependencies: [],
    };

    // ACT
    const actual = buildPackageTree([root, a, b, c]);

    // EXPECT
    expect(actual).toMatchObject([
      [
        {
          packageMeta: { name: "root" },
          dependencies: [],
        },
      ],
      expect.arrayContaining([
        expect.objectContaining({
          packageMeta: expect.objectContaining({ name: "b" }),
          dependencies: [],
        }),
        expect.objectContaining({
          packageMeta: expect.objectContaining({ name: "c" }),
          dependencies: [],
        }),
      ]),
      [
        {
          packageMeta: { name: "a" },
          dependencies: expect.arrayContaining([
            expect.objectContaining({ name: "b" }),
            expect.objectContaining({ name: "c" }),
          ]),
        },
      ],
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
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./a/package.json",
      directory: "./a/",
      internalPackageDependencies: ["b"],
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./b/package.json",
      directory: "./b/",
      internalPackageDependencies: ["a"],
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
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./a/package.json",
      directory: "./a/",
      internalPackageDependencies: ["b"],
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./b/package.json",
      directory: "./b/",
      internalPackageDependencies: ["c"],
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: {},
      isRoot: false,
      packageJsonPath: "./c/package.json",
      directory: "./c/",
      internalPackageDependencies: ["a"],
    };

    // ACT + ASSERT
    expect(() => buildPackageTree([root, a, b, c])).toThrowError(
      errorMessageFor(ErrorCode.CircularDependency),
    );
  });
});

describe("executeAgainstPackageTree", () => {
  test("executes actions in the expected order", async () => {
    // ARRANGE

    /*
    root
    |- a(b,c,d)
    |- b(c)
    |- c(d)
    |- d
    */

    const a: PackageNode = {
      packageMeta: {
        name: "a",
        packageJson: {},
        isRoot: false,
        packageJsonPath: "./a/package.json",
        directory: "./a/",
        internalPackageDependencies: ["b", "c", "d"],
      },
      dependencies: [],
    };
    const b: PackageNode = {
      packageMeta: {
        name: "b",
        packageJson: {},
        isRoot: false,
        packageJsonPath: "./b/package.json",
        directory: "./b/",
        internalPackageDependencies: ["c"],
      },
      dependencies: [],
    };
    const c: PackageNode = {
      packageMeta: {
        name: "c",
        packageJson: {},
        isRoot: false,
        packageJsonPath: "./c/package.json",
        directory: "./c/",
        internalPackageDependencies: ["d"],
      },
      dependencies: [],
    };
    const d: PackageNode = {
      packageMeta: {
        name: "d",
        packageJson: {},
        isRoot: false,
        packageJsonPath: "./d/package.json",
        directory: "./d/",
        internalPackageDependencies: [],
      },
      dependencies: [],
    };

    const level1: PackageTreeLevel = [a];
    const level2: PackageTreeLevel = [b, c];
    const level3: PackageTreeLevel = [d];

    const actual: string[] = [];

    // ACT
    await executeAgainstPackageTree(
      [level1, level2, level3],
      async (packageNode) => {
        actual.push(`start: ${packageNode.packageMeta.name}`);
        await new Promise((resolve) => setTimeout(resolve, 8));
        actual.push(`end: ${packageNode.packageMeta.name}`);
      },
    );

    // ASSERT
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

describe("resolvePackages", () => {
  it("should return an empty array if no packages are found", async () => {
    const actual = await resolvePackages(tempy.directory());

    expect(actual).toEqual([]);
  });

  it("[integration] should resolve the expected packages", async () => {
    const workingDirectory = path.join(
      __dirname,
      "__fixtures__/simple-monorepo",
    );

    const actual = await resolvePackages(workingDirectory);

    expect(actual.sort((a, b) => a.name.localeCompare(b.name))).toMatchObject([
      {
        name: "@my/logger",
        packageJsonPath: path.join(
          workingDirectory,
          "./packages/logger/package.json",
        ),
        directory: path.join(workingDirectory, "./packages/logger"),
        packageJson: {
          private: true,
          name: "@my/logger",
          version: "1.0.0",
          main: "index.js",
        },
        isRoot: false,
        internalPackageDependencies: [],
      },
      {
        name: "@my/messages",
        packageJsonPath: path.join(
          workingDirectory,
          "./packages/messages/package.json",
        ),
        directory: path.join(workingDirectory, "./packages/messages"),
        packageJson: {
          private: true,
          name: "@my/messages",
          version: "1.0.0",
          main: "index.js",
        },
        isRoot: false,
        internalPackageDependencies: [],
      },
      {
        name: "@my/terminal",
        packageJsonPath: path.join(
          workingDirectory,
          "./apps/terminal/package.json",
        ),
        directory: path.join(workingDirectory, "./apps/terminal"),
        packageJson: {
          name: "@my/terminal",
          version: "1.0.0",
          description: "",
          main: "index.js",
          keywords: [],
          author: "Sean Matheson",
          license: "ISC",
          dependencies: {
            "@my/logger": "*",
            "@my/messages": "*",
          },
        },
        isRoot: false,
        internalPackageDependencies: ["@my/logger", "@my/messages"],
      },
      {
        name: "example-monorepo",
        packageJsonPath: path.join(workingDirectory, "./package.json"),
        directory: workingDirectory,
        packageJson: {
          private: true,
          name: "example-monorepo",
          version: "1.0.0",
          description: "Example monorepo to aid testing of Monilla",
        },
        isRoot: true,
        internalPackageDependencies: [],
      },
    ]);
  });
});
