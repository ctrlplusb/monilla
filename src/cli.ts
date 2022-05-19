#!/bin/env node

import yargs from "yargs";

import packageJSON from "../package.json";
import { cliCommand } from "./constants";
import {
  buildPackageTree,
  executeAgainstPackageTree,
  linkStoreDependencies,
  resolvePackages,
} from "./packages";
import { resolveRootDirectory } from "./resolve-root-directory";
import { runCommandAgainstPackage } from "./spawn";
import { copyPackageToStore, resolveStoreDirectory } from "./store";

yargs
  .usage(cliCommand + " [command] [options]")
  .command({
    command: "*",
    builder: () => {
      return yargs.boolean(["version"]);
    },
    handler: (argv) => {
      let msg = "Use `monilla help` to see available commands.";
      if (argv._[0]) {
        msg = "Unknown command `" + argv._[0] + "`. " + msg;
      } else {
        if (argv.version) {
          msg = packageJSON.version;
        }
      }
      console.log(msg);
    },
  })
  .command({
    command: "install",
    describe:
      "Installs the dependencies for your packages and ensures internal packages are linked correctly",
    handler: async () => {
      const cwd = process.cwd();
      const rootDirectory = await resolveRootDirectory(cwd);
      const storeDirectory = await resolveStoreDirectory(cwd);
      const packages = await resolvePackages(rootDirectory);
      const packageTree = buildPackageTree(packages);

      const packagesInStore = new Set<string>();

      await executeAgainstPackageTree(packageTree, async (packageNode) => {
        // First ensure that all the internal package dependencies have been
        // copied to the shared store.
        for (const dependency of packageNode.dependencies) {
          if (packagesInStore.has(dependency.name)) {
            continue;
          }
          await copyPackageToStore({
            packageDirectory: dependency.directory,
            storeDirectory,
          });
          packagesInStore.add(dependency.name);
        }

        await linkStoreDependencies(packageNode.packageMeta, storeDirectory);

        await runCommandAgainstPackage(packageNode.packageMeta, "npm", [
          "install",
          // Introduced in npm@8.8.0
          // @see https://github.com/npm/cli/issues/2339#issuecomment-1111228605
          "--install-links",
        ]);
      });
    },
  })
  .help("help").argv;
