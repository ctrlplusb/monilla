import { mkdir, pathExists } from "fs-extra";
import path from "path";

import { monillaDirectoryName } from "./constants";
import { resolveRootDirectory } from "./resolve-root-directory";

export async function resolveStoreDirectory() {
  const rootDirectory = await resolveRootDirectory();

  const storeDirectory = path.join(
    rootDirectory,
    monillaDirectoryName,
    "store",
  );

  if (!(await pathExists(storeDirectory))) {
    await mkdir(storeDirectory, { recursive: true });
  }

  return storeDirectory;
}
