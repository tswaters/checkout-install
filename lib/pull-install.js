
'use strict'

const {promisify, inspect} = require('util')
const {exec: _exec} = require('child_process')
const {join} = require('path')
const _rimraf = require('rimraf')

const exec = promisify(_exec)
const rimraf = promisify(_rimraf)

const _run = (log, opts) => async command => {
  try {
    const {stdout, stderr} = await exec(command, opts)
    log.trace(`${command}: ${inspect(stdout)} ${inspect(stderr)}`)
    return stdout
  } catch (err) /* istanbul ignore next */ {
    log.warn(`${command} failed: ${err.message}`)
    throw err
  }
}

const _rmrf = log => async path => {
  try {
    log.trace(`rm -Rf ${join(path, 'node_modules')}`)
    await rimraf(join(path, 'node_modules'))
  } catch (err) /* istanbul ignore next */ {
    log.warn(`rm -Rf failed: ${err.message}`)
    throw err
  }
}

module.exports = logger => async repository => {

  const log = logger.child({repository: repository.name})
  const run = _run(log, {cwd: repository.path})
  const rmrf = _rmrf(log)

  let packageJsonRevlist = null

  log.debug(`starting work on ${repository.name} in ${repository.path}`)

  await run('git fetch')

  // figure out what current branch is.
  const branch = (await run('git rev-parse --abbrev-ref HEAD')).trim()

  // check if local branch exists,
  const localBranch = await run(`git branch --list ${repository.upstream}`)
  const localBranchMissing = localBranch === ''

  if (localBranchMissing) {

    packageJsonRevlist = await run(`git rev-list ${repository.remote}/${repository.upstream}...${branch} -- package.json`)

    await run(`git checkout -b ${repository.upstream} ${repository.remote}/${repository.upstream}`)

    log.info(`checked out ${repository.upstream}`)

  }
  else {

    // pull out some information about the upstream compared to local branches
    // also make sure we pick up if there are changes to package-json here

    const revlist = await run(`git rev-list ${repository.remote}/${repository.upstream}...${repository.upstream}`)
    packageJsonRevlist = await run(`git rev-list ${repository.remote}/${repository.upstream}...${repository.upstream} -- package.json`)

    // if current branch isn't upstream tracking branch, try to checkout that branch.
    // this might fail due to changes in the worktree (let the user know and abort)
    // this outputs one of the `info` messages shown by default (switched branch or not; updated or already up-to-date)

    const action = branch !== repository.upstream ? 'updated to' : 'already on'
    const result = revlist === '' ? 'already up-to-date' : 'updating HEAD'

    if (branch.trim() !== repository.upstream) {
      await run(`git checkout ${repository.upstream}`)
    }

    log.info(`${action} ${repository.upstream}; ${result}`)

    // if revlist hasn't changed between remote and ours, don't do anything.
    if (revlist === '') { return }

    log.debug('Attempting to pull')
    await run('git pull --ff-only')

  }

  // we've updated to the HEAD pointer and we know there were package.json changes
  // blow away node_modules and re-install. also setup any links we have configured.

  if (packageJsonRevlist !== '') {
    log.info('deleting node_modules and running npm install')

    await rmrf(repository.path)
    await run('npm install')

    log.info(`setting up links, ${repository.links.join(' ')}`)
    for (const link of repository.links) {
      await run(`npm link ${link}`)
    }
  }

}
