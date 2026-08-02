import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FileListEntry, InstalledAddon } from '@/lib/types'

const existsMock = vi.fn()
const removeMock = vi.fn()
const downloadAndExtractZipMock = vi.fn()
const extractDependenciesMock = vi.fn()
const upsertInstalledMock = vi.fn()
const removeInstalledRecordMock = vi.fn()
const sepMock = vi.fn(() => '/')

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: existsMock,
  remove: removeMock,
}))

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: vi.fn(),
  join: vi.fn(),
  sep: sepMock,
}))

vi.mock('@/lib/zip', () => ({
  downloadAndExtractZip: downloadAndExtractZipMock,
  extractDependencies: extractDependenciesMock,
}))

vi.mock('@/lib/installed', () => ({
  upsertInstalled: upsertInstalledMock,
  removeInstalledRecord: removeInstalledRecordMock,
}))

function fileEntry(overrides: Partial<FileListEntry> = {}): FileListEntry {
  return {
    UID: 1,
    UIVersion: '1.0.0',
    UIDate: 1,
    UIName: 'Addon One',
    UIAuthorName: 'Author',
    UIDownloadTotal: 0,
    UIIMG_Thumbs: ['thumb.jpg'],
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
    thumbnail: 'thumb.jpg',
    ...overrides,
  }
}

describe('addon manager', () => {
  beforeEach(() => {
    vi.resetModules()
    existsMock.mockReset()
    removeMock.mockReset()
    downloadAndExtractZipMock.mockReset()
    extractDependenciesMock.mockReset()
    upsertInstalledMock.mockReset()
    removeInstalledRecordMock.mockReset()
    sepMock.mockReset()
    sepMock.mockReturnValue('/')
  })

  it('installs an addon and records dependencies that need installation', async () => {
    const { installAddon } = await import('@/lib/addonManager')
    const primary = fileEntry({ UID: 1, UIName: 'Addon One' })
    const dependency = fileEntry({ UID: 2, UIName: 'LibFoo', UIVersion: '2.0.0' })
    downloadAndExtractZipMock.mockResolvedValueOnce('AddonOne').mockResolvedValueOnce('LibFoo')
    extractDependenciesMock.mockResolvedValue(['LibFoo'])
    existsMock.mockResolvedValue(false)
    const resolveDependency = vi.fn().mockResolvedValue(dependency)

    await expect(
      installAddon(primary, {
        addonPath: '/addons',
        installDeps: true,
        filelist: [primary, dependency],
        resolveDependency,
      }),
    ).resolves.toEqual([
      installed({ uid: 1, name: 'Addon One', directory: 'AddonOne' }),
      installed({ uid: 2, name: 'LibFoo', version: '2.0.0', directory: 'LibFoo' }),
    ])

    expect(downloadAndExtractZipMock).toHaveBeenCalledWith(1, '/addons')
    expect(downloadAndExtractZipMock).toHaveBeenCalledWith(2, '/addons')
    expect(resolveDependency).toHaveBeenCalledWith('LibFoo')
    expect(upsertInstalledMock).toHaveBeenCalledTimes(2)
  })

  it('skips dependency work when disabled or already present on disk', async () => {
    const { installAddon } = await import('@/lib/addonManager')
    const primary = fileEntry()
    downloadAndExtractZipMock.mockResolvedValue('AddonOne')
    extractDependenciesMock.mockResolvedValue(['LibFoo'])

    await installAddon(primary, {
      addonPath: '/addons',
      installDeps: false,
      filelist: [primary],
      resolveDependency: vi.fn(),
    })
    expect(extractDependenciesMock).not.toHaveBeenCalled()

    existsMock.mockResolvedValueOnce(true)
    await installAddon(primary, {
      addonPath: '/addons',
      installDeps: true,
      filelist: [primary],
      resolveDependency: vi.fn(),
    })
    expect(downloadAndExtractZipMock).toHaveBeenCalledTimes(2)
  })

  it('removes an addon folder when present and always removes its DB record', async () => {
    const { removeAddon } = await import('@/lib/addonManager')
    existsMock.mockResolvedValueOnce(true)

    await removeAddon(installed(), '/addons')

    expect(removeMock).toHaveBeenCalledWith('/addons/AddonOne', { recursive: true })
    expect(removeInstalledRecordMock).toHaveBeenCalledWith(1)
  })

  it('detects, updates, and bulk-updates newer addons', async () => {
    const { checkUpdates, updateAddon, updateAll } = await import('@/lib/addonManager')
    const oldAddon = installed({ uid: 1, date: 1 })
    const currentAddon = installed({ uid: 2, date: 10 })
    const filelist = [
      fileEntry({ UID: 1, UIDate: 2, UIVersion: '2.0.0' }),
      fileEntry({ UID: 2, UIDate: 10 }),
    ]
    downloadAndExtractZipMock.mockResolvedValue('AddonOne')

    expect(checkUpdates([oldAddon, currentAddon], filelist)).toEqual({ 1: true })
    await expect(updateAddon(oldAddon, '/addons', filelist)).resolves.toEqual(
      installed({ uid: 1, version: '2.0.0', date: 2, directory: 'AddonOne' }),
    )
    await expect(updateAddon(installed({ uid: 99 }), '/addons', filelist)).resolves.toBeNull()
    await expect(updateAll([oldAddon, currentAddon], '/addons', filelist)).resolves.toEqual([
      installed({ uid: 1, version: '2.0.0', date: 2, directory: 'AddonOne' }),
    ])
  })
})
