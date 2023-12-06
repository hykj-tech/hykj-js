import {ref} from "vue";

export const useCommonToggle = () => {
  const value = ref(false);
  const open = () => {
    value.value = true;
  }
  const close = () => {
    value.value = false;
  }
  const toggle = (targetValue?: boolean) => {
    value.value = targetValue !== undefined ? Boolean(targetValue) : !value.value;
  }
  return {
    value,
    open,
    close,
    toggle
  }
}
