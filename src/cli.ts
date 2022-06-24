#!/usr/bin/env node

import { spawnSync } from "child_process";
import semver from "semver";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import packageJSON from "../package.json";
import { install, updateDeps } from "./actions";
import { cliCommand, requiredMinNpmVersion } from "./constants";
import { ErrorCode, MonillaError } from "./monilla-error";

const npmVersion =
  spawnSync("npm", ["--version"], {
    encoding: "utf8",
  }).stdout?.trim() ?? "unknown";

if (!semver.satisfies(npmVersion, `>=${requiredMinNpmVersion}`)) {
  throw new MonillaError(
    ErrorCode.InvalidNPMVersion,
    `We detected that you are using version "${npmVersion}"`,
  );
}

yargs(hideBin(process.argv))
  .usage(cliCommand + " [command] [options]")
  .command({
    command: "*",
    builder: (args) => {
      return args.boolean(["version"]);
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
    command: "init",
    describe:
      "Initializes Monilla into your project, adding the required configuration",
    handler: () => {
      throw new MonillaError(ErrorCode.NotImplemented);
    },
  })
  .command({
    command: "install",
    describe:
      "Installs the dependencies across your monorepo, whilst also ensuring internal package dependencies linked correctly.",
    handler: async () => {
      const cwd = process.cwd();
      await install(cwd);
    },
  })
  .command({
    command: "update-deps",
    describe:
      "Perform an interactive update for the dependencies across your monorepo.",
    builder: (args) => {
      return args.option("target", {
        alias: "t",
        describe: `Choose the upgrade target (latest, minor, patch)
- latest:
Upgrade to whatever the package's "latest" tag points to. Excludes pre.
- minor (default):
Upgrade to the highest minor version without bumping the major version.
- patch:
Upgrade to the highest patch version without bumping the minor or major versions.`,
        choices: ["latest", "minor", "patch"],
        default: "minor",
      });
    },
    handler: async (argv) => {
      const cwd = process.cwd();
      await updateDeps(cwd, {
        target: argv.target,
      });
    },
  })
  .command({
    command: "link",
    describe: "Links the dependencies for your packages",
    builder: (args) => {
      return args.string("from");
    },
    handler: async () => {
      throw new MonillaError(ErrorCode.NotImplemented);
    },
  })
  .help("help").argv;
