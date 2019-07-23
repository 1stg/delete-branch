// #! /usr/bin/env node

import _program, { CommanderStatic } from 'commander'

import { logger, pkg } from './logger'
import { ApolloClientApi } from './apollo'
import { catcher } from './util'

export interface Options {
  debug?: boolean
  pattern: string
  token?: string
}

const program = _program as CommanderStatic & Options

program
  .version(pkg.version)
  .option('-d, --debug', 'output debugging logs')
  .option(
    '-t, --token [string]',
    'GitHub API token witch permission of deleting branches, if not specific fallback to `process.env.GH_TOKEN`',
  )
  .option(
    '-p, --pattern <string>',
    'branch name pattern(s) to be deleted, required',
    (val: string, patterns: string[] = []) => {
      if (val.includes(',')) {
        patterns.push(...val.split(/,\s*/))
      } else {
        patterns.push(val)
      }
      return patterns
    },
  )
  .parse(process.argv)

if (!program.pattern) {
  logger.error('argument pattern is required')
  program.outputHelp()
  process.exit(1)
}

if (program.debug) {
  logger._generalLogLevel = 'debug'
}

const token = program.token || process.env.GH_TOKEN

if (!token) {
  logger.error(
    'token, which is required, is not detected from argument, either environment',
  )
  program.outputHelp()
  process.exit(1)
}

const api = new ApolloClientApi(program.token || process.env.GH_TOKEN!)

const main = async () => {
  const branches = await api.getBranches(program.pattern)

  if (!branches) {
    return logger.warn('no repository found for current user')
  }

  if (!branches.length) {
    return logger.warn('no matched branch found')
  }

  await api.deleteBranches(branches)
}

catcher(main)
