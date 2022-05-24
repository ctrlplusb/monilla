#!/usr/bin/env node

import { spawnSync } from "child_process";
import { satisfies } from "semver";
import yargs from "yargs";

import packageJSON from "../package.json";
import { install } from "./actions";
import { cliCommand, requiredMinNpmVersion } from "./constants";
import { ErrorCode, MonillaError } from "./monilla-error";

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
