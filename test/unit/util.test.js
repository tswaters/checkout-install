
'use strict'

const sinon = require('sinon')
const assert = require('assert')
const proxyquire = require('proxyquire')
const child_process = require('child_process')
const pino = require('pino')

describe('util', () => {

  describe('#run', () => {

    let execStub = null
    let util = null
    let run = null
    const loggerStub = pino({level: 'silent'})

    beforeEach(() => {
      execStub = sinon.stub(child_process, 'exec').callsArgWith(2, null, {stdout: ''})
      util = proxyquire('../../lib/util', {
        child_process: {exec: execStub}
      })
      run = util.run(loggerStub)
    })

    afterEach(() => {
      child_process.exec.restore()
    })

    it('should catch errors', async () => {
      execStub.callsArgWith(2, new Error('aw snap'))
      try { await run('some command'); assert.ok(false)}
      catch (err) { assert.equal(err.message, 'aw snap')}
    })

    it('should resolve stdout', async () => {
      execStub.callsArgWith(2, null, {stdout: 'response'})
      const result = await run('some command')
      assert.equal(result, 'response')
    })

  })

})
