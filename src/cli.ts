#!/bin/env node

import yargs from "yargs";

import packageJSON from "../package.json";
import { cliCommand } from "./constants";
import { buildPackageTree, executeAgainstPackageTree } from "./package-tree";
import { resolvePackages } from "./resolve-packages";
import { resolveRootDirectory } from "./resolve-root-directory";
import { runCommandAgainstPackage } from "./spawn";

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
      // TODO: Internal package linking

      const rootDirectory = await resolveRootDirectory(process.cwd());
      const packages = await resolvePackages(rootDirectory);
      const packageTree = buildPackageTree(packages);

      await executeAgainstPackageTree(packageTree, async (packageMeta) => {
        await runCommandAgainstPackage(packageMeta, "npm", ["install"]);
      });
    },
  })
  .help("help").argv;
