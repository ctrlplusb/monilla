import {
  buildPackageTree,
  executeAgainstPackageTree,
  resolvePackages,
  updateInternalDependencyPathsForPackage,
} from "./packages";
import { resolveRootDirectory } from "./resolve-root-directory";
import { runCommandAgainstPackage, spawnClean } from "./spawn";
import { copyPackageToStore, resolveStoreDirectory } from "./store";

export async function install(workingDirectory: string): Promise<void> {
  const rootDirectory = await resolveRootDirectory(workingDirectory);
  const storeDirectory = await resolveStoreDirectory(workingDirectory);

  const packages = await resolvePackages(rootDirectory);
  const packageTree = buildPackageTree(packages);

  await executeAgainstPackageTree(packageTree, async (packageNode) => {
    // Check if this package has any dependants, if so we will need to build
    // the package and make it available via the store for consumption by
    // the dependants;
    if (packageNode.dependants.length > 0) {
      // This package has a build command, therefore we will execute it
      // to ensure we have all the required files available prior to
      // attempting to copy the package to the monilla store.
      if (packageNode.packageMeta.packageJson.scripts?.build != null) {
        await runCommandAgainstPackage(packageNode.packageMeta, "npm", [
          "run",
          "build",
        ]);
      }

      // Ensure that this package has been copied to our internal store
      await copyPackageToStore({
        packageDirectory: packageNode.packageMeta.directory,
        storeDirectory,
      });
    }

    // Check if this package has any dependencies on internal packages, if so
    // then we ensure that the package.json for our package has the correct
    // paths to our internal packages;
    if (packageNode.dependencies.length > 0) {
      await updateInternalDependencyPathsForPackage(
        packageNode.packageMeta,
        storeDirectory,
      );
    }

    await runCommandAgainstPackage(packageNode.packageMeta, "npm", [
      "install",
      // Introduced in npm@8.8.0
      // @see https://github.com/npm/cli/issues/2339#issuecomment-1111228605
      "--install-links",
    ]);
  });
}

export async function updateDeps(
  workingDirectory: string,
  opts: { target: string },
) {
  const rootDirectory = await resolveRootDirectory(workingDirectory);

  console.log(
    `Checking for package updates against target of "${opts.target}"...`,
  );
  await spawnClean(rootDirectory, "npx", [
    "npm-check-updates",
    "--deep",
    "--interactive",
    "--loglevel",
    "minimal",
    "--target",
    opts.target,
  ]);
  await install(workingDirectory);
}
