<script setup lang="ts">
const store = useAddonsStore()

onMounted(() => {
  store.initApp()
})
</script>

<template>
  <main class="min-h-screen flex flex-col">
    <header class="eso-panel border-b border-eso-edge-bright">
      <div class="flex items-center gap-3 px-5 pt-4">
        <h1 class="!text-xl !my-0 text-gold-bright">Chaotic Addon Manager</h1>
        <span v-if="store.error" class="ml-auto text-sm text-blood-bright truncate max-w-[50%]" :title="store.error">
          {{ store.error }}
          <button class="text-parchment-dim underline ml-1" @click="store.clearError">dismiss</button>
        </span>
      </div>
      <div class="eso-divider mx-5 mt-3" />
      <SettingsBar />
    </header>

    <section class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
      <div class="flex flex-col min-h-0">
        <h2 class="!text-base !my-0 mb-3 text-gold">Installed</h2>
        <div class="flex flex-col gap-2 overflow-auto pr-1">
          <InstalledList />
        </div>
      </div>

      <div class="flex flex-col min-h-0">
        <h2 class="!text-base !my-0 mb-3 text-gold">Search &amp; Install</h2>
        <SearchPanel />
      </div>
    </section>
  </main>
</template>