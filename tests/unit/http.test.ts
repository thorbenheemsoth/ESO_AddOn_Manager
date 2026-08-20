import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FileListEntry } from '@/lib/types'

const fetchMock = vi.fn()
const mkdirMock = vi.fn()
const writeTextFileMock = vi.fn()
const appDataDirMock = vi.fn()
const joinMock = vi.fn()
const sepMock = vi.fn(() => '/')

vi.mock('@tauri-apps/plugin-http', () => ({
  fetch: fetchMock,
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: mkdirMock,
  writeTextFile: writeTextFileMock,
}))

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: appDataDirMock,
  join: joinMock,
  sep: sepMock,
}))

function entry(overrides: Partial<FileListEntry> = {}): FileListEntry {
  return {
    UID: 1,
    UIVersion: '1.0.0',
    UIDate: 1,
    UIName: 'Addon',
    UIAuthorName: 'Author',
    UIDownloadTotal: 0,
    ...overrides,
  }
}

describe('http helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    fetchMock.mockReset()
    mkdirMock.mockReset()
    writeTextFileMock.mockReset()
    appDataDirMock.mockReset()
    joinMock.mockReset()
    sepMock.mockReset()
    appDataDirMock.mockResolvedValue('/app/data')
    joinMock.mockImplementation((...parts: string[]) => Promise.resolve(parts.join('/')))
    sepMock.mockReturnValue('/')
  })

  it('downloads and caches the filelist', async () => {
    const { downloadFilelist } = await import('@/lib/http')
    const data = [entry()]
    const text = JSON.stringify(data)
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(text) })

    await expect(downloadFilelist()).resolves.toEqual(data)

    expect(fetchMock).toHaveBeenCalledWith('https://api.mmoui.com/v3/game/ESO/filelist.json')
    expect(mkdirMock).toHaveBeenCalledWith('/app/data', { recursive: true })
    expect(writeTextFileMock).toHaveBeenCalledWith('/app/data/filelist.json', text)
  })

  it('reports filelist HTTP and JSON failures', async () => {
    const { downloadFilelist } = await import('@/lib/http')

    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 })
    await expect(downloadFilelist()).rejects.toThrow('HTTP 503')

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('{') })
    await expect(downloadFilelist()).rejects.toThrow('Filelist is not valid JSON')
  })

  it('fetches zip bytes and validates status plus content type', async () => {
    const { fetchZip } = await import('@/lib/http')
    const bytes = new Uint8Array([1, 2, 3])

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/zip; charset=binary' }),
      arrayBuffer: () => Promise.resolve(bytes.buffer),
    })
    await expect(fetchZip(123)).resolves.toEqual(bytes)
    expect(fetchMock).toHaveBeenCalledWith('https://www.esoui.com/downloads/getfile.php?id=123')

    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(fetchZip(123)).rejects.toThrow('HTTP 404')

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      arrayBuffer: () => Promise.resolve(bytes.buffer),
    })
    await expect(fetchZip(123)).rejects.toThrow('not a zip')
  })
})
