import { PackageMeta } from "./resolve-packages";
import { ErrorCode, YalcdError } from "./yalcd-error";

type DependencyNode = PackageMeta[];

type DependencyGraph = DependencyNode[];

export function dependencyGraph(packageMetas: PackageMeta[]): DependencyGraph {
  const dependencyGraph: DependencyGraph = [];
  const packagesAddedToGraph: PackageMeta[] = [];

  const rootPackageMeta = packageMetas.find((p) => p.isRoot);
  if (rootPackageMeta != null) {
    dependencyGraph.push([rootPackageMeta]);
  }

  const otherPackageMetas = packageMetas.filter((p) => !p.isRoot);

  const buildGraph = (remainingPackages: PackageMeta[]) => {
    if (remainingPackages.length === 0) {
      // bail out. we are finished.
      return;
    }

    const nextLevel: PackageMeta[] = [];

    remainingPackages.forEach((currentPackage) => {
      const internalPackageReferences = remainingPackages.filter(
        (otherPackage) => {
          if (currentPackage.name === otherPackage.name) {
            return false;
          }

          const { dependencies, devDependencies, peerDependencies } =
            currentPackage.packageJson;

          if (dependencies != null && dependencies[otherPackage.name] != null) {
            return true;
          }

          if (
            devDependencies != null &&
            devDependencies[otherPackage.name] != null
          ) {
            return true;
          }

          if (
            peerDependencies != null &&
            peerDependencies[otherPackage.name] != null
          ) {
            return true;
          }

          return false;
        },
      );

      const alreadyProcessed = internalPackageReferences.filter((ref) => {
        return packagesAddedToGraph.find((p) => p.name === ref.name) != null;
      });

      if (alreadyProcessed.length === internalPackageReferences.length) {
        // Ready to add this one
        nextLevel.push(currentPackage);
        packagesAddedToGraph.push(currentPackage);
      }
    });

    if (nextLevel.length === 0) {
      throw new YalcdError(ErrorCode.CircularDependency);
    }

    dependencyGraph.push(nextLevel);

    const nextRemainingPackages = remainingPackages.filter(
      (x) => !packagesAddedToGraph.includes(x),
    );

    buildGraph(nextRemainingPackages);
  };

  buildGraph(otherPackageMetas);

  return dependencyGraph;
}
