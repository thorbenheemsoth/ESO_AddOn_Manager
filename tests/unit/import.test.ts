import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FileListEntry, InstalledAddon } from '@/lib/types'

const readDirMock = vi.fn()
const loadInstalledMock = vi.fn()
const saveInstalledMock = vi.fn()

vi.mock('@tauri-apps/plugin-fs', () => ({
  readDir: readDirMock,
}))

vi.mock('@/lib/installed', () => ({
  loadInstalled: loadInstalledMock,
  saveInstalled: saveInstalledMock,
}))

function fileEntry(overrides: Partial<FileListEntry> = {}): FileListEntry {
  return {
    UID: 1,
    UIVersion: '1.0.0',
    UIDate: 1,
    UIName: 'Addon One',
    UIAuthorName: 'Author',
    UIDownloadTotal: 0,
    UIDir: ['AddonOne'],
    ...overrides,
  }
}

function installed(overrides: Partial<InstalledAddon> = {}): InstalledAddon {
  return {
    uid: 1,
    name: 'Addon One',
    author: 'Author',
    version: '1.0.0',
    date: 1,
    downloads: 0,
    directory: 'AddonOne',
    thumbnail: null,
    ...overrides,
  }
}

describe('installed folder reconciliation', () => {
  beforeEach(() => {
    vi.resetModules()
    readDirMock.mockReset()
    loadInstalledMock.mockReset()
    saveInstalledMock.mockReset()
  })

  it('prunes missing records, imports matchable folders, and reports unmatched folders', async () => {
    const { reconcileInstalledWithFolder } = await import('@/lib/import')
    readDirMock.mockResolvedValue([
      { name: 'AddonOne', isDirectory: true },
      { name: 'AddonTwo', isDirectory: true },
      { name: 'Unknown', isDirectory: true },
      { name: 'readme.txt', isDirectory: false },
    ])
    loadInstalledMock.mockResolvedValue([installed({ uid: 99, directory: 'Missing' })])

    const result = await reconcileInstalledWithFolder('/addons', [
      fileEntry({ UID: 1, UIName: 'Addon One', UIDir: ['AddonOne'] }),
      fileEntry({ UID: 2, UIName: 'Addon Two', UIDir: ['AddonTwo'], UIVersion: '2.0.0' }),
    ])

    expect(result).toEqual({
      imported: [
        installed({ uid: 1, directory: 'AddonOne' }),
        installed({ uid: 2, name: 'Addon Two', version: '2.0.0', directory: 'AddonTwo' }),
      ],
      removed: 1,
      kept: 2,
      unmatched: ['Unknown'],
    })
    expect(saveInstalledMock).toHaveBeenCalledWith(result.imported)
  })

  it('keeps existing records and skips imports with duplicate UIDs', async () => {
    const { reconcileInstalledWithFolder } = await import('@/lib/import')
    readDirMock.mockResolvedValue([
      { name: 'AddonOne', isDirectory: true },
      { name: 'AddonAlias', isDirectory: true },
    ])
    loadInstalledMock.mockResolvedValue([installed({ uid: 1, directory: 'AddonOne' })])

    const result = await reconcileInstalledWithFolder('/addons', [
      fileEntry({ UID: 1, UIDir: ['AddonOne', 'AddonAlias'] }),
    ])

    expect(result).toEqual({ imported: [], removed: 0, kept: 1, unmatched: [] })
    expect(saveInstalledMock).toHaveBeenCalledWith([installed({ uid: 1, directory: 'AddonOne' })])
  })

  it('prunes only when no filelist is available', async () => {
    const { reconcileInstalledWithFolder } = await import('@/lib/import')
    readDirMock.mockResolvedValue([{ name: 'Unknown', isDirectory: true }])
    loadInstalledMock.mockResolvedValue([installed({ directory: 'Missing' })])

    await expect(reconcileInstalledWithFolder('/addons', null)).resolves.toEqual({
      imported: [],
      removed: 1,
      kept: 0,
      unmatched: ['Unknown'],
    })
    expect(saveInstalledMock).toHaveBeenCalledWith([])
  })
})
