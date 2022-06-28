# Monilla (✨ work in progress ✨)

A CLI to manage monorepos with predictability and stability.

&nbsp;

---

&nbsp;

- [1. Introduction](#1-introduction)
- [2. Goals](#2-goals)
- [3. Prerequisites](#3-prerequisites)
- [4. Install](#4-install)
- [5. Guide](#5-guide)
  - [5.1. Initialising your dependencies](#51-initialising-your-dependencies)
  - [5.2. Linking and Unlinking packages](#52-linking-and-unlinking-packages)
  - [5.3. Making updates to your linked packages](#53-making-updates-to-your-linked-packages)
  - [5.4. Watching updates to your linked packages](#54-watching-updates-to-your-linked-packages)
  - [5.5. Performing an interactive upgrade of dependencies across all packages](#55-performing-an-interactive-upgrade-of-dependencies-across-all-packages)
- [6. CLI Reference](#6-cli-reference)
- [7. Appreciation](#7-appreciation)
- [8. Further Reading / References](#8-further-reading--references)

&nbsp;

---

## 1. Introduction

Monilla is a CLI tool which improves the development experience against `npm`-based [monorepos](https://monorepo.tools).

- Quickly install dependencies across your monorepo, respecting any internal package references;
  ```bash
  monilla install
  ```
- Seamlessly link your packages within your monorepo;
  ```bash
  monilla link --from @my/components --to @my/ui
  ```
- Perform interactive dependency updates across your monorepo;
  ```bash
  monilla upgrade
  ```
- Coordinate command execution across your monorepo packages, whilst respecting their dependency tree;
  ```bash
  monilla run build
  ```

It avoids the use of workspaces or hoisting, treating each of your monorepo packages as though they were independent packages. We find that this approach increases the predictability and stability of packages within your monorepo. Dependency updates to one package should not affect another.

We lean heavily into a "standard" npm experience and promote the capability for packages to be easily lifted in or out of your monorepo.

&nbsp;

---

## 2. Goals

- Leverage standard `npm` as far as possible.

  At any time you should be able to stop using `monilla` and just run standard `npm` commands. Yes, you might have to execute a lot of `npm` commands depending on how many packages are in your project, but you'll be able to do so at the least.

- Treat each package as though it were an independent `npm` package.

  We expect that each package within your monorepo is built almost as if it were independent. It's own package.json scripts, dependencies, etc. This enables richer workflows for packages being operated against in isolation. For example, cleaner publishing workflows for packages to an `npm` registry, or simple lifting and shifting of packages in or out of your monorepo.

&nbsp;

---

## 3. Prerequisites

**Node.js** version 18 or higher is required to use this CLI.

> **Note**
>
> Unfortunately we have this hard requirement as there was a shift in the way that `npm` manages the dependencies for linked packages. A workaround was introduced in `npm@8.8.0`. A compatible version of `npm` ships with Node.js 18.

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

## 5. Guide

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

&nbsp;

### 5.1. Initialising your dependencies

Any time you need to make sure your dependencies for your packages are installed and internal packages are correctly linked, then this is the command for you;

```bash
monilla install
```

This performs two functions;

- Installs the required dependencies for each package within the monorepo, including the root
- Ensures that any linked packages within the monorepo are bound

&nbsp;

### 5.2. Linking and Unlinking packages

Linking enables you to use one of your monorepo packages within another as though it were installed via an NPM registry.

The example monorepo contains a mobile app, and a components library. If we wished to utilise the components library within the mobile app we can link the package.

You can do so by running the `link` command within the root of your monorepo;

```bash
monilla link @my/components --to @my/mobile-app
```

> **Note**
>
> If the source package has a `build` script we will execute it prior to link, ensuring that all the required source files are available.

Conversely, if you'd like to `unlink` a package you can do the following;

```bash
monilla unlink @my/components --from @my/mobile-app
```

> **Note**
>
> Monilla does not support circular dependencies between packages and will throw an error or warning if you try to create one.

&nbsp;

### 5.3. Making updates to your linked packages

If you've performed updates to one of your linked packages, you can ensure that all dependants are using the latest version via the following command;

```bash
monilla refresh
```

> **Note**
>
> If your linked package has a `build` script it will be executed prior to performing the refresh.

&nbsp;

### 5.4. Watching updates to your linked packages

To watch for changes to your packages, resulting in automatic building and refreshing of the packages, execute the following command;

```bash
monilla watch
```

> **Note**
>
> We utilise your `.gitignore` file to determine which files to ignore when executing this process.

&nbsp;

### 5.5. Performing an interactive upgrade of dependencies across all packages

To perform an interactive upgrade of the dependencies for all of the packages within your monorepo execute the following command;

```bash
monilla upgrade
```

You'll be asked which packages you'd like to update for each of the packages within your monorepo. After this has completed we'll take care of the installs and refreshing of your linked packages.

&nbsp;

---

## 6. CLI Reference

Coming soon. You can get help via the CLI `--help` flag;

```bash
monilla --help
```

&nbsp;

---

## 7. Appreciation

A huge thank you goes to [@wclr](https://github.com/wclr) for the outstanding work on [Yalc](https://github.com/wclr/yalc). The Yalc workflow is the specific seed which enabled this idea to grow. 🌻

An additional thank you is extended to [@raineorshine](https://github.com/raineorshine) for the amazing work on [`npm-check-update`](https://github.com/raineorshine/npm-check-updates). Updating dependencies would be too laborious without this amazing tool. We couldn't have done it better ourselves, so we have incorporated `npm-check-update` directly. ☀️

&nbsp;

---

## 8. Further Reading / References

- [monorepo.tools - Everything you need to know about monorepos, and the tools to build them.](https://monorepo.tools/)
- [An abbreviated history of JavaScript package managers](https://javascript.plainenglish.io/an-abbreviated-history-of-javascript-package-managers-f9797be7cf0e)
- [Exploring workspaces and other advanced package manager features](https://blog.logrocket.com/exploring-workspaces-other-advanced-package-manager-features/)
- [Inside the pain of monorepos and hoisting](https://www.jonathancreamer.com/inside-the-pain-of-monorepos-and-hoisting/)
- [The Hoisting Madness in Monorepos](https://enrq.me/dev/2020/04/04/hoisting-in-monorepos/)
- [Monorepos will ruin your life -- but they're worth it!](https://thenable.io/monorepos-will-ruin-your-life-but-theyre-worth-it)
- [nohoist in Workspaces](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/)
- [Tweet from Dan Abramov](https://twitter.com/dan_abramov/status/951931842273398784?lang=en)
