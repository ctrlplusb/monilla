import { spawn } from "child_process";
import { echoChildProcessOutput, promiseKilled } from "child-process-toolbox";

import { PackageMeta } from "./resolve-packages";

export async function runCommandAgainstPackage(
  packageMeta: PackageMeta,
  command: string,
  args: string[] = [],
) {
  const childProcess = spawn(command, args, {
    cwd: packageMeta.directory,
  });

  console.info(
    `[${packageMeta.name}]  Running command: ${command} ${args.join(" ")}`,
  );

  echoChildProcessOutput(childProcess, {
    errPrefix: `[${packageMeta.name}] `,
    outPrefix: `[${packageMeta.name}] `,
  });

  await promiseKilled(childProcess);
}
