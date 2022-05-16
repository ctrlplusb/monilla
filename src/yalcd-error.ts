import { CustomError } from "ts-custom-error";

import { configFileName } from "~/constants";

export enum ErrorCode {
  MissingConfigFile = 0,
  InvalidConfig = 1,
  InvalidPackageJSON = 2,
  MissingRootPackageJSON = 3,
  SystemError = 4,
  CircularDependency = 5,
}

const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.MissingConfigFile]: `No "${configFileName}" configuration file found.`,
  [ErrorCode.InvalidConfig]: `Your "${configFileName}" contains an invalid configuration.`,
  [ErrorCode.InvalidPackageJSON]: `One of your packages has an invalid package.json.`,
  [ErrorCode.MissingRootPackageJSON]: `We could not find a package.json in your root directory. Please ensure it exists.`,
  [ErrorCode.SystemError]: `An unexpected error occurred.`,
  [ErrorCode.CircularDependency]: `There is a circular dependency between your packages.`,
};

export function errorMessageFor(code: ErrorCode): string {
  return errorMessages[code];
}

export class YalcdError extends CustomError {
  public constructor(public code: ErrorCode, public hint?: string) {
    super(errorMessages[code]);
  }
}
