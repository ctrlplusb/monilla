import { spawn, spawnSync } from "child_process";

import { PackageMeta } from "./packages";

export async function spawnClean(
  workingDirectory: string,
  command: string,
  args: readonly string[] = [],
) {
  console.log(workingDirectory, command, args);

  spawnSync(command, ["--color=always", ...args], {
    shell: true,
    stdio: "inherit",
    cwd: workingDirectory,
  });
}

export async function runCommand(
  logPrefix: string,
  workingDirectory: string,
  command: string,
  args: readonly string[] = [],
): Promise<void> {
  const childProcess = spawn(command, ["--color=always", ...args], {
    shell: true,
    cwd: workingDirectory,
    stdio: "pipe",
    env: {
      ...process.env,
      FORCE_COLOR: "1",
    },
  });

  console.info(`[${logPrefix}] Running command: ${command} ${args.join(" ")}`);

  let oneStdout = "";
  childProcess.stdout.on("data", function (chunk) {
    oneStdout += chunk;
    const lines = oneStdout.split("\n");
    while (lines.length > 1) {
      const line = lines.shift();
      console.log(`[${logPrefix}] ${line}`);
    }
    oneStdout = lines.shift() || "";
  });
  return new Promise((resolve) => {
    childProcess.on("exit", function (code) {
      console.log(`[${logPrefix}] Ended with code ${code}`);
      resolve();
    });
  });
}

export async function runCommandAgainstPackage(
  packageMeta: PackageMeta,
  command: string,
  args: readonly string[] = [],
): Promise<void> {
  return runCommand(packageMeta.name, packageMeta.directory, command, args);
}
