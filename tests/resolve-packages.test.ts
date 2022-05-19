import path from "path";
import tempy from "tempy";

import { resolvePackages } from "~/resolve-packages";

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
