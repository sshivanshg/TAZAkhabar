jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))

type StorageMock = { getItem: jest.Mock; setItem: jest.Mock }
type PersonalizationIdModule = typeof import('../src/storage/personalizationId')

// The module caches the id in memory — load it in an isolated registry per test.
function loadModule(): { mod: PersonalizationIdModule; storage: StorageMock } {
  let mod: PersonalizationIdModule | undefined
  let storage: StorageMock | undefined
  jest.isolateModules(() => {
    storage = require('@react-native-async-storage/async-storage') as StorageMock
    mod = require('../src/storage/personalizationId') as PersonalizationIdModule
  })
  return { mod: mod!, storage: storage! }
}

describe('personalizationId', () => {
  it('generates and persists an id on first use, then reuses it', async () => {
    const { mod, storage } = loadModule()
    storage.getItem.mockResolvedValue(null)

    const first = await mod.getPersonalizationId()
    expect(first.length).toBeGreaterThan(0)
    expect(storage.setItem).toHaveBeenCalledWith('tazakhabar.personalizationId', first)

    const second = await mod.getPersonalizationId()
    expect(second).toBe(first)
    expect(storage.setItem.mock.calls).toHaveLength(1)
  })

  it('returns the stored id when one exists', async () => {
    const { mod, storage } = loadModule()
    storage.getItem.mockResolvedValue('stored-id-123')

    expect(await mod.getPersonalizationId()).toBe('stored-id-123')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('still returns a stable in-memory id when storage fails', async () => {
    const { mod, storage } = loadModule()
    storage.getItem.mockRejectedValue(new Error('storage down'))

    const first = await mod.getPersonalizationId()
    expect(first.length).toBeGreaterThan(0)
    expect(await mod.getPersonalizationId()).toBe(first)
  })
})
