
'use strict'

const {run: _run} = require('./util')

module.exports = logger => async config => {

  if (!config.postInstall) { return }

  logger.info(`Running post install hook: ${config.postInstall}`)

  const run = _run(logger, {cwd: config.path})
  await run(config.postInstall)

}
