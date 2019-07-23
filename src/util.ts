import { logger } from './logger'

export const delay = (timeout: number = 0) =>
  new Promise<void>(resolve => setTimeout(resolve, timeout))

export const batch = async <T>(
  promises: Promise<T>[],
  chunk = 100,
  timeout = 5000,
  results: T[] = [],
) => {
  if (promises.length <= chunk) {
    results.push(...(await Promise.all(promises)))
    return results
  }

  results.push(...(await Promise.all(promises.slice(0, chunk))))

  // wait for a while due to API limitation
  await delay(timeout)

  await batch(promises.slice(chunk), chunk, timeout, results)

  return results
}

export type FunctionArgs<T extends Function> = T extends (
  ...args: infer R
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
any
  ? R
  : never

export const catcher = async <T extends Function>(
  fetcher: T,
  ...args: FunctionArgs<T>
) => {
  try {
    await fetcher(...args)
  } catch (e) {
    logger.error(e)
  }
}
