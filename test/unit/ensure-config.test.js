
const path = require('path')
const fs = require('fs')
const assert = require('assert')

const sinon = require('sinon')
const proxyquire = require('proxyquire')

let ensureConfig = null

describe('ensure-config', () => {

  let accessStub = null
  let resolveStub = null

  beforeEach(() => {
    sinon.stub(process, 'cwd').returns('here')
    accessStub = sinon.stub(fs, 'access').callThrough().withArgs('here').callsArg(1)
    resolveStub = sinon.stub(path, 'resolve').callThrough().withArgs('here').returnsArg(0)
    ensureConfig = proxyquire('../../lib/ensure-config', {path: {resolve: resolveStub}, fs: {access: accessStub}})
  })

  afterEach(() => {
    process.cwd.restore()
    fs.access.restore()
    path.resolve.restore()
  })

  describe('good data', () => {

    it('should use sane defaults', async () => {

      const config = {}

      await ensureConfig(config)

      assert.deepEqual(config, {
        name: 'here',
        path: 'here',
        remote: 'origin',
        upstream: 'master',
        links: []
      })

    })

    it('should do nothing with everything provided', async () => {

      const config = {
        repositories: [{
          name: 'some-name',
          path: 'here',
          upstream: 'some-upstream',
          remote: 'some-remote',
          links: ['some-module1', 'some-module2']
        }, {
          name: 'some-other-name',
          path: 'here',
          upstream: 'some-other-upstream',
          remote: 'some-other-remote',
          links: ['some-module1', 'some-module2']
        }]
      }

      await ensureConfig(config)

      assert.deepEqual({
        repositories: [{
          name: 'some-name',
          path: 'here',
          upstream: 'some-upstream',
          remote: 'some-remote',
          links: ['some-module1', 'some-module2']
        }, {
          name: 'some-other-name',
          path: 'here',
          upstream: 'some-other-upstream',
          remote: 'some-other-remote',
          links: ['some-module1', 'some-module2']
        }]
      }, config)

    })

  })

  describe('bad data', () => {

    it('should fail with bad paths', async () => {
      accessStub.callsArgWith(1, new Error())
      try { await ensureConfig({path: 'here'}); assert.ok(false) }
      catch (err) { assert.equal(err.message, 'config is malformed, can\'t access here')}
    })

    it('should fail with bad post-install', async () => {
      try { await ensureConfig({postInstall: {}}); assert.ok(false) }
      catch (err) { assert.equal(err.message, 'config is malformed, expected postInstall to be a string')}
    })

    it('should fail if repositories not an array', async () => {
      try { await ensureConfig({repositories: 'nope'}); assert.ok(false) }
      catch (err) { assert.equal(err.message, 'config is malformed, expected repositories to be array') }
    })

    it('should fail if upstream not string', async () => {
      try { await ensureConfig({repositories: [{upstream: {}}]}); assert.ok(false) }
      catch (err) { assert.equal(err.message, 'config is malformed, expected repository[0].upstream to be string') }
    })

    it('should fail if upstream not string', async () => {
      try { await ensureConfig({repositories: [{remote: {}}]}); assert.ok(false) }
      catch (err) { assert.equal(err.message, 'config is malformed, expected repository[0].remote to be string') }
    })

    it('should fail if links not an array', async () => {
      try { await ensureConfig({links: 'nope'}); assert.ok(false) }
      catch (err) { assert.equal(err.message, 'config is malformed, expected links to be array') }
    })

    it('should fail if one of the links is not a string', async () => {
      try { await ensureConfig({links: [{}]}); assert.ok(false) }
      catch (err) { assert.equal(err.message, 'config is malformed, expected links[0] to be string') }
    })
  })

})
