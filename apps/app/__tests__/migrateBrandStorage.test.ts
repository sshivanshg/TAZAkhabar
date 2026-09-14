jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}))

type StorageMock = {
  getItem: jest.Mock
  setItem: jest.Mock
  removeItem: jest.Mock
}

function loadModule() {
  let mod: typeof import('../src/storage/migrateBrandStorage') | undefined
  let storage: StorageMock | undefined
  jest.isolateModules(() => {
    storage = require('@react-native-async-storage/async-storage') as StorageMock
    mod = require('../src/storage/migrateBrandStorage')
  })
  return { mod: mod!, storage: storage! }
}

describe('migrateBrandStorage', () => {
  it('copies legacy tazakhabar keys into khabro keys once', async () => {
    const { mod, storage } = loadModule()
    const values = new Map<string, string>([
      ['tazakhabar.bookmarks.v1', '[{"id":1}]'],
      ['tazakhabar.personalizationId', 'legacy-id'],
    ])

    storage.getItem.mockImplementation(async (key: string) => values.get(key) ?? null)
    storage.setItem.mockImplementation(async (key: string, value: string) => {
      values.set(key, value)
    })
    storage.removeItem.mockImplementation(async (key: string) => {
      values.delete(key)
    })

    await mod.migrateBrandStorage()

    expect(values.get('khabro.bookmarks.v1')).toBe('[{"id":1}]')
    expect(values.get('khabro.personalizationId')).toBe('legacy-id')
    expect(values.has('tazakhabar.bookmarks.v1')).toBe(false)
    expect(values.get('khabro.storageMigrated.v1')).toBe('1')

    await mod.migrateBrandStorage()
    expect(storage.setItem.mock.calls.filter(([key]) => key === 'khabro.bookmarks.v1')).toHaveLength(1)
  })

  it('does not overwrite an existing khabro key', async () => {
    const { mod, storage } = loadModule()
    const values = new Map<string, string>([
      ['tazakhabar.bookmarks.v1', 'legacy'],
      ['khabro.bookmarks.v1', 'current'],
    ])

    storage.getItem.mockImplementation(async (key: string) => values.get(key) ?? null)
    storage.setItem.mockImplementation(async (key: string, value: string) => {
      values.set(key, value)
    })
    storage.removeItem.mockImplementation(async (key: string) => {
      values.delete(key)
    })

    await mod.migrateBrandStorage()

    expect(values.get('khabro.bookmarks.v1')).toBe('current')
  })
})
