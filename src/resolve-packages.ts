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
  internalPackageDependencies: string[];
};

export async function resolvePackages(
  rootDirectory: string,
): Promise<PackageMeta[]> {
  const packageJsons: PackageMeta[] = [];

  const rootPackageJsonPath = path.join(rootDirectory, "package.json");

  const packageJsonPaths = await globby(
    path.join(rootDirectory, "/**/package.json"),
  );

  const packages = packageJsonPaths.reduce<
    Record<string, { packageJsonPath: string; packageJson: PackageJson }>
  >((acc, packageJsonPath) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson: PackageJson = require(packageJsonPath);

    if (packageJson.name == null || packageJson.name.trim().length === 0) {
      throw new MonillaError(
        ErrorCode.InvalidPackageJSON,
        `Package "${packageJsonPath}" has no name.`,
      );
    }

    acc[packageJson.name] = {
      packageJsonPath,
      packageJson,
    };

    return acc;
  }, {});

  const packageNames = Object.keys(packages);

  for (const packageName of packageNames) {
    const { packageJson, packageJsonPath } = packages[packageName];

    const dependencies = [
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ];

    const internalPackageDependencies = packageNames.filter((name) => {
      return dependencies.includes(name);
    });

    packageJsons.push({
      name: packageName,
      directory: dirname(packageJsonPath),
      packageJson,
      packageJsonPath,
      isRoot: rootPackageJsonPath === packageJsonPath,
      internalPackageDependencies,
    });
  }

  return packageJsons;
}
