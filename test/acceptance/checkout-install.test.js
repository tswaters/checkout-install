
const assert = require('assert')
const {promisify} = require('util')
const {join} = require('path')
const {exec: _exec} = require('child_process')
const {copy, writeFile, readJson, mkdirp, remove} = require('fs-extra')

const exec = promisify(_exec)

const fixtures = join(__dirname, '..', 'fixtures')
const workdir = join(__dirname, '..', 'workdir')
const dev_dir = join(workdir, 'develop')

describe('checkout install acceptance', () => {

  const repos = [
    'repo-1',
    'repo-2',
    'repo-3'
  ]

  const deps = [
    'dep-1',
    'dep-2'
  ]

  beforeEach(async () => {
    await remove(dev_dir)
    await Promise.all(repos.reduce((memo, repo) => {
      memo.push(remove(join(workdir, `${repo}_repo`)))
      memo.push(remove(join(workdir, `${repo}_upstream`)))
      memo.push(remove(join(workdir, `${repo}_bare`)))
      return memo
    }, []))
    await Promise.all(deps.map(async dep => remove(join(workdir, dep))))

    // set up a series of npm dependencies
    await Promise.all(deps.map(async dep => {
      const dep_dir = join(workdir, dep)
      await mkdirp(dep_dir)
      await copy(join(fixtures, `${dep}-package.json`), join(dep_dir, 'package.json'))
    }))

  })

  it('should function properly', async function () {

    this.slow(20000)

    // create a series of project repositories and related bare/upstream repo
    await Promise.all(repos.map(async (name) => setup_repo(name)))

    // install all the dependencies as upstream changes
    await Promise.all(repos.map(async (name) => upstream_change(name, async dir => {
      await copy(join(fixtures, `${name}-package.json`), join(dir, 'package.json'))
      await writeFile(join(dir, '.gitignore'), 'node_modules')
    })))

    // create a develop directory referencing first two projects, run checkout-install there

    await mkdirp(dev_dir)
    await copy(join(fixtures, 'develop-package.json'), join(dev_dir, 'package.json'))
    await exec(`node ${join(__dirname, '../../bin/checkout-install')}`, {cwd: dev_dir})

    // assert that all the repos received their upstream changes and have relevant node_modules
    await Promise.all(repos.map(async repo => {
      const dir = join(workdir, `${repo}_repo`)
      const package = await readJson(join(dir, 'package.json'))
      assert.equal(Object.keys(package.dependencies).length, deps.length)
    }))

  })

  it('config via default config file', async function () {
    this.slow(10000)
    await setup_repo('repo-1')
    const repo1_dir = join(workdir, 'repo-1_repo')
    await upstream_change('repo-1', async dir => {
      await copy(join(fixtures, 'repo-1-package.json'), join(dir, 'package.json'))
      await writeFile(join(dir, '.gitignore'), 'node_modules')
    })

    await copy(join(fixtures, '.checkoutinstallrc'), join(repo1_dir, '.checkoutinstallrc'))
    await exec(`node ${join(__dirname, '../../bin/checkout-install')}`, {cwd: repo1_dir})
    const package = await readJson(join(repo1_dir, 'package.json'))
    assert.equal(Object.keys(package.dependencies).length, deps.length)
  })

  it('config non-default with mis-placed config file', async function () {
    this.slow(10000)
    await setup_repo('repo-1')
    const repo1_dir = join(workdir, 'repo-1_repo')
    await upstream_change('repo-1', async dir => {
      await copy(join(fixtures, 'repo-1-package.json'), join(dir, 'package.json'))
      await writeFile(join(dir, '.gitignore'), 'node_modules')
    })

    try {
      await exec(`node ${join(__dirname, '../../bin/checkout-install -c .checkoutinstallrc-missing')}`, {cwd: repo1_dir})
      assert.ok(false, 'should not hit')
    } catch (err) {
      assert.equal(err.code, 1)
      /* i have no desire to parse stdout */
    }
  })
})

async function setup_repo (name) {
  const bare_dir = join(workdir, `${name}_bare`)
  const repo_dir = join(workdir, `${name}_repo`)
  const upstream_dir = join(workdir, `${name}_upstream`)

  await mkdirp(bare_dir)
  await exec('git init --bare', {cwd: bare_dir})

  await mkdirp(upstream_dir)
  await exec('git init', {cwd: upstream_dir})
  await exec(`git remote add origin file://${bare_dir}`, {cwd: upstream_dir})
  await copy(join(fixtures, `${name}-package-before.json`), join(upstream_dir, 'package.json'))
  await exec('git add .', {cwd: upstream_dir})
  await exec('git commit -m "initial"', {cwd: upstream_dir})
  await exec('git push -u origin master', {cwd: upstream_dir})

  await mkdirp(repo_dir)
  await exec('git init', {cwd: repo_dir})
  await exec(`git remote add origin file://${bare_dir}`, {cwd: repo_dir})
  await exec('git fetch', {cwd: repo_dir})
  await exec('git checkout -b master origin/master', {cwd: repo_dir})

}

async function upstream_change (name, changer) {
  const upstream_dir = join(workdir, `${name}_upstream`)
  await changer(upstream_dir)
  await exec('git add .', {cwd: upstream_dir})
  await exec('git commit -m "upstream change"', {cwd: upstream_dir})
  await exec('git push -u origin master', {cwd: upstream_dir})
}
