import { load, type Store } from '@tauri-apps/plugin-store'

const STORE_FILE = 'config.json'
const KEY_ADDON_PATH = 'addonPath'
const KEY_INSTALL_DEPS = 'installDeps'

export interface AppConfig {
  /** User-chosen addon target directory, or null until configured. */
  addonPath: string | null
  /** Whether to automatically install `## DependsOn:` libraries. */
  installDeps: boolean
}

const DEFAULT_CONFIG: AppConfig = {
  addonPath: null,
  installDeps: true,
}

let storePromise: Promise<Store> | null = null

/** Lazily create and load the persistent config store. */
async function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load(STORE_FILE, { autoSave: true })
  }
  return storePromise
}

/** Load the full config, falling back to defaults for missing keys. */
export async function loadConfig(): Promise<AppConfig> {
  const store = await getStore()
  const addonPath = await store.get<string | null>(KEY_ADDON_PATH)
  const installDeps = await store.get<boolean>(KEY_INSTALL_DEPS)
  return {
    addonPath: addonPath ?? DEFAULT_CONFIG.addonPath,
    installDeps: installDeps ?? DEFAULT_CONFIG.installDeps,
  }
}

/** Persist the addon target directory. */
export async function saveAddonPath(path: string | null): Promise<void> {
  const store = await getStore()
  await store.set(KEY_ADDON_PATH, path)
  await store.save()
}

/** Persist the auto-install-dependencies toggle. */
export async function saveInstallDeps(value: boolean): Promise<void> {
  const store = await getStore()
  await store.set(KEY_INSTALL_DEPS, value)
  await store.save()
}