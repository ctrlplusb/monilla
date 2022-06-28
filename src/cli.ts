#!/usr/bin/env node

import { spawnSync } from "child_process";
import semver from "semver";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import packageJSON from "../package.json";
import { install, upgrade, watch } from "./actions";
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
    command: "install",
    describe:
      "Installs the dependencies across your monorepo, whilst also ensuring internal package dependencies linked correctly.",
    handler: async () => {
      const cwd = process.cwd();
      await install(cwd);
    },
  })
  .command({
    command: "link",
    describe:
      "Link a package within your monorepo to another within the monorepo.",
    builder: (args) =>
      args
        .string(["from", "to"])
        .demandOption(["from", "to"])
        .describe("from", "The package to link from")
        .describe("to", "The package to link to")
        .usage("Usage: monilla link --from <from> --to <to>"),
    handler: async (argv) => {
      throw new MonillaError(ErrorCode.NotImplemented);
    },
  })
  .command({
    command: "upgrade",
    describe:
      "Perform an interactive upgrade for the monorepo package dependencies.",
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
      await upgrade(cwd, {
        target: argv.target,
      });
    },
  })
  .command({
    command: "watch",
    describe:
      "Watches linked packages, rebuilding and updating their links when changes are detected.",
    handler: async (argv) => {
      const cwd = process.cwd();
      await watch(cwd);
      throw new MonillaError(ErrorCode.NotImplemented);
    },
  })
  .help("help").argv;
