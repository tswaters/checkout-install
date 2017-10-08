
const path = require('path')
const assert = require('assert')
const child_process = require('child_process')
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
    rimrafStub = sinon.stub().callsArg(1)
    execStub = sinon.stub(child_process, 'exec').callsArgWith(2, null, {stdout: ''})
    pullInstall = proxyquire('../../lib/pull-install', {
      child_process: {exec: execStub},
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

  afterEach(() => {
    child_process.exec.restore()
  })

  it('with local branch missing, checks out and exists without packageJson changes', async () => {

    execStub.onCall(1).callsArgWith(2, null, {stdout: 'some-rando-branch'}) // current branch
    execStub.onCall(2).callsArgWith(2, null, {stdout: ''}) // can't find master
    execStub.onCall(3).callsArgWith(2, null, {stdout: ''}) // no changes to packageJson

    await pullInstall(config)

    assert.equal(execStub.args[0][0], 'git fetch')
    assert.equal(execStub.args[1][0], 'git rev-parse --abbrev-ref HEAD')
    assert.equal(execStub.args[2][0], 'git branch --list master')
    assert.equal(execStub.args[3][0], 'git rev-list origin/master...some-rando-branch -- package.json')
    assert.equal(execStub.args[4][0], 'git checkout -b master origin/master')
    assert.equal(rimrafStub.callCount, 0)

  })

  it('with local branch missing, checks out and installs with packageJson changes', async () => {

    execStub.onCall(1).callsArgWith(2, null, {stdout: 'some-rando-branch'}) // current branch
    execStub.onCall(2).callsArgWith(2, null, {stdout: ''}) // can't find master
    execStub.onCall(3).callsArgWith(2, null, {stdout: 'some-commit!'}) // package-json changes found

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

    execStub.onCall(1).callsArgWith(2, null, {stdout: 'master'}) // current branch
    execStub.onCall(2).callsArgWith(2, null, {stdout: 'master'}) // master found
    execStub.onCall(3).callsArgWith(2, null, {stdout: ''}) // changes to tree not found
    execStub.onCall(4).callsArgWith(2, null, {stdout: ''}) // changes to package not found

    await pullInstall(config)

    assert.equal(execStub.args[0][0], 'git fetch')
    assert.equal(execStub.args[1][0], 'git rev-parse --abbrev-ref HEAD')
    assert.equal(execStub.args[2][0], 'git branch --list master')
    assert.equal(execStub.args[3][0], 'git rev-list origin/master...master')
    assert.equal(execStub.args[4][0], 'git rev-list origin/master...master -- package.json')
    assert.equal(rimrafStub.callCount, 0)

  })

  it('with branch checked out, not up-to-date but no package.json changes', async () => {
    execStub.onCall(1).callsArgWith(2, null, {stdout: 'master'}) // current branch
    execStub.onCall(2).callsArgWith(2, null, {stdout: 'master'}) // master found
    execStub.onCall(3).callsArgWith(2, null, {stdout: 'some-commit!'}) // changes to tree not found
    execStub.onCall(4).callsArgWith(2, null, {stdout: ''}) // changes to package not found

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
    execStub.onCall(1).callsArgWith(2, null, {stdout: 'master'}) // current branch
    execStub.onCall(2).callsArgWith(2, null, {stdout: 'master'}) // master found
    execStub.onCall(3).callsArgWith(2, null, {stdout: 'some-commit!'}) // changes to tree not found
    execStub.onCall(4).callsArgWith(2, null, {stdout: 'some-commit!'}) // changes to package not found

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
    execStub.onCall(1).callsArgWith(2, null, {stdout: 'some-rando-branch'}) // current branch
    execStub.onCall(2).callsArgWith(2, null, {stdout: 'master'}) // master found
    execStub.onCall(3).callsArgWith(2, null, {stdout: 'some-commit!'}) // changes to tree not found
    execStub.onCall(4).callsArgWith(2, null, {stdout: 'some-commit!'}) // changes to package not found

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
