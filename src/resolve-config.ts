import { readFile } from "fs-extra";
import path from "path";

import { configFileName } from "./constants";
import { resolveRootDirectory } from "./resolve-root-directory";

export async function resolveConfig(workingDirectory: string) {
  const rootDirectory = await resolveRootDirectory(workingDirectory);
  const configFilePath = path.join(rootDirectory, configFileName);
  const contents = readFile(configFilePath, "utf-8");
  return contents;
}
