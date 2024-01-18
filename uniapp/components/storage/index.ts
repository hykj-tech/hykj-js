// 这个模块是uni和storage交互相关的统一工具

export function getStorage<type = string>(key: string){
  return uni.getStorageSync(key) as type;
}

export const setStorage = (key: string, value: any) => {
  return uni.setStorageSync(key, value);
}

export const removeStorage = (key: string) => {
  return uni.removeStorageSync(key);
}
