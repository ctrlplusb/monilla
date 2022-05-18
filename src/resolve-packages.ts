import globby from "globby";
import path, { dirname } from "path";
import { PackageJson } from "type-fest";

import { ErrorCode, MonillaError } from "./monilla-error";

export type PackageMeta = {
  name: string;
  directory: string;
  packageJson: PackageJson;
  packageJsonPath: string;
  isRoot: boolean;
};

export async function resolvePackages(
  rootDirectory: string,
): Promise<PackageMeta[]> {
  const packageJsons: PackageMeta[] = [];

  const rootPackageJsonPath = path.join(rootDirectory, "package.json");

  const packageJsonPaths = await globby(
    path.join(rootDirectory, "/**/package.json"),
  );

  for (const packageJsonPath of packageJsonPaths) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson: PackageJson = require(packageJsonPath);

    if (packageJson.name == null || packageJson.name.trim().length === 0) {
      throw new MonillaError(
        ErrorCode.InvalidPackageJSON,
        `Package "${packageJsonPath}" has no name.`,
      );
    }

    packageJsons.push({
      name: packageJson.name,
      directory: dirname(packageJsonPath),
      packageJson,
      packageJsonPath,
      isRoot: rootPackageJsonPath === packageJsonPath,
    });
  }

  return packageJsons;
}
