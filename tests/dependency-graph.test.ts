import path from "path";

import { dependencyGraph } from "~/dependency-graph";
import { PackageMeta, resolvePackages } from "~/resolve-packages";
import { ErrorCode, errorMessageFor } from "~/yalcd-error";

describe("dependencyGraph", () => {
  const root: PackageMeta = {
    name: "root",
    packageJson: {},
    isRoot: true,
    path: "./package.json",
  };

  test("should return an empty array if no packageJsons are provided", () => {
    const actual = dependencyGraph([]);

    expect(actual).toEqual([]);
  });

  test("[integration test] should resolve the expected graph", () => {
    const packages = resolvePackages(
      path.join(__dirname, "__fixtures__/example-monorepo"),
    );

    const actual = dependencyGraph(packages);

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
      path: "./a/package.json",
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: { dependencies: { c: "*" } },
      isRoot: false,
      path: "./b/package.json",
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: {},
      isRoot: false,
      path: "./c/package.json",
    };

    // ACT
    const actual = dependencyGraph([root, a, b, c]);

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
      path: "./a/package.json",
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: {},
      isRoot: false,
      path: "./b/package.json",
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: {},
      isRoot: false,
      path: "./c/package.json",
    };

    // ACT
    const actual = dependencyGraph([root, a, b, c]);

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
      path: "./a/package.json",
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: { dependencies: { a: "*" } },
      isRoot: false,
      path: "./b/package.json",
    };

    // ACT + ASSERT
    expect(() => dependencyGraph([root, a, b])).toThrowError(
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
      path: "./a/package.json",
    };
    const b: PackageMeta = {
      name: "b",
      packageJson: { dependencies: { c: "*" } },
      isRoot: false,
      path: "./b/package.json",
    };
    const c: PackageMeta = {
      name: "c",
      packageJson: { dependencies: { a: "*" } },
      isRoot: false,
      path: "./c/package.json",
    };

    // ACT + ASSERT
    expect(() => dependencyGraph([root, a, b, c])).toThrowError(
      errorMessageFor(ErrorCode.CircularDependency),
    );
  });
});
