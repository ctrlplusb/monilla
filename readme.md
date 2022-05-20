# Monilla (✨ work in progress ✨)

Manage the dependencies within your Node.js based monorepo\* in a vanilla-esque manner.

> **\*** _A single repository containing multiple distinct projects (packages), with well-defined relationships._

&nbsp;

---

&nbsp;

- [1. Introduction](#1-introduction)
- [2. Limitations](#2-limitations)
- [3. Prerequisites](#3-prerequisites)
  - [3.2. Installing the required Node.js version](#32-installing-the-required-nodejs-version)
  - [3.1. Upgrading your npm to the required version](#31-upgrading-your-npm-to-the-required-version)
- [4. Installation and Configuration](#4-installation-and-configuration)
- [5. Guide](#5-guide)
  - [5.1. Initialising your dependencies](#51-initialising-your-dependencies)
  - [5.2. Linking and Unlinking packages](#52-linking-and-unlinking-packages)
  - [5.3. Making updates to your linked packages](#53-making-updates-to-your-linked-packages)
  - [5.4. Watching updates to your linked packages](#54-watching-updates-to-your-linked-packages)
  - [5.5. Performing an interactive update of dependencies across all packages](#55-performing-an-interactive-update-of-dependencies-across-all-packages)
- [6. CLI Reference](#6-cli-reference)
- [7. Appreciation](#7-appreciation)
- [8. Further Reading / References](#8-further-reading--references)

&nbsp;

---

## 1. Introduction

This is a CLI tool that aids in managing the dependencies and cross package references within your Node.js based [monorepo](https://monorepo.tools).

It does this **without** the use of workspaces or hoisting. We manage the dependencies, for each package within your monorepo, utilising as close to a vanilla npm experience as we can achieve.

This means there is more duplication of dependencies across your packages, but we feel that there is an increased predictability, as well as a reduction in risk of dealing with complex dependency resolution bugs that were created due to dependency hoisting.

We lean heavily into a "standard" npm experience and promote the capability for packages to be easily lifted in or out of your monorepo.

Each package owns its own dependencies, with a standard `npm install` being coordinated against them. Cross package dependencies are enabled by utilising a similar approach proved by the [Yalc CLI](https://github.com/wclr/yalc).

&nbsp;

---

## 2. Limitations

- **Only supports Node.js >= 16 and npm >= 8.8.0**

  Specialising against these allows us to provide stronger guarantees, whilst also unlocking critical features which allowed us to achieve our goals.

- **Disk space**

  You will likely use more of it with our approach, comparing it to the hoisting or symlinking strategies adopted by some package managers.

  This trade off is intentional, sacrificing a few megabytes in exchange for sanity felt like a fair exchange.

- **Does not support package publishing**

  This tool is currently designed to work against private packages. We haven't considered workflows for packages that require to be published to a registry. We would be open to community feedback in this matter.

&nbsp;

---

## 3. Prerequisites

You need the following available on your system to use this CLI;

- **Node.js** version `16.13.0` or higher

- **npm** version `8.8.0` or higher

  **Important:** Currently version `8.5.5` ships the most recent LTS of Node.js. See the note below to address this.

### 3.2. Installing the required Node.js version

We highly recommend the use of [nvm](https://github.com/nvm-sh/nvm), which allows you to install and switch between multiple versions of Node.js seamlessly.

Once you have it installed you can install the latest version of the Node.js LTS via the following command;

```bash
nvm install --lts --default 16
```

This will install the latest LTS version of the major version 16 of Node.js, whilst also making it the default Node.js version that will be used on your machine.

### 3.1. Upgrading your npm to the required version

The most recent LTS of Node.js (version `16.15.0` at the time of writing) currently ships with npm version `8.5.5`. For us to support internal package references across your monorepo. We specifically depend on the [`--install-links`](https://docs.npmjs.com/cli/v8/commands/npm-install#install-links) flag which was introduced in npm version `8.8.0`.

You can get the required version running on your machine by upgrading it like so;

```bash
npm install -g npm@8
```

&nbsp;

---

## 4. Installation and Configuration

Run the following command at the root of your monorepo;

```bash
npm install monilla --save-dev
```

After the installation completes run the following command;

```bash
npx monilla init
```

This will create a `.monilla.json` configuration file (if it does not yet exists) and update your `.gitignore` configuration file (if it exists) with the necessary excludes.

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

> Note: I'm prefixing each of the `monilla` commands with `npx`. If you are unfamiliar with `npx` you can [read more about it here](https://docs.npmjs.com/cli/v8/commands/npx). tldr - It will allow you to quickly execute commands against the locally installed `monilla` CLI.

&nbsp;

### 5.1. Initialising your dependencies

If you are performing a fresh clone of a repository, or switching branched, then we recommend you run the following command;

```bash
npx monilla install
```

This performs two functions;

- Ensures that any linked packages are properly bound
- Ensures the correct dependencies are installed for each package

&nbsp;

### 5.2. Linking and Unlinking packages

The example monorepo contains a mobile app, and a components library. If we wished to utilise the components library within the mobile app we can link the package.

You can do so by running the `link` command within the root of your monorepo;

```bash
npx monilla link @my/components --to @my/mobile-app
```

> Note: if the source package has a `build` script it will be executed prior to performing the link.

Conversely, if you'd like to `unlink` a package you can do the following;

```bash
npx monilla unlink @my/components --from @my/mobile-app
```

> **Note:** Monilla does not support circular dependencies between packages and will throw an error or warning if you try to create one.

&nbsp;

### 5.3. Making updates to your linked packages

If you've performed updates to one of your linked packages, you can ensure that all dependants are using the latest version via the following command;

```bash
npx monilla refresh
```

> Note: if your linked package has a `build` script it will be executed prior to performing the refresh.

&nbsp;

### 5.4. Watching updates to your linked packages

To watch for changes to your packages, resulting in automatic building and refreshing of the packages, execute the following command;

```bash
npx monilla watch
```

> **Note:** We utilise your `.gitignore` file to determine which files to ignore when executing this process.

&nbsp;

### 5.5. Performing an interactive update of dependencies across all packages

To perform an interactive update of the dependencies for all of the packages within your monorepo execute the following command;

```bash
npx monilla interactive-update
```

You'll be asked which packages you'd like to update for each of the packages within your monorepo. After this has completed we'll take care of the installs and refreshing of your linked packages.

&nbsp;

---

## 6. CLI Reference

You can get help by running the following command;

```bash
npx monilla --help
```

&nbsp;

---

## 7. Appreciation

Huge love and thanks goes to [@wclr](https://github.com/wclr) for the outstanding work on [Yalc](https://github.com/wclr/yalc). The Yalc workflow is the specific seed that was required to make the idea for this tool grow. We've also taken direct code and inspiration from the Yalc source, albeit modified to suit our specific use case.

Another shoutout of hugs goes to [@raineorshine](https://github.com/raineorshine) for the amazing work on [`npm-check-update`](https://github.com/raineorshine/npm-check-updates). Updating dependencies would be too laborious without this amazing tool. We couldn't have done it better ourselves so we lean directly into this tool.

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
