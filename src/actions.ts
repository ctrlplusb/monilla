import {
  buildPackageTree,
  executeAgainstPackageTree,
  resolvePackages,
  updateInternalDependencyPathsForPackage,
} from "./packages";
import { resolveRootDirectory } from "./resolve-root-directory";
import { runCommandAgainstPackage } from "./spawn";
import { copyPackageToStore, resolveStoreDirectory } from "./store";

export async function install(workingDirectory: string): Promise<void> {
  const rootDirectory = await resolveRootDirectory(workingDirectory);
  const storeDirectory = await resolveStoreDirectory(workingDirectory);

  const packages = await resolvePackages(rootDirectory);
  const packageTree = buildPackageTree(packages);

  const packagesInStore = new Set<string>();

  await executeAgainstPackageTree(packageTree, async (packageNode) => {
    // First ensure that all the internal package dependencies have been
    // copied to the shared store.
    for (const dependency of packageNode.dependencies) {
      if (packagesInStore.has(dependency.name)) {
        // This dependency has already been copied to the store within this
        // CLI execution, therefore we will continue to the next dependency.
        continue;
      }
      // This package has a build command, therefore we will execute it
      // to ensure we have all the required files available prior to
      // attempting to copy the package to the monilla store.
      if (dependency.packageJson.scripts?.build != null) {
        await runCommandAgainstPackage(packageNode.packageMeta, "npm", [
          "build",
        ]);
      }
      await copyPackageToStore({
        packageDirectory: dependency.directory,
        storeDirectory,
      });
      packagesInStore.add(dependency.name);
    }

    // Then we ensure that the package.json for our package has the correct
    // paths to our internal packages.
    await updateInternalDependencyPathsForPackage(
      packageNode.packageMeta,
      storeDirectory,
    );

    await runCommandAgainstPackage(packageNode.packageMeta, "npm", [
      "install",
      // Introduced in npm@8.8.0
      // @see https://github.com/npm/cli/issues/2339#issuecomment-1111228605
      "--install-links",
    ]);
  });
}
