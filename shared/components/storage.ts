/**
 * 将js数据进行JSON.stringify序列化, 并使用type记录数据类型，反序列化时使用
 * @param data 数据
 */
function serializeStorage(data: any) {
  if (typeof data === 'object') {
    return {
      type: 'object',
      data: JSON.stringify(data),
    };
  }
  return {
    type: typeof data,
    data: data.toString(),
  };
}
/**
 * 反序列化serializeStorage序列化的数据
 * @param storageData
 */
function deSerializeStorage(storageData: string) {
  const {type, data} = JSON.parse(storageData);
  if (type === 'string') {
    return data;
  }
  if (type === 'number') {
    return Number(data);
  }
  return JSON.parse(data);
}

export function setStorage(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(serializeStorage(data)));
}

export function getStorage<ResultType = string>(key: string) {
  const storageData = localStorage.getItem(key);
  if (!storageData) {
    return null;
  }
  return deSerializeStorage(storageData) as ResultType;
}

export function removeStorage(key: string) {
  localStorage.removeItem(key);
}
