import * as z from "zod";

import { ErrorCode, MonillaError } from "./monilla-error";

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
