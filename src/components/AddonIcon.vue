<script setup lang="ts">
const props = defineProps<{ thumb?: string | null; name: string }>()

const failed = ref(false)

// reset the fallback state when the thumbnail source changes
watch(() => props.thumb, () => {
  failed.value = false
})

const initial = computed(() => (props.name?.trim()?.[0] ?? '?').toUpperCase())
</script>

<template>
  <span class="shrink-0 w-10 h-10 rounded-sm overflow-hidden border border-eso-edge-bright flex items-center justify-center bg-eso-bg2">
    <img
      v-if="thumb && !failed"
      :src="thumb"
      :alt="name"
      loading="lazy"
      class="w-full h-full object-cover"
      @error="failed = true"
    />
    <span v-else class="font-display text-gold text-lg leading-none select-none">{{ initial }}</span>
  </span>
</template>