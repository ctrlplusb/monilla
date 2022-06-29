import chokidar from "chokidar";
import path from "path";

import {
  buildPackageTree,
  copyInternalDependenciesToPackage,
  copyInternalDependencyToPackage,
  executeAgainstPackageTree,
  installPackageToStore,
  PackageNode,
  resolvePackages,
} from "./packages";
import { runCommandAgainstPackage, spawnClean } from "./spawn";
import { resolveStoreDirectory } from "./store";

export async function install(
  rootDirectory: string,
  performNpmInstall = true,
): Promise<void> {
  const storeDirectory = await resolveStoreDirectory(rootDirectory);

  const packages = await resolvePackages(rootDirectory);
  const packageTree = buildPackageTree(packages);

  await executeAgainstPackageTree(packageTree, async (packageNode) => {
    // Check if this package has any dependants, if so ensure that the package
    // is installed into our store so that other packages can reference it;
    if (packageNode.dependants.length > 0) {
      await installPackageToStore(storeDirectory, packageNode);
    }

    // Check if this package has any internal dependencies on internal packages,
    // if so we need to copy the dependencies from our store to the package's
    // node_modules;
    if (packageNode.dependencies.length > 0) {
      copyInternalDependenciesToPackage(
        packageNode.packageMeta,
        storeDirectory,
      );
    }

    if (performNpmInstall) {
      await runCommandAgainstPackage(packageNode.packageMeta, "npm", [
        "install",
        "--install-links",
      ]);
    }
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
  const storeDirectory = await resolveStoreDirectory(rootDirectory);
  const packages = await resolvePackages(rootDirectory);
  const packageTree = buildPackageTree(packages);

  // Reduce our package tree down to the packages that are dependencies for
  // other internal packages;
  const linkedPackages = packageTree.reduce<PackageNode[]>((acc, level) => {
    level.forEach((pkgNode) => {
      if (pkgNode.dependants.length > 0) {
        acc.push(pkgNode);
      }
    });
    return acc;
  }, []);

  // Set up a filesystem watcher each package's src directory;
  const watcher = chokidar.watch(
    // TODO: We need a way to define which files should be watched for changes.
    linkedPackages.map((pkgNode) =>
      path.join(pkgNode.packageMeta.directory, "src"),
    ),
    {
      ignoreInitial: true,
    },
  );

  watcher.on("all", async (event, triggerPath) => {
    for (const linkedPackage of linkedPackages) {
      if (triggerPath.startsWith(linkedPackage.packageMeta.directory)) {
        console.log(`Updating ${linkedPackage.packageMeta.name}`);

        await installPackageToStore(storeDirectory, linkedPackage);

        linkedPackage.dependants.forEach((dependant) => {
          console.log(`Refreshing ${dependant.name}`);
          copyInternalDependencyToPackage(
            dependant,
            storeDirectory,
            linkedPackage.packageMeta.name,
          );
        });
      }
    }
  });

  const promise = new Promise(() => {
    // Never resolve.

    console.log("Watching for changes. Press CTRL + C to exit");
  });

  await promise;
}
