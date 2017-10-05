
'use strict'

const {promisify, inspect} = require('util')
const {exec: _exec} = require('child_process')
const {join} = require('path')
const _rimraf = require('rimraf')
const logger = require('./logger')

const exec = promisify(_exec)
const rimraf = promisify(_rimraf)

const _run = (log, opts) => async command => {
  try {
    const {stdout, stderr} = await exec(command, opts)
    log.trace(`${command}: ${inspect(stdout)} ${inspect(stderr)}`)
    return stdout
  } catch (err) {
    log.warn(`${command} failed: ${err.message}`)
    throw err
  }
}

const _rmrf = log => async path => {
  try {
    log.trace(`rm -Rf ${join(path, 'node_modules')}`)
    await rimraf(join(path, 'node_modules'))
  } catch (err) {
    log.warn(`rm -Rf failed: ${err.message}`)
    throw err
  }
}

module.exports = async repository => {

  const log = logger.child({repository: repository.name})
  const run = _run(log, {cwd: repository.path})
  const rmrf = _rmrf(log)

  log.debug(`starting work on ${repository.name} in ${repository.path}`)

  await run('git fetch')

  // check if local branch exists, if not check it out first
  const localBranch = await run(`git branch --list ${repository.upstream}`)
  const localBranchExists = localBranch !== ''
  if (!localBranchExists) {
      await run(`git checkout -b ${repository.upstream} ${repository.remote}/${repository.upstream}`)
  }

  // pull out some information about the upstream compared to local branches
  // also make sure we pick up if there are changes to package-json here
  const revlist = await run(`git rev-list ${repository.remote}/${repository.upstream}...${repository.upstream}`)
  const packageJsonRevlist = await run(`git rev-list ${repository.remote}/${repository.upstream}...${repository.upstream} -- package.json`)

  // if current branch isn't upstream tracking branch, try to checkout that branch.
  // this might fail due to changes in the worktree (let the user know and abort)
  // this outputs one of the `info` messages shown by default (switched branch or not; updated or already up-to-date)

  try {
    const branch = await run('git rev-parse --abbrev-ref HEAD')

    const action = branch.trim() !== repository.upstream ? 'updated to' : 'already on'
    const result = revlist === '' ? 'already up-to-date' : 'updating HEAD'

    if (branch.trim() !== repository.upstream) {
      await run(`git checkout ${repository.upstream}`)
    }

    log.info(`${action} ${repository.upstream}; ${result}`)

    // if revlist changes between remote and ours, don't do anything.
    if (revlist === '') { return }

  }
  catch (err) {
    log.error(`could not checkout ${repository.upstream}. is your worktree dirty?`)
    return
  }

  // pull the upstream tracking branch. there shouldn't be commits here so we use `--ff-only`
  // if this fails, the user probably fucked something up so just let them know and abort

  log.debug('Attempting to pull')
  try {
    await run('git pull --ff-only')
  }
  catch (err) {
    log.error('could not pull. is your worktree clean? do you have commits?')
    return
  }

  // we've updated to the HEAD pointer and we know there were package.json changes
  // blow away node_modules and re-install. also setup any links we have configured.

  if (packageJsonRevlist !== '') {
    log.info('deleting node_modules and running npm install')

    await rmrf(repository.path)
    await run('npm install')

    if (repository.links.length > 0) {
      log.info(`setting up links, ${repository.links.join(' ')}`)
      await Promise.all(repository.links.map(async link => {
        await run(`npm link ${link}`)
      }))
    }
  }

}
