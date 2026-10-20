<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import MarkdownContent from './MarkdownContent.vue'

type MarkdownFormat = 'bold' | 'italic' | 'list' | 'quote'

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    textareaId?: string
    invalid?: boolean
    errorId?: string
  }>(),
  { label: 'Contenu texte', placeholder: 'Message, indice, contexte...', textareaId: 'markdown-editor' }
)

const model = defineModel<string>({ default: '' })

const textarea = ref<HTMLTextAreaElement | null>(null)
const mode = ref<'write' | 'preview'>('write')
const isPreview = computed(() => mode.value === 'preview')

const TOOLBAR: Array<{ format: MarkdownFormat; label: string; text: string }> = [
  { format: 'bold', label: 'Gras', text: 'G' },
  { format: 'italic', label: 'Italique', text: 'I' },
  { format: 'list', label: 'Liste à puces', text: '•' },
  { format: 'quote', label: 'Citation', text: '❝' },
]
const WRAPPERS: Record<'bold' | 'italic', string> = { bold: '**', italic: '*' }
const PREFIXES: Record<'list' | 'quote', string> = { list: '- ', quote: '> ' }

async function applyFormat(format: MarkdownFormat): Promise<void> {
  const element = textarea.value
  if (!element) {
    return
  }

  const value = model.value
  const start = element.selectionStart
  const end = element.selectionEnd
  let caretStart: number
  let caretEnd: number

  if (format === 'bold' || format === 'italic') {
    const marker = WRAPPERS[format]
    model.value = `${value.slice(0, start)}${marker}${value.slice(start, end)}${marker}${value.slice(end)}`
    caretStart = start + marker.length
    caretEnd = end + marker.length
  } else {
    const prefix = PREFIXES[format]
    const lineStart = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1
    const segment = value.slice(lineStart, end)
    const prefixed = segment
      .split('\n')
      .map((line) => `${prefix}${line}`)
      .join('\n')
    model.value = `${value.slice(0, lineStart)}${prefixed}${value.slice(end)}`
    caretStart = start + prefix.length
    caretEnd = end + (prefixed.length - segment.length)
  }

  await nextTick()
  element.focus()
  element.setSelectionRange(caretStart, caretEnd)
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <label class="label-text" :for="props.textareaId">{{ props.label }}</label>
      <div role="tablist" class="tabs tabs-box tabs-sm">
        <button
          type="button"
          role="tab"
          class="tab min-h-11 md:min-h-0"
          :class="{ 'tab-active': !isPreview }"
          :aria-selected="!isPreview"
          @click="mode = 'write'"
        >
          Écrire
        </button>
        <button
          type="button"
          role="tab"
          class="tab min-h-11 md:min-h-0"
          :class="{ 'tab-active': isPreview }"
          :aria-selected="isPreview"
          @click="mode = 'preview'"
        >
          Aperçu
        </button>
      </div>
    </div>

    <div v-show="!isPreview" class="space-y-2">
      <div class="flex flex-wrap gap-1" role="toolbar" aria-label="Mise en forme">
        <button
          v-for="item in TOOLBAR"
          :key="item.format"
          type="button"
          class="btn btn-sm min-h-11 min-w-11 md:min-h-8 md:min-w-8"
          :aria-label="item.label"
          :title="item.label"
          @click="applyFormat(item.format)"
        >
          <span aria-hidden="true" :class="{ 'font-bold': item.format === 'bold', italic: item.format === 'italic' }">
            {{ item.text }}
          </span>
        </button>
      </div>
      <textarea
        :id="props.textareaId"
        ref="textarea"
        v-model="model"
        class="textarea textarea-bordered ui-critical-control min-h-32 w-full"
        :placeholder="props.placeholder"
        :aria-invalid="props.invalid ? 'true' : 'false'"
        :aria-errormessage="props.invalid ? props.errorId : undefined"
        :aria-describedby="props.invalid ? props.errorId : undefined"
      />
    </div>

    <div v-if="isPreview" class="min-h-32 rounded-box border border-base-300 bg-base-100 p-3" aria-live="polite">
      <MarkdownContent v-if="model.trim()" :source="model" />
      <p v-else class="text-sm opacity-70">Rien à prévisualiser.</p>
    </div>
  </div>
</template>
