#!/usr/bin/env node

const util = require('util')
const path = require('path')
const yargs = require('yargs')
const fs = require('fs')

const {default: logger} = require('../lib/logger')
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
    configParser (configPath) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
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

logger.debug(`started ${config.config ? `config path: ${path.resolve(config.config)}` : ''}`)

const installer = pullInstall(logger)

;(async () => {

  await ensureConfig(config)
  logger.trace(`Running with config: ${util.inspect(config)}`)

  if (config.repositories) {
    logger.setPadding(config.repositories.reduce((item, memo) => {
      return Math.max(memo, item.name.length)
    }, 0)) + 1
    await Promise.all(config.repositories.map(installer))
  } else {
    logger.setPadding(config.name.length + 1)
    await pullInstall(installer)
  }

})()
  .catch(err => logger.fatal(err))
