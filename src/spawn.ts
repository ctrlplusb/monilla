import { spawn } from "child_process";
import { echoChildProcessOutput } from "child-process-toolbox";

import { PackageMeta } from "./packages";

export async function runCommandAgainstPackage(
  packageMeta: PackageMeta,
  command: string,
  args: readonly string[] = [],
): Promise<void> {
  const childProcess = spawn(command, args, {
    cwd: packageMeta.directory,
  });

  console.info(
    `[${packageMeta.name}] Running command: ${command} ${args.join(" ")}`,
  );

  echoChildProcessOutput(childProcess, {
    errPrefix: `[${packageMeta.name}] `,
    outPrefix: `[${packageMeta.name}] `,
  });

  return new Promise((resolve) => {
    childProcess.on("exit", (code) => {
      // TODO: Handle failures etc
      console.log(`[${packageMeta.name}] Exited with code "${code}"`);
      resolve();
    });
  });
}
