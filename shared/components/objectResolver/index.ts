type ObjectInStore<Type> = {
  data: Type,
  lastUpdateTime: Date
}

type ObjectResolverOptions = {
  objectIdKey?: string;
  // 内存缓存时间, 默认0过期
  timeout?: number;
  // resolve去抖间隔, 默认5ms
  debounceTime?: number;
}

type ResolveRequestQueue<ObjectType> = {
    ids: string[];
    resolve: (objects: ObjectType[]) => void | null;
  }
export class ObjectResolver<ObjectType> {
  private objectStore: Map<string, ObjectInStore<ObjectType>> = new Map<
    string,
    ObjectInStore<ObjectType>
  >();
  private objectIdKey: string;
  // 过期时间
  private timeout: number;
  private debounceTime: number = 5; // 默认5ms
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private resolveRequestQueue: ResolveRequestQueue<ObjectType>[] = [];
  // 当store不存在时，供用户自定义的解析object的函数
  private onResolveObjects: (ids: string[]) => Promise<ObjectType[]>;
  // 用户使用的函数，传入id列表，返回对象列表
  private resolveObjectsRaw = async (ids: string[]) => {
    // 过滤ids，空的id不需要解析
    const idsUse = ids
      .filter((id) => {
        if (typeof id === "string") {
          return id.trim() !== "";
        }
        return Boolean(id);
      })
      .map((id) => id.toString());
    if (idsUse.length === 0) {
      return [] as ObjectType[];
    }
    // 先尝试查找store，找不到的话再调用用户自定义的解析函数，但是整个返回列表顺序要和ids一致
    const objects: { id: string; obj: ObjectType | null }[] = idsUse.map(
      (id) => {
        const obj = this.objectStore.get(id)?.data || null;
        return { id, obj };
      }
    );
    const needResolveIds = objects
      .filter((item) => item.obj === null)
      // 过滤过期时间
      .filter((item) => {
        if(this.timeout <= 0) {
          return true; // 不需要过期时间限制
        }
        // 如果有缓存，检查缓存时间是否超过了timeout
        const obj = this.objectStore.get(item.id);
        if (obj) {
          return (
            new Date().getTime() - obj.lastUpdateTime.getTime() > this.timeout
          );
        }
        return true;
      })
      .map((item) => item.id);
    if (needResolveIds.length > 0) {
      const resolvedObjects = await this.onResolveObjects(needResolveIds);
      resolvedObjects.forEach((obj) => {
        const now = new Date();
        this.objectStore.set(obj[this.objectIdKey]?.toString(), {
          data: obj,
          lastUpdateTime: now,
        });
      });
      objects.forEach((item) => {
        if (item.obj === null) {
          item.obj =
            resolvedObjects.find(
              (obj) => obj[this.objectIdKey]?.toString() === item.id
            ) || null;
        }
      });
    }
    // 校验并警告用户，有些id没有对应的对象
    const unresolvedIds = objects
      .filter((item) => item.obj === null)
      .map((item) => item.id);
    if (unresolvedIds.length > 0) {
      console.warn(
        `ObjectResolver: can't resolve objects with ids: ${unresolvedIds.join(
          ","
        )}`
      );
    }
    return objects
      .map((item) => item.obj)
      .filter((obj) => obj !== null) as ObjectType[];
  };
  /**
   * 供外部使用的主函数，将自动收集解析请求去抖后自动分发，减少解析请求数量
   * @param ids 
   * @returns 
   */
  public resolveObjects = async (ids: string[]) => {
    // console.debug("ObjectResolver: resolveObjects start", ids);
    const queueItem: ResolveRequestQueue<ObjectType> = {
      ids: ids,
      resolve: null
    }
    const task = new Promise<ObjectType[]>((resolve) => {
      queueItem.resolve = resolve;
    });
    this.resolveRequestQueue.push(queueItem);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(async () => {
      this.flushQueue();
    }, this.debounceTime);
    return await task;
  };
  private flushQueue = async ()=>{
    const queue = this.resolveRequestQueue;
    if (this.resolveRequestQueue.length === 0) {
      queue.forEach((item) => {
        item.resolve([]);
      });
      return;
    }
    const ids = queue.map((item) => item.ids).flat();
    // 去重复
    const uniqueIds = Array.from(new Set(ids));
    const objects = await this.resolveObjectsRaw(uniqueIds);
    queue.forEach((item) => {
      // 分发
      const resolvedObjects = objects.filter((obj) =>
        item.ids.includes(obj[this.objectIdKey]?.toString())
      );
      if (item.resolve) {
        item.resolve(resolvedObjects);
      }
    });
    this.resolveRequestQueue = [];
  }
  /**
   * 创建解析器
   * @param onResolveObjects 对象解析函数
   * @param options 解析器选项
   */
  constructor(
    onResolveObjects: (ids: string[]) => Promise<ObjectType[]>,
    options?: ObjectResolverOptions
  ) {
    this.objectIdKey = options?.objectIdKey || "id";
    this.timeout = options?.timeout || 0
    this.debounceTime = options?.debounceTime || 5;
    this.onResolveObjects = onResolveObjects;
  }
  public clearStore = () => {
    this.objectStore.clear();
  };
  public clearObject = (id: string) => {
    if (this.objectStore.has(id)) {
      this.objectStore.delete(id);
    } 
  }
  public updateObject = (id: string, obj: ObjectType) => {
    const now = new Date();
    this.objectStore.set(id, { data: obj, lastUpdateTime: now });
  };
  public getStore = () => {
    return this.objectStore;
  };
}