import { ApolloClientApi } from './apollo'

const api = new ApolloClientApi(process.env.GH_TOKEN!)

jest.setTimeout(Math.pow(2, 31) - 1)

describe('ApolloClientApi', () => {
  it('should just work', async () => {
    const branches = await api.getBranches([
      'dependabot/**/*',
      'greenkeeper/**/*',
    ])
    expect(branches).toBeTruthy()

    expect(await api.deleteBranches(branches!)).toBeTruthy()
  })
})
