import crypto from "crypto";
import fs, { mkdir, pathExists } from "fs-extra";
import npmPacklist from "npm-packlist";
import path from "path";
import readPkg, { NormalizedPackageJson } from "read-pkg";

import { monillaDirectoryName, signatureFileName } from "./constants";
import { ErrorCode, MonillaError } from "./monilla-error";
import { resolveRootDirectory } from "./resolve-root-directory";

export async function resolveStoreDirectory(workingDirectory: string) {
  const rootDirectory = await resolveRootDirectory(workingDirectory);

  const storeDirectory = path.join(
    rootDirectory,
    monillaDirectoryName,
    "node_modules",
  );

  if (!(await pathExists(storeDirectory))) {
    await mkdir(storeDirectory, { recursive: true });
  }

  return storeDirectory;
}

const fixScopedRelativeName = (path: string) => path.replace(/^\.\//, "");

const getFileHash = (srcPath: string, relPath = "") => {
  return new Promise<string>((resolve, reject) => {
    const stream = fs.createReadStream(srcPath);
    const md5sum = crypto.createHash("md5");
    md5sum.update(relPath.replace(/\\/g, "/"));
    stream.on("data", (data: string) => md5sum.update(data));
    stream.on("error", reject).on("close", () => {
      resolve(md5sum.digest("hex"));
    });
  });
};

const copyFile = async (
  srcPath: string,
  destPath: string,
  relativePath = "",
) => {
  await fs.copy(srcPath, destPath);
  return getFileHash(srcPath, relativePath);
};

type Signature = string;

const readSignatureFile = async (
  workingDir: string,
): Promise<Signature | undefined> => {
  const signatureFilePath = path.join(workingDir, signatureFileName);
  if (await fs.pathExists(signatureFilePath)) {
    try {
      const fileData = await fs.readFile(signatureFilePath, "utf-8");
      return fileData;
    } catch (e) {
      // TODO: Replace with MonillaError
      console.error("Could not read signature file");
      throw e;
    }
  }
  return undefined;
};

const writeSignatureFile = async (
  workingDir: string,
  signature: Signature,
): Promise<void> => {
  const signatureFilePath = path.join(workingDir, signatureFileName);
  try {
    await fs.writeFile(signatureFilePath, signature, "utf-8");
  } catch (e) {
    // TODO: Replace with MonillaError
    console.error("Could not write signature file");
    throw e;
  }
};

const readPackageJson = async (
  workingDir: string,
): Promise<NormalizedPackageJson> => {
  const pkg = await readPkg({ cwd: workingDir });
  if (!pkg) {
    throw new MonillaError(
      ErrorCode.SystemError,
      "Expected package.json to exist, or failed to read it",
    );
  }
  if (pkg.name == null || pkg.name.trim() === "") {
    throw new MonillaError(
      ErrorCode.InvalidPackageJSON,
      "Expected package.json to have a name",
    );
  }

  return pkg;
};

export const copyPackageToStore = async (options: {
  packageDirectory: string;
  storeDirectory: string;
}): Promise<Signature> => {
  const packageJson = await readPackageJson(options.packageDirectory);

  const packageDirectoryInStore = path.join(
    options.storeDirectory,
    packageJson.name,
  );

  const filesToCopy: string[] = (
    await npmPacklist({ path: options.packageDirectory })
  ).map(fixScopedRelativeName);

  if (process.env.VERBOSE === "true") {
    console.info("Files included in published content:");
    filesToCopy.sort().forEach((f) => {
      console.log(`- ${f}`);
    });
    console.info(`Total ${filesToCopy.length} files.`);
  }

  const publishedSig = await readSignatureFile(packageDirectoryInStore);

  const hashes = await Promise.all(
    filesToCopy
      .sort()
      .map((relPath) =>
        getFileHash(path.join(options.packageDirectory, relPath), relPath),
      ),
  );

  const signature = crypto
    .createHash("md5")
    .update(hashes.join(""))
    .digest("hex");

  if (signature === publishedSig) {
    return signature;
  } else {
    // Copy the files to the store
    await fs.remove(packageDirectoryInStore);
    await Promise.all(
      filesToCopy
        .sort()
        .map((relativePath) =>
          copyFile(
            path.join(options.packageDirectory, relativePath),
            path.join(packageDirectoryInStore, relativePath),
            relativePath,
          ),
        ),
    );
  }

  await writeSignatureFile(packageDirectoryInStore, signature);

  return signature;
};
