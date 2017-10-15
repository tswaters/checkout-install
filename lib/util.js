
const {promisify, inspect} = require('util')
const {exec: _exec} = require('child_process')

const exec = promisify(_exec)

exports.run = (log, opts) => async command => {
  try {
    const {stdout, stderr} = await exec(command, opts)
    log.trace(`${command}: ${inspect(stdout)} ${inspect(stderr)}`)
    return stdout
  } catch (err) {
    log.warn(`${command} failed: ${err.message}`)
    throw err
  }
}
