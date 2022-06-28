import chokidar from "chokidar";
import path from "path";

import {
  buildPackageTree,
  executeAgainstPackageTree,
  PackageMeta,
  resolvePackages,
  updateInternalDependencyPathsForPackage,
} from "./packages";
import { runCommandAgainstPackage, spawnClean } from "./spawn";
import { copyPackageToStore, resolveStoreDirectory } from "./store";

export async function install(rootDirectory: string): Promise<void> {
  const storeDirectory = await resolveStoreDirectory(rootDirectory);

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

export async function upgrade(rootDirectory: string, opts: { target: string }) {
  console.log(`Finding "${opts.target}" package upgrades`);
  await spawnClean(rootDirectory, "npx", [
    "npm-check-updates",
    "--deep",
    "--interactive",
    "--loglevel",
    "minimal",
    "--target",
    opts.target,
  ]);
  await install(rootDirectory);
}

export async function watch(rootDirectory: string) {
  const packages = await resolvePackages(rootDirectory);
  const packageTree = buildPackageTree(packages);

  const linkedPackages = packageTree.reduce<PackageMeta[]>((acc, level) => {
    level.forEach((pkgNode) => {
      if (pkgNode.dependants.length > 0) {
        acc.push(pkgNode.packageMeta);
      }
    });
    return acc;
  }, []);

  // const packageTree = buildPackageTree(packages);

  const watcher = chokidar.watch(
    linkedPackages.map((pkg) => path.join(pkg.directory, "src")),
  );

  watcher.addListener("change", async () => {
    console.log("done");
  });

  let resolver: (v: any) => void;

  const promise = new Promise((resolve) => {
    resolver = resolve;
  });

  await promise;
}
