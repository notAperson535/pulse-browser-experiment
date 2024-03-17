import kleur from 'kleur'
import { Parser, type Result } from 'tap-parser'

const { blue, bold, green, grey, red, underline } = kleur

const SKIP_MARK = blue('⇥')
const SUCCESS_MARK = green('✓')
const FAILURE_MARK = red('✗')
const TODO_MARK = blue('␣')

const SKIP_COMMENTS = ['tests', 'pass', 'fail', 'skip'].map((c) => '# ' + c)

export function reporter(watch: boolean) {
  const parser = new Parser({ passes: true, flat: false }, (results) => {
    console.log('\n\n')

    console.log(`Total:\t${results.count}`)
    console.log(green(`Pass:\t${results.pass}`))
    console.log(red(`Fail:\t${results.fail}`))
    console.log(grey(`Skip:\t${results.skip}`))
    console.log(grey(`Todo:\t${results.todo}`))

    if (!watch) {
      process.exit(1)
    }
  })

  parser.on('comment', (comment: string) => {
    if (SKIP_COMMENTS.some((c) => comment.startsWith(c))) {
      return
    }

    console.log(`\n\n  ${bold(comment)}`)
  })

  parser.on('assert', (res: Result) => {
    if (res.skip) {
      return console.log(`    ${SKIP_MARK} ${grey(res.name)}`)
    }
    if (res.todo) {
      return console.log(`    ${TODO_MARK} ${grey(res.name)}`)
    }
    if (res.ok) {
      return console.log(`    ${SUCCESS_MARK} ${grey(res.name)}`)
    }

    console.log(`    ${FAILURE_MARK} ${underline(red(res.name))}`)
    for (const key in res.diag) {
      const value = res.diag[key]
      console.log(grey(`        ${key}: ${value}`))
    }
  })

  return parser
}
