> **Work in Progress**
>
> None of the below actually exists. I'm just riffing on some ideas. All subject to change, or to never come into existence in the first place.

# yalcd

Manage your monorepo dependencies.

- [Introduction](#introduction)
- [Shortcomings & Limitations](#shortcomings--limitations)
- [Installation](#installation)
- [Guide](#guide)
  - [Initialising your dependencies](#initialising-your-dependencies)
  - [Linking and Unlinking packages](#linking-and-unlinking-packages)
  - [Making updates to your linked packages](#making-updates-to-your-linked-packages)
  - [Watching updates to your linked packages](#watching-updates-to-your-linked-packages)
  - [Performing an interactive update of dependencies across all packages](#performing-an-interactive-update-of-dependencies-across-all-packages)
- [CLI Reference](#cli-reference)
- [Appreciation](#appreciation)

## Introduction

This is a CLI tool to support dependency management within a monorepo.

It does this **without** the use of hoisting.

I've faced too many frustrating bugs requiring delicate configuration magic in order to move forward. I honestly can't deal with that anymore. I want an experience where each package feels as stable as if I had performed simple `npm install` against each of them.

This tool enables this "vanilla" approach, hiding away the tedious process were you to perform this manually. Each package owns its own dependencies, with a standard `npm install` being executed against them. Cross package dependencies are enabled by wrapping up commands to the amazing [Yalc CLI](https://github.com/wclr/yalc). Yalc enables package references in a manner which closely resembles the experience of pulling down a package directly from the npm registry.

I strongly feel this is the way back to sanity for me in terms of monorepo development. You might too.

> React Native developers. I'm looking at you.

## Shortcomings & Limitations

Comparing this approach to the workspaces approaches utilised by npm or Yarn, there are a few trade offs being made;

- disk space

  Yeah, you'll use more of it with our approach. Honestly, I'm happy to sacrifice a few megabytes in exchange for my sanity. Your call.

- features

  npm/Yarn workspaces provide a lot of additional features, such as command delegation into specific packages within a repo. Some other features such as the interactive upgrade of Yarn is more efficient than our approach, but again I prefer to be more explicit and take a bit longer when performing dependency updates.

## Installation

Run the following command at the root of your monorepo;

```bash
npm install yalcd --save-dev
```

After the installation completes, run the following command;

```bash
npx yalcd init
```

This will update your `.gitignore` configuration.

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

> Note: I'm prefixing each of the yalcd commands with npx. If you are unfamiliar with npx you can [read more about it here](https://docs.npmjs.com/cli/v8/commands/npx). tldr - It will allow you to quickly execute commands against the locally installed yalcd CLI.

### Initialising your dependencies

If you are performing a fresh clone of a repository, or switching branched, then we recommend you run the following command;

```bash
npx yalcd install
```

This performs two functions;

- Ensures that any linked packages are properly bound
- Ensures the correct dependencies are installed for each package

### Linking and Unlinking packages

The example monorepo contains a mobile app, and a components library. If we wished to utilise the components library within the mobile app we can link the package.

You can do so by running the `link` command within the root of your monorepo;

```bash
npx yalcd link @my/components --to @my/mobile-app
```

Conversely, if you'd like to `unlink` a package you can do the following;

```bash
npx yalcd unlink @my/components --from @my/mobile-app
```

### Making updates to your linked packages

If you've performed updates to one of your linked packages, you can ensure that all dependants are using the latest version via the following command;

```bash
npx yalcd refresh
```

> Note: if your linked package has a build step you'll need to ensure this was performed prior to executing the above command. Alternatively, you can add a `yalcd.pre.refresh` script to the `package.json` of this linked package. This script should contain the required build command. We'll then take care of building your package prior to perform the refresh.
>
> For example;
>
> ```json
> {
>   "scripts": {
>     "build": "tsup",
>     "yalcd.pre.refresh": "tsup"
>   }
> }
> ```

### Watching updates to your linked packages

Under certain circumstance it might be helpful to utilise the `--watch` flag against the `refresh` command. This will start a watch process which will automatically perform a refresh when your linked packages are updated.

```bash
npx yalcd refresh --watch
```

### Performing an interactive update of dependencies across all packages

To perform an interactive update of the dependencies for all of the packages within your monorepo execute the following command;

```bash
npx yalcd interactive-update
```

You'll be asked which packages you'd like to update for each of the packages within your monorepo. After this has completed we'll take care of the installs and refreshing of your yalcd packages.

## CLI Reference

You can get help by running the following command;

```bash
npx yalcd --help
```

## Appreciation

Huge love and thanks goes to [@wclr](https://github.com/wclr) for his outstanding work on [Yalc](https://github.com/wclr/yalc). None of this would be possible without it.

Another shoutout of hugs goes to [@raineorshine](https://github.com/raineorshine) for her wonderful work on [`npm-check-update`](https://github.com/raineorshine/npm-check-updates). Updating dependencies would be too laborious without this amazing tool.
