import { CustomError } from "ts-custom-error";

import { configFileName } from "~/constants";

export enum ErrorCode {
  MissingConfigFile = 0,
  InvalidConfig = 1,
  InvalidPackageJSON = 2,
  MissingRootPackageJSON = 3,
  SystemError = 4,
  CircularDependency = 5,
  InvalidNPMVersion = 6,
  NotImplemented = 7,
}

const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.MissingConfigFile]: `No "${configFileName}" configuration file found.`,
  [ErrorCode.InvalidConfig]: `Your "${configFileName}" contains an invalid configuration.`,
  [ErrorCode.InvalidPackageJSON]: `One of your packages has an invalid package.json.`,
  [ErrorCode.MissingRootPackageJSON]: `We could not find a package.json in your root directory. Please ensure it exists.`,
  [ErrorCode.SystemError]: `An unexpected error occurred.`,
  [ErrorCode.CircularDependency]: `There is a circular dependency between your packages.`,
  [ErrorCode.InvalidNPMVersion]: `You have an invalid version of npm running. We require v8.8.0 or higher. Please see our docs for more information.`,
  [ErrorCode.NotImplemented]: `Apologies, this feature is not yet implemented. Monilla is still a work in progress. Please check in via the GitHub discussions if something is important to you.`,
};

export function errorMessageFor(code: ErrorCode): string {
  return errorMessages[code];
}

export class MonillaError extends CustomError {
  public constructor(public code: ErrorCode, public hint?: string) {
    super(errorMessages[code]);
  }
}
