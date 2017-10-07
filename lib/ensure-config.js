/**
 * Ensures config includes what we needs, populated some defaults
 * @file ensure-config.js
 */

'use strict'

const {ok: assert} = require('assert')
const {promisify} = require('util')
const path = require('path')
const {access: _access} = require('fs')
const access = promisify(_access)

/**
 * Loads a config file and verifies it matches required schema
 * @param {string} configPath path to parse
 * @throws error if not found or has invalid config
 */
module.exports = async config => {
  try {
    if (config.repositories) {
      assert(Array.isArray(config.repositories), 'expected repositories to be array')
      await Promise.all(config.repositories.map(ensureOne))
    }
    else {
      await ensureOne(config)
    }
  }
  catch (err) {
    throw new Error(`config is malformed, ${err.message}`)
  }
}

async function ensureOne (repository, index) {
  const key = index != null ? `repository[${index}].` : ''
  if (!repository.path) {
    repository.path = process.cwd()
  } else {
    repository.path = path.resolve(repository.path)
  }

  if (!repository.name) {
    repository.name = path.basename(repository.path)
  }

  if (!repository.upstream) {
    repository.upstream = 'master'
  }

  if (!repository.remote) {
    repository.remote = 'origin'
  }

  if (!repository.links) {
    repository.links = []
  }

  assert(typeof repository.upstream === 'string', `expected ${key}upstream to be string`)
  assert(typeof repository.remote === 'string', `expected ${key}remote to be string`)
  assert(Array.isArray(repository.links), `expected ${key}links to be array`)

  repository.links.forEach((link, index) => assert(typeof link === 'string', `expected ${key}links[${index}] to be string`))

  try { await access(repository.path) }
  catch (err) { assert(false, `can't access ${repository.path}`) }

}
