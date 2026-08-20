import { beforeEach, describe, expect, it, vi } from 'vitest'

const appDataDirMock = vi.fn()
const joinMock = vi.fn()
const sepMock = vi.fn(() => '/')

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: appDataDirMock,
  join: joinMock,
  sep: sepMock,
}))

describe('path helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    appDataDirMock.mockReset()
    joinMock.mockReset()
    sepMock.mockReset()
    sepMock.mockReturnValue('/')
  })

  it('caches the app data directory and builds managed file paths', async () => {
    appDataDirMock.mockResolvedValue('/app/data')
    joinMock.mockImplementation((...parts: string[]) => Promise.resolve(parts.join('/')))

    const paths = await import('@/lib/paths')

    await expect(paths.appDataDirPath()).resolves.toBe('/app/data')
    await expect(paths.appDataDirPath()).resolves.toBe('/app/data')
    await expect(paths.filelistCachePath()).resolves.toBe('/app/data/filelist.json')
    await expect(paths.installedDbPath()).resolves.toBe('/app/data/installed.json')
    expect(appDataDirMock).toHaveBeenCalledTimes(1)
  })

  it('joins path segments synchronously without duplicate separators', async () => {
    const { joinSync } = await import('@/lib/paths')

    expect(joinSync('/addons/', '/Foo', 'bar.txt')).toBe('/addons/Foo/bar.txt')
    expect(joinSync('/addons', '', 'Foo/')).toBe('/addons/Foo/')
  })

  it('returns dirname and basename using the active platform separator', async () => {
    const { basename, dirname } = await import('@/lib/paths')

    expect(dirname('/addons/Foo/file.txt')).toBe('/addons/Foo')
    expect(dirname('/file.txt')).toBe('/')
    expect(dirname('file.txt')).toBe('.')
    expect(basename('/addons/Foo/file.txt')).toBe('file.txt')
  })

  it('normalizes safe zip entry paths and rejects traversal or absolute paths', async () => {
    const { safeRelative } = await import('@/lib/paths')

    expect(safeRelative('./Foo\\bar.txt')).toBe('Foo/bar.txt')
    expect(safeRelative('/Foo/bar.txt')).toBeNull()
    expect(safeRelative('../Foo/bar.txt')).toBeNull()
    expect(safeRelative('Foo/../bar.txt')).toBeNull()
  })
})
