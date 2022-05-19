import pSeries from "p-series";

import { ErrorCode, MonillaError } from "./monilla-error";
import { PackageMeta } from "./resolve-packages";

function resolveDependenciesFor(
  forThis: PackageMeta,
  fromThese: PackageMeta[],
): PackageMeta[] {
  return fromThese.filter((p) =>
    forThis.internalPackageDependencies.includes(p.name),
  );
}

export type PackageNode = {
  packageMeta: PackageMeta;
  dependencies: PackageMeta[];
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
    packageTree.push([{ packageMeta: rootPackageMeta, dependencies: [] }]);
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
        nextLevel.push({
          packageMeta: unprocessedPackage,
          dependencies: resolveDependenciesFor(
            unprocessedPackage,
            packageMetas,
          ),
        });
        packagesAddedToTree.push(unprocessedPackage);
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
