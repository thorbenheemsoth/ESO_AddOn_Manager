import { beforeEach, describe, expect, it, vi } from 'vitest'

const unzipSyncMock = vi.fn()
const existsMock = vi.fn()
const mkdirMock = vi.fn()
const readTextFileMock = vi.fn()
const removeMock = vi.fn()
const writeFileMock = vi.fn()
const fetchZipMock = vi.fn()
const sepMock = vi.fn(() => '/')

vi.mock('fflate', () => ({
  unzipSync: unzipSyncMock,
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: existsMock,
  mkdir: mkdirMock,
  readTextFile: readTextFileMock,
  remove: removeMock,
  writeFile: writeFileMock,
}))

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: vi.fn(),
  join: vi.fn(),
  sep: sepMock,
}))

vi.mock('@/lib/http', () => ({
  fetchZip: fetchZipMock,
}))

describe('zip helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    unzipSyncMock.mockReset()
    existsMock.mockReset()
    mkdirMock.mockReset()
    readTextFileMock.mockReset()
    removeMock.mockReset()
    writeFileMock.mockReset()
    fetchZipMock.mockReset()
    sepMock.mockReset()
    sepMock.mockReturnValue('/')
  })

  it('downloads, validates, replaces, and extracts zip entries', async () => {
    const { downloadAndExtractZip } = await import('@/lib/zip')
    const readme = new Uint8Array([1])
    const manifest = new Uint8Array([2])
    fetchZipMock.mockResolvedValue(new Uint8Array([9]))
    unzipSyncMock.mockReturnValue({
      'Foo/': new Uint8Array(),
      'Foo/readme.txt': readme,
      'Foo/nested/manifest.txt': manifest,
      '../escape.txt': new Uint8Array([3]),
    })
    existsMock.mockResolvedValue(true)

    await expect(downloadAndExtractZip(12, '/addons')).resolves.toBe('Foo')

    expect(fetchZipMock).toHaveBeenCalledWith(12)
    expect(removeMock).toHaveBeenCalledWith('/addons/Foo', { recursive: true })
    expect(mkdirMock).toHaveBeenCalledWith('/addons/Foo', { recursive: true })
    expect(mkdirMock).toHaveBeenCalledWith('/addons/Foo/nested', { recursive: true })
    expect(writeFileMock).toHaveBeenCalledWith('/addons/Foo/readme.txt', readme)
    expect(writeFileMock).toHaveBeenCalledWith('/addons/Foo/nested/manifest.txt', manifest)
    expect(writeFileMock).not.toHaveBeenCalledWith('/escape.txt', expect.any(Uint8Array))
  })

  it('throws when a zip has no valid entries', async () => {
    const { downloadAndExtractZip } = await import('@/lib/zip')
    fetchZipMock.mockResolvedValue(new Uint8Array([9]))
    unzipSyncMock.mockReturnValue({ '../escape.txt': new Uint8Array([1]) })

    await expect(downloadAndExtractZip(12, '/addons')).rejects.toThrow('empty or contains no valid entries')
  })

  it('extracts Lib dependencies from addon metadata and falls back to txt', async () => {
    const { extractDependencies } = await import('@/lib/zip')

    readTextFileMock.mockResolvedValueOnce('## DependsOn: LibAddonMenu-2.0>36 LibFoo NotALib\n')
    await expect(extractDependencies('/addons', 'Foo')).resolves.toEqual(['LibAddonMenu-2.0', 'LibFoo'])
    expect(readTextFileMock).toHaveBeenCalledWith('/addons/Foo/Foo.addon')

    readTextFileMock.mockRejectedValueOnce(new Error('missing addon'))
    readTextFileMock.mockResolvedValueOnce('name\n## DependsOn: LibBar\n')
    await expect(extractDependencies('/addons', 'Bar')).resolves.toEqual(['LibBar'])
    expect(readTextFileMock).toHaveBeenCalledWith('/addons/Bar/Bar.txt')
  })

  it('returns no dependencies when metadata is missing or has no dependency line', async () => {
    const { extractDependencies } = await import('@/lib/zip')

    readTextFileMock.mockRejectedValueOnce(new Error('missing addon'))
    readTextFileMock.mockRejectedValueOnce(new Error('missing txt'))
    await expect(extractDependencies('/addons', 'Missing')).resolves.toEqual([])

    readTextFileMock.mockResolvedValueOnce('## Title: No deps\n')
    await expect(extractDependencies('/addons', 'NoDeps')).resolves.toEqual([])
  })
})
