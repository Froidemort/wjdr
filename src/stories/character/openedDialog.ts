import { defineComponent, h, onMounted, ref, type Component } from 'vue'

/** The modals expose their <dialog>; open it after mount so the story renders it. */
export function openedDialog(component: Component): Component {
  return defineComponent({
    inheritAttrs: false,
    setup(_, { attrs }) {
      const modal = ref<{ dialog: HTMLDialogElement | null } | null>(null)
      onMounted(() => modal.value?.dialog?.showModal())
      return () => h(component, { ...attrs, ref: modal })
    },
  })
}
