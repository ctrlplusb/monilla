import * as fs from "fs-extra";
import path from "path";
import * as z from "zod";

import { configFileName } from "./constants";
import { ErrorCode, MonillaError } from "./monilla-error";
import { resolveRootDirectory } from "./resolve-root-directory";

export async function resolveConfig(workingDirectory: string): Promise<string> {
  const rootDirectory = await resolveRootDirectory(workingDirectory);
  const configFilePath = path.join(rootDirectory, configFileName);
  const contents = fs.readFile(configFilePath, "utf-8");
  return contents;
}

/*
{
  verbose: false,
}
*/
const configSchema = z.object({
  verbose: z.boolean().optional().default(false),
});

type MonillaConfig = z.infer<typeof configSchema>;

export function parseConfig(config: string): MonillaConfig {
  const parsed = configSchema.safeParse(config);

  if (parsed.success === false) {
    throw new MonillaError(ErrorCode.InvalidConfig, parsed.error.toString());
  }

  throw new Error("Not implemented");
}
