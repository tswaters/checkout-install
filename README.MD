
[![NPM Version][npm-image]][npm-url]
[![Dependencies][dep-image]][dep-url]
[![devDependencies][devdep-image]][devdep-url]
[![Coverage Status][coverage-image]][coverage-url]
[![Build Status][build-image]][build-url]

# checkout-install

CLI utility to pull upstream changes and run `npm install` / `npm link` if changes to to `package.json`

## Usage

```checks out a branch, reinstalls node_modules and sets up provided links

usage: checkout-install [options]

Options:
  --version, -v   Show version number                                  [boolean]
  --help          Show help                                            [boolean]
  -c, --config    Path to JSON config file                              [string]
  -n, --name      Name to use in logging                                [string]
  -u, --upstream  Upstream branch to pull                    [default: "master"]
  -r, --remote    Remote to pull from                        [default: "origin"]
  --post-install  Run a script after all operations finish              [string]
  -l, --links     links to setup after install             [array] [default: []]
  --log-level     Logging level to use
         [choices: "trace", "debug", "info", "warn", "error", "fatal", "silent"]
                                                               [default: "info"]

Note that you can provide options in the `checkout-install` key in package.json
```

You can pass all configuration options through a JSON file via `--config`

You can also provide a `checkout-install` key inside `package.json`

### Multiple Repositories

If using a config file or package.json config, you can pass multiple repositories via the `repositories` key. Each repository supports the same set of configuration options in addition to a `path` key used to point at the target directory.

**Example**

```
{
  "repositories": [
    {
      "upstream": "development",
      "path": "../repo-1",
      "links": ["module-1", "module-2"]
    },
    {
      "upstream": "development",
      "remote": "upstream",
      "path": "../repo-2"
    },
    {
      "upstream": "development",
      "path": "../repo-3",
      "links": ["module-1", "module-2"]
    }
  ]
}
```

[npm-image]: https://badge.fury.io/js/checkout-install.svg
[npm-url]: https://badge.fury.io/js/checkout-install

[dep-image]: https://david-dm.org/tswaters/checkout-install/status.svg
[dep-url]: https://david-dm.org/tswaters/checkout-install

[devdep-image]: https://david-dm.org/tswaters/checkout-install/dev-status.svg
[devdep-url]: https://david-dm.org/tswaters/checkout-install?type=dev

[coverage-image]: https://coveralls.io/repos/github/tswaters/checkout-install/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/tswaters/checkout-install?branch=master

[build-image]: https://travis-ci.org/tswaters/checkout-install.svg?branch=master
[build-url]: https://travis-ci.org/tswaters/checkout-install
