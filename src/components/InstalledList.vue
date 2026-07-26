<script setup lang="ts">
const store = useAddonsStore()

const updatableCount = computed(() => store.installed.filter((a) => store.updateMap[a.uid]).length)
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-if="store.needsSetup" class="eso-panel rounded-sm p-4 text-center text-parchment-dim text-sm italic">
      Pick an AddOn folder above to see your installed addons.
    </div>

    <div v-else-if="store.installed.length === 0" class="eso-panel rounded-sm p-4 text-center text-parchment-dim text-sm italic">
      No addons tracked yet. Use the search panel to install one.
    </div>

    <template v-else>
      <div v-if="updatableCount > 0" class="flex items-center justify-between text-sm">
        <span class="text-gold-bright">{{ updatableCount }} update(s) available</span>
        <button class="btn btn-primary !my-0" :disabled="store.loading" @click="store.updateAll">Update all</button>
      </div>

      <div
        v-for="addon in store.installed"
        :key="addon.uid"
        class="eso-card rounded-sm p-3 flex items-center gap-3"
      >
        <AddonIcon :thumb="addon.thumbnail ?? store.thumbForUid(addon.uid)" :name="addon.name" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-serif text-parchment truncate text-[15px]">{{ addon.name }}</span>
            <span v-if="store.updateMap[addon.uid]" class="eso-badge">update available</span>
          </div>
          <div class="text-xs text-parchment-faint italic truncate">
            by {{ addon.author || 'unknown' }} · v{{ addon.version || '?' }} · {{ addon.downloads }} downloads
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            v-if="store.updateMap[addon.uid]"
            class="btn btn-primary !my-0"
            :disabled="store.loading"
            @click="store.updateAddon(addon)"
          >Upgrade</button>
          <button
            class="btn btn-danger !my-0"
            :disabled="store.loading"
            @click="store.removeAddon(addon)"
          >Delete</button>
        </div>
      </div>
    </template>
  </div>
</template>