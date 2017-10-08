
const pino = require('pino')
const chalk = require('chalk')

const ctx = new chalk.constructor()

const levels = {
  default: 'USERLVL',
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN',
  30: 'INFO',
  20: 'DEBUG',
  10: 'TRACE'
}

const levelColors = {
  default: ctx.white,
  60: ctx.bgRed,
  50: ctx.red,
  40: ctx.yellow,
  30: ctx.green,
  20: ctx.blue,
  10: ctx.grey
}

let namePadding = 0

const transform = pino.pretty({
  formatter: value => {
    const level = levelColors[value.level](levels[value.level].padEnd(7))
    const repo = value.repository ? ctx.yellow(value.repository.padEnd(namePadding)) : ''
    const msg = value.msg ? ctx.cyan(value.msg) : ''
    const stack = value.type === 'Error' ? `\n${value.stack}` : ''
    return `${level}${repo}${msg}${stack}`
  }
})

transform.pipe(process.stdout)

exports.default = pino({}, transform)

exports.setPadding = padding => namePadding = padding
