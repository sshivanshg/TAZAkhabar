const mockAdd = jest.fn(async () => undefined)
const mockRemove = jest.fn(async () => undefined)
const mockToast = jest.fn()
const mockHaptic = jest.fn()

jest.mock('../src/storage/bookmarks', () => ({
  articleToBookmark: (a: { id?: number }) => (a.id == null ? null : { id: a.id }),
  addBookmark: (...args: unknown[]) => mockAdd(...(args as [])),
  removeBookmark: (...args: unknown[]) => mockRemove(...(args as [])),
}))
jest.mock('../src/components/ui/Toast', () => ({ showToast: (o: unknown) => mockToast(o) }))
jest.mock('../src/lib/haptics', () => ({ hapticLight: () => mockHaptic() }))

import { toggleBookmarkAction } from '../src/lib/toggleBookmark'

describe('toggleBookmarkAction', () => {
  beforeEach(() => jest.clearAllMocks())

  it('optimistically saves, haptics, and toasts once', async () => {
    const setSaved = jest.fn()
    await expect(
      toggleBookmarkAction({ article: { id: 1 } as never, currentlySaved: false, setSaved }),
    ).resolves.toBe('saved')
    expect(setSaved).toHaveBeenNthCalledWith(1, 1, true)
    expect(mockHaptic).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledTimes(1)
  })

  it('rolls back and reports failures instead of swallowing them', async () => {
    mockAdd.mockRejectedValueOnce(new Error('disk'))
    const setSaved = jest.fn()
    await expect(
      toggleBookmarkAction({ article: { id: 2 } as never, currentlySaved: false, setSaved }),
    ).resolves.toBe('failed')
    expect(setSaved).toHaveBeenLastCalledWith(2, false)
    expect(mockToast).toHaveBeenCalledTimes(1)
  })

  it('ignores a second tap while the first is in flight for the same id', async () => {
    let release: () => void = () => {}
    mockAdd.mockImplementationOnce(() => new Promise<undefined>((r) => (release = () => r(undefined))))
    const setSaved = jest.fn()
    const first = toggleBookmarkAction({ article: { id: 3 } as never, currentlySaved: false, setSaved })
    await expect(
      toggleBookmarkAction({ article: { id: 3 } as never, currentlySaved: true, setSaved }),
    ).resolves.toBe('busy')
    release()
    await expect(first).resolves.toBe('saved')
    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('removes with an undo toast', async () => {
    const setSaved = jest.fn()
    await expect(
      toggleBookmarkAction({ article: { id: 4 } as never, currentlySaved: true, setSaved }),
    ).resolves.toBe('removed')
    const opts = mockToast.mock.calls[0][0] as { onAction: () => void }
    opts.onAction()
    expect(setSaved).toHaveBeenLastCalledWith(4, true)
    expect(mockAdd).toHaveBeenCalled()
  })
})

describe('undo goes through the in-flight guard', () => {
  it('ignores undo while a write for the same id is in flight', async () => {
    const setSaved = jest.fn()
    await toggleBookmarkAction({ article: { id: 9 } as never, currentlySaved: true, setSaved })
    const undo = (mockToast.mock.calls.at(-1)![0] as { onAction: () => void }).onAction
    let release: () => void = () => {}
    mockAdd.mockClear()
    mockAdd.mockImplementationOnce(() => new Promise<undefined>((r) => (release = () => r(undefined))))
    undo()
    undo()
    expect(mockAdd).toHaveBeenCalledTimes(1)
    release()
  })
})
