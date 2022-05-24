import { findUp } from "find-up";
import path from "path";

import { configFileName } from "./constants";
import { ErrorCode, MonillaError } from "./monilla-error";

export async function resolveRootDirectory(workingDirectory: string) {
  const configFilePath = await findUp(configFileName, {
    cwd: workingDirectory,
  });

  if (configFilePath == null) {
    throw new MonillaError(ErrorCode.MissingConfigFile);
  }

  return path.dirname(configFilePath);
}
