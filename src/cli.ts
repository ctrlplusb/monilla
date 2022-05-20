#!/bin/env node

import { spawnSync } from "child_process";
import { satisfies } from "semver";
import yargs from "yargs";

import packageJSON from "../package.json";
import { cliCommand, requiredMinNpmVersion } from "./constants";
import { ErrorCode, MonillaError } from "./monilla-error";
import {
  buildPackageTree,
  executeAgainstPackageTree,
  resolvePackages,
  updateInternalDependencyPathsForPackage,
} from "./packages";
import { resolveRootDirectory } from "./resolve-root-directory";
import { runCommandAgainstPackage } from "./spawn";
import { copyPackageToStore, resolveStoreDirectory } from "./store";

const npmVersion =
  spawnSync("npm", ["--version"], {
    encoding: "utf8",
  }).stdout?.trim() ?? "unknown";

if (!satisfies(npmVersion, `>=${requiredMinNpmVersion}`)) {
  throw new MonillaError(
    ErrorCode.InvalidNPMVersion,
    `We detected that you are using version "${npmVersion}"`,
  );
}

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
      "Installs the dependencies for your packages, whilst ensuring internal packages are linked correctly",
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
    },
  })
  .command({
    command: "link",
    describe: "Links the dependencies for your packages",
    builder: (args) => {
      return args.string("from");
    },
    handler: async (args) => {},
  })
  .help("help").argv;
