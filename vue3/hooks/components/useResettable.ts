import { objectAssignByPick } from "@hykj-js/shared";
import { ref, reactive, toRaw } from "vue-demi";
import type { Reactive, Ref } from "vue-demi";

/**
 * 可重置的响应式状态创建，初始为对象类型
 * @param initialValue 
 * @returns 
 */
export const useResettableState = function <T extends object>(
  initialValue: T
): readonly [Reactive<T>, () => void] {
  const defaultValue = structuredClone(toRaw(initialValue));
  if (typeof initialValue !== "object") {
    throw new Error("useResettable only accepts object type as initialValue");
  }
  const state = reactive(structuredClone(defaultValue));
  return [
    state,
    () => {
      objectAssignByPick(state as any, defaultValue as any);
    },
  ] as const;
};

/**
 * 可重置的响应式状态创建，初始为基本类型
 * @param value 
 * @returns 
 */
export const useResettableRef = function <T>(
  value: T
): readonly [Ref<T>, () => void] {
  const defaultValue = value;
  const state = ref(defaultValue);
  return [
    state as Ref<T>,
    () => {
      state.value = defaultValue;
    },
  ] as const;
};
