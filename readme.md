# Monilla (✨ work in progress ✨)

A CLI to manage monorepos with predictability and stability.

&nbsp;

---

&nbsp;

- [1. Introduction](#1-introduction)
- [2. Motivation](#2-motivation)
- [3. Prerequisites](#3-prerequisites)
- [4. Install](#4-install)
- [5. Requirements](#5-requirements)
- [6. Guide](#6-guide)
  - [6.1. Installing your dependencies](#61-installing-your-dependencies)
  - [6.2. Linking packages](#62-linking-packages)
  - [6.3. Updating linked packages](#63-updating-linked-packages)
  - [6.4. Watching updates to linked packages](#64-watching-updates-to-linked-packages)
  - [6.5. Upgrading package dependencies](#65-upgrading-package-dependencies)
- [7. CLI Reference](#7-cli-reference)
  - [7.1. `clean`](#71-clean)
  - [7.2. `install`](#72-install)
  - [7.3. `link`](#73-link)
  - [7.4. `refresh`](#74-refresh)
  - [7.5. `watch`](#75-watch)
  - [7.6. `upgrade`](#76-upgrade)
- [8. Appreciation](#8-appreciation)
- [9. Further Reading / References](#9-further-reading--references)

&nbsp;

---

## 1. Introduction

Monilla is a CLI tool which improves the development experience against `npm`-based [monorepos](https://monorepo.tools).

It avoids the use of workspaces or hoisting, treating each of your monorepo packages as though they were independent packages. We find that this approach increases the predictability and stability of packages within your monorepo. Dependency updates to one package should not affect another.

We lean heavily into a "standard" npm experience and promote the capability for packages to be easily lifted in or out of your monorepo.

- Install dependencies across your monorepo, and link internal packages;
  ```bash
  monilla install
  ```
- Declare a link between internal packages;
  ```bash
  monilla link --from @my/components --to @my/ui
  ```
- Perform interactive dependency upgrades across your monorepo;
  ```bash
  monilla upgrade
  ```
- Watch your packages for changes, updated linked packages;
  ```bash
  monilla watch
  ```

&nbsp;

---

## 2. Motivation

_Coming soon_

&nbsp;

---

## 3. Prerequisites

**Node.js** version 18 or higher is required to use this CLI.

> **Note**
>
> There was a change in behaviour between npm versions in how linked package dependencies were installed. A flag (`--install-links`) was introduced to the npm CLI to address this issue.
>
> Node 18 by default ships with a version of npm which includes support for this flag. Therefore we are making it a requirement that you utilise Node 18.

We highly recommend installing [nvm](https://github.com/nvm-sh/nvm) on your machine. It enables you to manage multiple versions of Node.js seamlessly. Utilising `nvm` you can install the required version of Node.js via the following command;

```bash
nvm install --default 18
```

> **Note**
>
> The `--default` flag will make this installation the default version on your machine.

&nbsp;

---

## 4. Install

We recommend installing monilla as a dev dependency in the root of your monorepo;

```bash
npm install monilla --save-dev
```

&nbsp;

---

## 5. Requirements

**Linked Packages `package.json` Design**

We expect that each package within your monorepo is built almost as if it were independent package, that _could_ be published to npm.

This means that you need to;

- add all the expected dependencies to your `package.json` to meet your package's needs;
- define the `main` _or_ `exports` _or_ `module` fields to indicate the entries and available imports from your package;
- define the `files` list, declaring which dirs/files should be exposed by your package;

For e.g.

```json
{
  "name": "@my/stuff",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup"
  },
  "dependencies": {
    "chalk": "^5.0.1"
  },
  "devDependencies": {
    "@types/node": "^16.11.41",
    "tsup": "^6.1.2",
    "typescript": "^4.7.4"
  }
}
```

> **Note**
>
> We declare our package as "private" with a version of "0.0.0". This is intentional as we never intend to actually publish our package to npm. It will only be used by other packages within the monorepo.

We will perform an "npm pack" of your linked packages, carrying across the expected files that would have been exposed if it were published to npm.

This enables us to produce an `npm install` behaviour for your linked packages that is essentially the same as a vanilla install should the package have been downloaded from the npm registry.

&nbsp;

---

## 6. Guide

Imagine a monorepo with the following structure:

```
my-mono-repo
|
|- apps
|  |
|  |- @my/mobile-app
|     |- src
|     |  |- index.js
|     |- package.json
|
|- packages
|  |
|  |- @my/components
|     |- src
|     |  |- index.js
|     |- package.json
|
|- package.json
```

Using this as a reference, we'll describe a few scenarios below.

> **Note**
>
> All of the below commands should be executed at the root of your monorepo.
>
> We have prefixed the commands with `npx` which enables you to quickly
> execute your local installation of the Monilla CLI.

&nbsp;

### 6.1. Installing your dependencies

```bash
npx monilla install
```

This performs two functions;

- Installs the required dependencies for each package within the monorepo, including the root
- Ensures that any linked packages within the monorepo are bound

&nbsp;

### 6.2. Linking packages

Linking enables you to utilise one of your monorepo packages within another as though it were installed via the NPM registry.

The example monorepo contains a mobile app, and a components library. If we wished to utilise the components library within the mobile app we can link the package.

You can do so by running the `link` command within the root of your monorepo;

```bash
npx monilla link --from @my/components --to @my/mobile-app
```

> **Note**
>
> Monilla will throw an error if you create a circular dependency between your packages.

> **Note**
>
> If the source package has a `build` script we will execute it prior to link, ensuring that all the required source files are available.

&nbsp;

### 6.3. Updating linked packages

If you've performed updates to one of your linked packages, you can ensure that all dependants are using the latest version of them via the following command;

```bash
npx monilla refresh
```

> **Note**
>
> If your linked package has a `build` script it will be executed prior to performing the refresh.

&nbsp;

### 6.4. Watching updates to linked packages

Watching your linked packages results in automatic building and pushing of the updates;

```bash
npx monilla watch
```

This command is especially useful when performing local development across your monorepo.

> **Note**
>
> We utilise your `.gitignore` file to determine which files to ignore when executing this process.

&nbsp;

### 6.5. Upgrading package dependencies

We support interactive upgrading of the dependencies for all the packages within your monorepo;

```bash
npx monilla upgrade
```

You'll be asked which packages you'd like to update for each of the packages within your monorepo. After this has completed we'll take care of the installs and refreshing of your linked packages.

> **Note**
>
> The command has additional flags allowing you to select the type of upgrades you wish to consider. By default we will only look for patch or minor updates for existing dependencies.

&nbsp;

---

## 7. CLI Reference

Work in progress. You can get help via the CLI `--help` flag;

```bash
npx monilla --help
```

### 7.1. `clean`

```bash
npx monilla clean
```

Removes all `node_modules` folders and `package-lock.json` files from across the monorepo. Supports the good old "nuke and retry" strategy when in dire need.

### 7.2. `install`

```bash
npx monilla install
```

This performs two functions;

- Installs the dependencies for every package, including the root.
- Ensures that any linked packages are bound.

### 7.3. `link`

```bash
npx monilla link --from @my/components --to @my/mobile-app
```

Link monorepo packages, declaring the `from` package as a dependency within the `to` package.

### 7.4. `refresh`

```bash
npx monilla refresh
```

Ensures that packages are using the latest form of their internal packages dependencies that have been linked against them.

### 7.5. `watch`

```bash
npx monilla watch
```

Starts a "development" process that will watch your linked packages for any changes, and will automatically update consuming packages to use the updated versions.

### 7.6. `upgrade`

```bash
npx monilla upgrade
```

Perform an interactive upgrade of the dependencies for all the packages within your monorepo.

&nbsp;

---

## 8. Appreciation

A huge thank you goes to [@wclr](https://github.com/wclr) for the outstanding work on [Yalc](https://github.com/wclr/yalc). The Yalc workflow is the specific seed which enabled this idea to grow. 🌻

An additional thank you is extended to [@raineorshine](https://github.com/raineorshine) for the amazing work on [`npm-check-update`](https://github.com/raineorshine/npm-check-updates). Updating dependencies would be too laborious without this amazing tool. We couldn't have done it better ourselves, so we have incorporated `npm-check-update` directly. ☀️

&nbsp;

---

## 9. Further Reading / References

- [monorepo.tools - Everything you need to know about monorepos, and the tools to build them.](https://monorepo.tools/)
- [An abbreviated history of JavaScript package managers](https://javascript.plainenglish.io/an-abbreviated-history-of-javascript-package-managers-f9797be7cf0e)
- [Exploring workspaces and other advanced package manager features](https://blog.logrocket.com/exploring-workspaces-other-advanced-package-manager-features/)
- [Inside the pain of monorepos and hoisting](https://www.jonathancreamer.com/inside-the-pain-of-monorepos-and-hoisting/)
- [The Hoisting Madness in Monorepos](https://enrq.me/dev/2020/04/04/hoisting-in-monorepos/)
- [Monorepos will ruin your life -- but they're worth it!](https://thenable.io/monorepos-will-ruin-your-life-but-theyre-worth-it)
- [nohoist in Workspaces](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/)
- [Tweet from Dan Abramov](https://twitter.com/dan_abramov/status/951931842273398784?lang=en)
