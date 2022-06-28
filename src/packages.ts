import fs from "fs-extra";
import { globby } from "globby";
import pSeries from "p-series";
import path, { dirname } from "path";
import { readPackage } from "read-pkg";
import { JsonObject, PackageJson } from "type-fest";
import { writePackage } from "write-pkg";

import { ErrorCode, MonillaError } from "./monilla-error";
import { spawnClean } from "./spawn";

function resolveDependenciesFor(
  forThis: PackageMeta,
  fromThese: PackageMeta[],
): PackageMeta[] {
  return fromThese.filter((p) =>
    forThis.internalPackageDependencies.includes(p.name),
  );
}

function resolveDependantsFor(
  forThis: PackageMeta,
  fromThese: PackageMeta[],
): PackageMeta[] {
  return fromThese.filter((p) =>
    p.internalPackageDependencies.includes(forThis.name),
  );
}

export type PackageNode = {
  packageMeta: PackageMeta;
  dependencies: PackageMeta[];
  dependants: PackageMeta[];
};

export type PackageTreeLevel = PackageNode[];

export type PackageTree = PackageTreeLevel[];

export function buildPackageTree(packageMetas: PackageMeta[]): PackageTree {
  const packageTree: PackageTree = [];
  const packagesAddedToTree: PackageMeta[] = [];

  const rootPackageMeta = packageMetas.find((p) => p.isRoot);
  if (rootPackageMeta != null) {
    // TODO: The root package shouldn't be a dependency of any other package,
    // or have any dependency to any other package. Perhaps we should guard
    // against this case explicitly?
    packageTree.push([
      { packageMeta: rootPackageMeta, dependencies: [], dependants: [] },
    ]);
  }

  const otherPackageMetas = packageMetas.filter((p) => !p.isRoot);

  const addLevelToTree = (unprocessedPackages: PackageMeta[]) => {
    if (unprocessedPackages.length === 0) {
      // There are no more packages to process, we can return as the tree
      // has been built
      return;
    }

    // Utilise this local variable to build out the next level of the tree
    const nextLevel: PackageNode[] = [];

    unprocessedPackages.forEach((unprocessedPackage) => {
      // We first want to determine if the target unprocessed package has any
      // internal package dependency references to packages which have not
      // yet been added to the tree
      const referencesToUnprocessedPackages = resolveDependenciesFor(
        unprocessedPackage,
        unprocessedPackages,
      );

      if (referencesToUnprocessedPackages.length === 0) {
        // If there are 0, then we know that all of the internal package dependencies
        // for this package (if they had any) have been added to the tree, which
        // means we can safely add this package to the tree

        // We need to do an additional check to ensure this package has not
        // already been added at this level. It could be that their are multiple
        // packages referencing this package at the next level, which could
        // cause duplicate entries;
        if (
          nextLevel.find(
            (p) => p.packageMeta.name === unprocessedPackage.name,
          ) == null
        ) {
          nextLevel.push({
            packageMeta: unprocessedPackage,
            dependencies: resolveDependenciesFor(
              unprocessedPackage,
              packageMetas,
            ),
            dependants: resolveDependantsFor(unprocessedPackage, packageMetas),
          });
          packagesAddedToTree.push(unprocessedPackage);
        }
      }
    });

    if (nextLevel.length === 0) {
      // For us to hit this case means that we have unprocessed packages, but
      // we were unable to isolate any for this tree level as they have references
      // to packages that have not been added to the graph. We were unable to
      // filter them down likely due to the fact that there is a circular
      // dependency between the remaining packages.
      // TODO: Figure out a way to provide a helpful error message to aid users
      // in debugging this issue
      throw new MonillaError(ErrorCode.CircularDependency);
    }

    packageTree.push(nextLevel);

    // Continue building the tree, moving to the next level with the remaining
    // packages that have yet to be processed
    addLevelToTree(
      unprocessedPackages.filter((x) => !packagesAddedToTree.includes(x)),
    );
  };

  addLevelToTree(otherPackageMetas);

  return packageTree;
}

export async function executeAgainstPackageTree(
  packageTree: PackageTree,
  action: (packageNode: PackageNode) => unknown,
): Promise<unknown> {
  if (packageTree.length === 0) {
    return Promise.resolve();
  }
  return pSeries(
    packageTree.map(
      (treeLevel) => () =>
        Promise.all(
          treeLevel.map((packageNode) => Promise.resolve(action(packageNode))),
        ),
    ),
  );
}

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
    {
      gitignore: true,
      ignore: ["**/node_modules/**"],
    },
  );

  const packages: Record<
    string,
    { packageJsonPath: string; packageJson: PackageJson }
  > = {};

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson: PackageJson = await readPackage({
      cwd: path.dirname(packageJsonPath),
      normalize: false,
    });

    if (packageJson.name == null || packageJson.name.trim().length === 0) {
      throw new MonillaError(
        ErrorCode.InvalidPackageJSON,
        `Package "${packageJsonPath}" has no name.`,
      );
    }

    packages[packageJson.name] = {
      packageJsonPath,
      packageJson,
    };
  }

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

export async function updateInternalDependencyPathsForPackage(
  packageMeta: PackageMeta,
  storeDirectory: string,
): Promise<void> {
  if (packageMeta.internalPackageDependencies.length === 0) {
    return;
  }

  const packageJson = await readPackage({
    cwd: packageMeta.directory,
    normalize: false,
  });

  for (const internalPackageName of packageMeta.internalPackageDependencies) {
    const dependencyProperties = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
    ] as const;

    dependencyProperties.forEach((dependencyType) => {
      const dependencies = packageJson[dependencyType];
      if (dependencies != null && dependencies[internalPackageName]) {
        dependencies[internalPackageName] = `file:${path.relative(
          packageMeta.directory,
          path.join(storeDirectory, internalPackageName),
        )}`;
      }
    });

    // Create a symbolic link of the package dependency within the node_modules
    // directory for the current package. The symbolic link will point to
    // the monilla store containing a prepped version of the internal package.
    const symlinkPath = path.join(
      packageMeta.directory,
      "node_modules",
      internalPackageName,
    );
    try {
      fs.removeSync(symlinkPath);
    } catch (_err) {
      // Swallow this error - a prior symlink didn't exist.
    }
    fs.symlinkSync(
      path.join(storeDirectory, internalPackageName),
      symlinkPath,
      "dir",
    );
  }

  await writePackage(packageMeta.directory, packageJson as JsonObject, {
    normalize: false,
  });
}
