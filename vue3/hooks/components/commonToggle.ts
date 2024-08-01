import { ref } from "vue-demi";

export const useCommonToggle = function(){
  const value = ref<boolean>(false);
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
