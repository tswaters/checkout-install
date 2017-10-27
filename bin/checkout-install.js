#!/usr/bin/env node

const util = require('util')
const path = require('path')
const yargs = require('yargs')
const fs = require('fs')

const {setPadding, default: logger} = require('../lib/logger')
const ensureConfig = require('../lib/ensure-config')
const pullInstall = require('../lib/pull-install')

const config = yargs
  .usage(`
checks out a branch, reinstalls node_modules and sets up provided links

usage: checkout-install [options]`)
  .alias('version', 'v')
  .help('help')

  .pkgConf('checkout-install')
  .epilogue('Note that you can provide options in the `checkout-install` key in package.json')

  .option('c', {
    alias: 'config',
    config: true,
    default: '.checkoutinstallrc',
    configParser (configPath) {
      let result = null
      try {
        result = fs.readFileSync(configPath, 'utf-8')
      } catch (err) {
        if (err.code === 'ENOENT' && path.join(process.cwd(), '.checkoutinstallrc') === configPath) {
          return null // if default not found, don't do anything
        }
        throw err
      }
      return JSON.parse(result)
    },
    type: 'string'
  })
  .option('n', {
    alias: 'name',
    type: 'string',
    default: path.basename(process.cwd()),
    describe: 'Name to use in logging'
  })
  .option('u', {
    alias: 'upstream',
    default: 'master',
    describe: 'Upstream branch to pull'
  })
  .option('r', {
    alias: 'remote',
    default: 'origin',
    describe: 'Remote to pull from'
  })
  .option('l', {
    alias: 'links',
    default: [],
    type: 'array',
    describe: 'links to setup after install'
  })
  .option('log-level', {
    default: 'info',
    describe: 'Logging level to use',
    choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']
  })
  .argv

logger.level = config.logLevel

logger.debug(`started config path: ${path.resolve(config.config)}`)

const installer = pullInstall(logger)

;(async () => {

  await ensureConfig(config)
  logger.trace(`Running with config: ${util.inspect(config)}`)

  const repos = config.repositories ? config.repositories : [config]

  setPadding(repos.reduce((memo, item) => {
    return Math.max(memo, item.name.length)
  }, 0) + 1)

  for (const repo of repos) {
    await installer(repo)
  }

  process.exit(0)

})()
  .catch( /*istanbul ignore next*/ err => {
    logger.fatal(err)
    process.exit(1)
  })
