> **Work in Progress**
>
> None of the below actually exists. I'm just riffing on some ideas. All subject to change, or to never come into existence.

# Monilla

Manage your monorepo dependencies in a vanilla-esque manner.

- [Introduction](#introduction)
- [Trade Offs and Limitations](#trade-offs-and-limitations)
- [Installation](#installation)
- [Guide](#guide)
  - [Initialising your dependencies](#initialising-your-dependencies)
  - [Linking and Unlinking packages](#linking-and-unlinking-packages)
  - [Making updates to your linked packages](#making-updates-to-your-linked-packages)
  - [Watching updates to your linked packages](#watching-updates-to-your-linked-packages)
  - [Performing an interactive update of dependencies across all packages](#performing-an-interactive-update-of-dependencies-across-all-packages)
- [CLI Reference](#cli-reference)
- [Appreciation](#appreciation)
- [Further Reading / References](#further-reading--references)

## Introduction

This is a CLI tool to support package dependencies and cross package references within a monorepo.

It does this **without** the use of hoisting.

We've faced too many frustrating bugs related to hoisting that required delicate configuration magic in order to move forward. We honestly can't deal with that anymore. We want an experience where each package feels as stable as if I had performed a simple `npm install` against each of them.

This tool enables this "vanilla" approach, hiding away the tedious process were you to perform the required tasks manually. Each package owns its own dependencies, with a standard `npm install` being executed against them. Cross package dependencies are enabled by wrapping up commands to the amazing [Yalc CLI](https://github.com/wclr/yalc). Yalc enables local package references in a manner which closely resembles the experience of pulling down a package directly from the npm registry.

We strongly feel this is the way back to sanity for me in terms of monorepo development. You might too.

> React Native developers. We're looking at you.

## Trade Offs and Limitations

- **Disk space**

  Yeah, you'll use more of it with our approach, comparing it to the hoisting or symlinking strategies . Honestly, we are happy to sacrifice a few megabytes in exchange for sanity. Your call.

- **Workspace features**

  npm/Yarn workspaces provide a lot of additional features, such as command delegation into specific packages within a monorepo. We intentionally are not trying to support all these features/cases.

- **Publishing**

  This tool is currently designed with private packages in mind. We haven't considered workflows for packages that require to be published to a registry.

- **Only supports `npm`**

  We specifically want to keep this tool as vanilla/boring as it can be. Whilst there are valid concerns about npm, it is still by far the most utilised tool for managing package dependencies. Most packages will be inherently optimised to work with it.

## Installation

Run the following command at the root of your monorepo;

```bash
npm install monilla --save-dev
```

After the installation completes, run the following command;

```bash
npx monilla init
```

This will create a `.monilla.json` configuration file (if it does not yet exists) and update your `.gitignore` configuration file (if it exists) with the necessary excludes.

## Guide

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

### Initialising your dependencies

If you are performing a fresh clone of a repository, or switching branched, then we recommend you run the following command;

```bash
npx monilla install
```

This performs two functions;

- Ensures that any linked packages are properly bound
- Ensures the correct dependencies are installed for each package

### Linking and Unlinking packages

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

### Making updates to your linked packages

If you've performed updates to one of your linked packages, you can ensure that all dependants are using the latest version via the following command;

```bash
npx monilla refresh
```

> Note: if your linked package has a `build` script it will be executed prior to performing the refresh.

### Watching updates to your linked packages

To watch for changes to your packages, resulting in automatic building and refreshing of the packages, execute the following command;

```bash
npx monilla watch
```

> **Note:** We utilise your `.gitignore` file to determine which files to ignore when executing this process.

### Performing an interactive update of dependencies across all packages

To perform an interactive update of the dependencies for all of the packages within your monorepo execute the following command;

```bash
npx monilla interactive-update
```

You'll be asked which packages you'd like to update for each of the packages within your monorepo. After this has completed we'll take care of the installs and refreshing of your linked packages.

## CLI Reference

You can get help by running the following command;

```bash
npx monilla --help
```

## Appreciation

Huge love and thanks goes to [@wclr](https://github.com/wclr) for the outstanding work on [Yalc](https://github.com/wclr/yalc). The Yalc workflow is the specific seed that was required to make the idea for this tool grow. We've also taken direct code and inspiration from the Yalc source, albeit modified to suit our specific use case.

Another shoutout of hugs goes to [@raineorshine](https://github.com/raineorshine) for the amazing work on [`npm-check-update`](https://github.com/raineorshine/npm-check-updates). Updating dependencies would be too laborious without this amazing tool. We couldn't have done it better ourselves so we lean directly into this tool.

## Further Reading / References

- [monorepo.tools - Everything you need to know about monorepos, and the tools to build them.](https://monorepo.tools/)
- [An abbreviated history of JavaScript package managers](https://javascript.plainenglish.io/an-abbreviated-history-of-javascript-package-managers-f9797be7cf0e)
- [Exploring workspaces and other advanced package manager features](https://blog.logrocket.com/exploring-workspaces-other-advanced-package-manager-features/)
- [Inside the pain of monorepos and hoisting](https://www.jonathancreamer.com/inside-the-pain-of-monorepos-and-hoisting/)
- [The Hoisting Madness in Monorepos](https://enrq.me/dev/2020/04/04/hoisting-in-monorepos/)
- [Monorepos will ruin your life -- but they're worth it!](https://thenable.io/monorepos-will-ruin-your-life-but-theyre-worth-it)
- [nohoist in Workspaces](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/)
- [Tweet from Dan Abramov](https://twitter.com/dan_abramov/status/951931842273398784?lang=en)
