import { ApolloClientApi } from './apollo'

const api = new ApolloClientApi(process.env.GH_TOKEN!)

describe('ApolloClientApi', () => {
  it('should work', async () => {
    const { branches, errors } = await api.getBranches()
    expect(errors).toBeFalsy()
    expect(branches).toBeTruthy()
  })
})
