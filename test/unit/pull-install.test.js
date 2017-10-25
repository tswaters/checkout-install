
const path = require('path')
const assert = require('assert')
const pino = require('pino')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

let pullInstall = null

describe('pull-install', () => {

  let rimrafStub = null
  let execStub = null
  let config = null

  const loggerStub = pino({level: 'silent'})

  beforeEach(() => {
    execStub = sinon.stub()
    rimrafStub = sinon.stub().callsArg(1)
    pullInstall = proxyquire('../../lib/pull-install', {
      './util': {run: sinon.stub().returns(execStub)},
      rimraf: rimrafStub
    })(loggerStub)
    config = {
      name: 'dummy',
      upstream: 'master',
      remote: 'origin',
      path: 'here',
      links: ['module-1', 'module-2']
    }
  })

  it('with local branch missing, checks out and exists without packageJson changes', async () => {

    execStub.onCall(1).resolves('some-rando-branch') // current branch
    execStub.onCall(2).resolves('') // branch list includes upstream
    execStub.onCall(3).resolves('') // changes to packageJson

    await pullInstall(config)

    assert.equal(execStub.args[0][0], 'git fetch')
    assert.equal(execStub.args[1][0], 'git rev-parse --abbrev-ref HEAD')
    assert.equal(execStub.args[2][0], 'git branch --list master')
    assert.equal(execStub.args[3][0], 'git rev-list origin/master...some-rando-branch -- package.json')
    assert.equal(execStub.args[4][0], 'git checkout -b master origin/master')
    assert.equal(rimrafStub.callCount, 0)

  })

  it('with local branch missing, checks out and installs with packageJson changes', async () => {

    execStub.onCall(1).resolves('some-rando-branch') // current branch
    execStub.onCall(2).resolves('') // branch list includes upstream
    execStub.onCall(3).resolves('some-commit!') // changes to packageJson

    await pullInstall(config)

    assert.equal(execStub.args[0][0], 'git fetch')
    assert.equal(execStub.args[1][0], 'git rev-parse --abbrev-ref HEAD')
    assert.equal(execStub.args[2][0], 'git branch --list master')
    assert.equal(execStub.args[3][0], 'git rev-list origin/master...some-rando-branch -- package.json')
    assert.equal(execStub.args[4][0], 'git checkout -b master origin/master')
    assert.equal(rimrafStub.args[0][0], path.join('here', 'node_modules'))
    assert.equal(execStub.args[5][0], 'npm install')
    assert.equal(execStub.args[6][0], 'npm link module-1')
    assert.equal(execStub.args[7][0], 'npm link module-2')

  })

  it('with branch checked out and up-to-date, exits out', async () => {

    execStub.onCall(1).resolves('master') // current branch
    execStub.onCall(2).resolves('master') // branch list includes upstream
    execStub.onCall(3).resolves('') // changes to tree
    execStub.onCall(4).resolves('') // changes to packageJson

    await pullInstall(config)

    assert.equal(execStub.args[0][0], 'git fetch')
    assert.equal(execStub.args[1][0], 'git rev-parse --abbrev-ref HEAD')
    assert.equal(execStub.args[2][0], 'git branch --list master')
    assert.equal(execStub.args[3][0], 'git rev-list origin/master...master')
    assert.equal(execStub.args[4][0], 'git rev-list origin/master...master -- package.json')
    assert.equal(rimrafStub.callCount, 0)

  })

  it('with branch checked out, not up-to-date but no package.json changes', async () => {
    execStub.onCall(1).resolves('master') // current branch
    execStub.onCall(2).resolves('master') // branch list includes upstream
    execStub.onCall(3).resolves('some-commit!') // changes to tree
    execStub.onCall(4).resolves('') // changes to packageJson

    await pullInstall(config)

    assert.equal(execStub.args[0][0], 'git fetch')
    assert.equal(execStub.args[1][0], 'git rev-parse --abbrev-ref HEAD')
    assert.equal(execStub.args[2][0], 'git branch --list master')
    assert.equal(execStub.args[3][0], 'git rev-list origin/master...master')
    assert.equal(execStub.args[4][0], 'git rev-list origin/master...master -- package.json')
    assert.equal(execStub.args[5][0], 'git pull --ff-only')
    assert.equal(rimrafStub.callCount, 0)

  })

  it('with branch checked out, not up-to-date and package.json changes', async () => {
    execStub.onCall(1).resolves('master') // current branch
    execStub.onCall(2).resolves('master') // branch list includes upstream
    execStub.onCall(3).resolves('some-commit!') // changes to tree
    execStub.onCall(4).resolves('some-commit!') // changes to packageJson

    await pullInstall(config)

    assert.equal(execStub.args[0][0], 'git fetch')
    assert.equal(execStub.args[1][0], 'git rev-parse --abbrev-ref HEAD')
    assert.equal(execStub.args[2][0], 'git branch --list master')
    assert.equal(execStub.args[3][0], 'git rev-list origin/master...master')
    assert.equal(execStub.args[4][0], 'git rev-list origin/master...master -- package.json')
    assert.equal(execStub.args[5][0], 'git pull --ff-only')
    assert.equal(rimrafStub.args[0][0], path.join('here', 'node_modules'))
    assert.equal(execStub.args[6][0], 'npm install')
    assert.equal(execStub.args[7][0], 'npm link module-1')
    assert.equal(execStub.args[8][0], 'npm link module-2')

  })

  it('with branch not checked out, not up-to-date and package.json changes', async () => {
    execStub.onCall(1).resolves('some-rando-branch') // current branch
    execStub.onCall(2).resolves('master') // branch list includes upstream
    execStub.onCall(3).resolves('some-commit!') // changes to tree
    execStub.onCall(4).resolves('some-commit!') // changes to packageJson

    await pullInstall(config)

    assert.equal(execStub.args[0][0], 'git fetch')
    assert.equal(execStub.args[1][0], 'git rev-parse --abbrev-ref HEAD')
    assert.equal(execStub.args[2][0], 'git branch --list master')
    assert.equal(execStub.args[3][0], 'git rev-list origin/master...master')
    assert.equal(execStub.args[4][0], 'git rev-list origin/master...master -- package.json')
    assert.equal(execStub.args[5][0], 'git checkout master')
    assert.equal(execStub.args[6][0], 'git pull --ff-only')
    assert.equal(rimrafStub.args[0][0], path.join('here', 'node_modules'))
    assert.equal(execStub.args[7][0], 'npm install')
    assert.equal(execStub.args[8][0], 'npm link module-1')
    assert.equal(execStub.args[9][0], 'npm link module-2')

  })

})
