import globby from "globby";
import path from "path";
import { PackageJson } from "type-fest";

import { ErrorCode, YalcdError } from "./yalcd-error";

export type PackageMeta = {
  name: string;
  path: string;
  packageJson: PackageJson;
  isRoot: boolean;
};

export function resolvePackages(rootDir: string): PackageMeta[] {
  const packageJsons: PackageMeta[] = [];

  const rootPackageJsonPath = path.join(rootDir, "package.json");

  const packageJsonPaths = globby.sync(path.join(rootDir, "/**/package.json"));

  for (const packageJsonPath of packageJsonPaths) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson: PackageJson = require(packageJsonPath);

    if (packageJson.name == null || packageJson.name.trim().length === 0) {
      throw new YalcdError(
        ErrorCode.InvalidPackageJSON,
        `Package "${packageJsonPath}" has no name.`,
      );
    }

    packageJsons.push({
      name: packageJson.name,
      path: packageJsonPath.replace(rootDir, "."),
      packageJson,
      isRoot: rootPackageJsonPath === packageJsonPath,
    });
  }

  return packageJsons;
}
