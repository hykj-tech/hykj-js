// 这个模块的内容依赖于Config配置功能，确保使用时已经注入了全局Config
declare global{
  const CONFIG: GlobalConfig
}

import { uniDownloadFile } from './file'

interface IDownloadFileOptions {
  fileType?: string
  fileName?: string
  disableLoading?: boolean
}

/**
 * 统一交互的下载文件，
 * 主要用于区分在h5端，使用a标签下载文件，在其他端直接调用uni的saveFile和open方法
 * @param url
 * @param options
 */
export const commonDownLoadFile = async (url: string, options?: IDownloadFileOptions) => {
  const fileUrl = url
  if (!fileUrl) {
    uni.showToast({
      title: '暂无下载地址',
      icon: 'none',
    })
    return
  }
  if (options?.disableLoading !== false) {
    uni.showLoading({
      title: '下载中...',
      mask: true,
    })
  }
  // 根据文件url获取文件后缀名
  const fileType = options?.fileType || fileUrl.substring(fileUrl.lastIndexOf('.') + 1)
  const fileName = options?.fileName || fileUrl.substring(fileUrl.lastIndexOf('/') + 1)
  // 微信端允许的fileType类型
  const wechatAllowFileType = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf']
  // 判断是否是微信端
  if (CONFIG.platform === 'MP') {
    // 检测文件类型是否允许
    if (wechatAllowFileType.indexOf(fileType) === -1) {
      uni.showToast({
        title: '文件类型不支持',
        icon: 'none',
      })
      return
    }
  }
  // 判断h5
  if (CONFIG.isBrowser) {
    try {
      await downloadFileInH5(fileUrl, options)
      uni.hideLoading()
    } catch (e) {
      uni.showToast({
        title: '下载失败',
        icon: 'none',
      })
    }
    return
  }
  // 其他端通用模式下载
  let savedFilePath = ''
  try {
    // app环境下，只用plus.io和downloader相关API
    if (CONFIG.platform.includes('APP')) {
      savedFilePath = await downloadFileInApp(fileUrl, options)
      // console.info(`[commonDownLoadFile] app环境下下载文件: ${savedFilePath}`, )
    } else {
      // 其他环境，比如小程序
      // 使用uni的临时下载模式
      const [res, err] = await uniDownloadFile(fileUrl)
      if (err) {
        uni.showToast({
          title: '下载失败',
          icon: 'none',
        })
        return
      }
      savedFilePath = await wxSaveFileToDisk(res.tempFilePath, options)
      if (!savedFilePath) {
        // 兜底方案，这个一般不会进入
        savedFilePath = await normalSaveFileToDist(res.tempFilePath)
      }
    }
    // 检查文件是否保存好了
    if (!savedFilePath) {
      uni.showToast({
        title: '保存文件失败',
        icon: 'error',
      })
      return
    }
    // 如果是图片，用uni.previewImage打开
    const imgTypeList = ['png', 'jpg', 'jpeg', 'gif', 'bmp']
    if (imgTypeList.indexOf(fileType?.toLowerCase()) > -1) {
      uni.previewImage({
        urls: [savedFilePath],
      })
      uni.hideLoading()
      return
    }
    // 打开文件
    uni.openDocument({
      filePath: savedFilePath,
      // fileType,
      // @ts-ignore
      showMenu: true,
      success: function (res) {
        uni.hideLoading()
      },
      fail: function (err) {
        // console.error('[commonDownLoadFile] 打开文档失败', err);
        uni.showToast({
          title: `当前设备不支持打开该文件，已保存至${savedFilePath}`,
          icon: 'none',
          duration: 4000,
        })
      },
    })
  } catch (e) {
    console.log(e.message)
    console.error('[commonDownLoadFile] 下载文件失败', e)
    uni.hideLoading()
  }
}

/**
 * 在h5上使用xhr和a标签下载文件
 * @param fileUrl
 * @param options
 */
export const downloadFileInH5 = async (fileUrl: string, options?: IDownloadFileOptions) => {
  return new Promise((resolve, reject) => {
    const fileName = options?.fileName || fileUrl.substring(fileUrl.lastIndexOf('/') + 1)
    const fileExtension = options?.fileType || fileName.substring(fileName.lastIndexOf('.') + 1)
    const xhr = new XMLHttpRequest()
    xhr.open('GET', fileUrl, true)
    xhr.responseType = 'blob'
    xhr.onload = function () {
      if (this.status === 200) {
        const blob = this.response
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onload = function (e) {
          // 转换完成，创建一个a标签用于下载
          const a = document.createElement('a')
          // 确保文件名有后缀
          a.download = fileName.indexOf('.') > -1 ? fileName : `${fileName}.${fileExtension}`
          a.href = (e.target as any).result as string
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          resolve(null)
        }
        reader.onerror = function (err) {
          console.error('[downloadFileInH5] 下载文件失败', err)
          reject(err)
        }
      } else {
        console.error('[downloadFileInH5] 下载文件失败', this.status)
        reject(`下载文件失败,code:${this.status}`)
      }
    }
    xhr.onerror = function (err) {
      console.error('[downloadFileInH5] 下载文件失败', err)
      reject(err)
    }
    xhr.send()
  })
}

// 使用通用的保存，比如app上，目前会是没有文件名的
export const normalSaveFileToDist = async (tempFilePath: string): Promise<string> => {
  return new Promise((ok, rej) => {
    uni.saveFile({
      tempFilePath,
      success: function (res) {
        ok(res.savedFilePath)
      },
      fail: function (err) {
        rej(err)
      },
    })
  })
}

// 使用微信fileManager实现保存，这样会有文件名
export const wxSaveFileToDisk = async (tempFilePath: string, options?: IDownloadFileOptions) => {
  // @ts-ignore
  if (!wx) {
    // console.log('not in wx env')
    return ''
  }
  // @ts-ignore
  const rootPath = (wx as any)?.env?.USER_DATA_PATH
  if (!rootPath) {
    return ''
  }
  const downLoadPath = 'download'
  const distPath = `${rootPath}/${downLoadPath}`
  // 校验文件夹是否存在
  try {
    await access(distPath)
  } catch (e: any) {
    if (e.errMsg?.includes('no such file or directory')) {
      // 创建文件夹
      await mkdir(distPath)
    } else {
      throw e
    }
  }
  // 保存文件
  const fileName = options?.fileName || tempFilePath.substring(tempFilePath.lastIndexOf('/') + 1)
  const fileExtension = options?.fileType || fileName.substring(fileName.lastIndexOf('.') + 1)
  const fileNameToUse = fileName.indexOf('.') > -1 ? fileName : `${fileName}.${fileExtension}`
  const savePath = `${distPath}/${fileNameToUse}`
  try {
    return await saveFile(tempFilePath, savePath)
  } catch (e) {
    console.error('[wxSaveFileToDisk] 保存文件失败', e)
    throw e
  }
}

function saveFile(tempFilePath: string, filePath: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    const fm = uni.getFileSystemManager()
    fm.saveFile({
      tempFilePath,
      filePath,
      success: function (res: any) {
        // res.savedFilePath为已经保存好的文件路径
        resolve(res.savedFilePath || '')
      },
      fail: function (err: any) {
        reject(err)
      },
    })
  })
}

function access(path: string): Promise<void> {
  return new Promise(function (resolve, reject) {
    const fm = uni.getFileSystemManager()
    // https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.access.html
    fm.access({
      path,
      success: function () {
        resolve()
      },
      fail: function (err: any) {
        reject(err)
      },
    })
  })
}

function mkdir(path: string): Promise<void> {
  return new Promise(function (resolve, reject) {
    let fm = uni.getFileSystemManager()
    // https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.mkdir.html
    fm.mkdir({
      dirPath: path,
      recursive: true,
      success: function () {
        resolve()
      },
      fail: function (err: any) {
        reject(err)
      },
    })
  })
}

// 真机app下载文件到Download文件夹
// 相关文档：https://www.dcloud.io/docs/api/zh_cn/io.html
async function downloadFileInApp(
  url: string,
  options?: { fileName?: string; disabledLoading?: boolean },
): Promise<string> {
  return await new Promise(async ok => {
    if (options?.disabledLoading !== false) {
      uni.showLoading({
        title: '下载中...',
      })
    }
    const fileName = options?.fileName || url.substring(url.lastIndexOf('/') + 1)
    const filePathToSave = `file://storage/emulated/0/Download/${fileName}`
    // 先通过plus.io查看filePathToSave是否存在，如果存在,那么不启用下载，直接返回文件路径
    const fileCheck = await new Promise(findFileOk => {
      plus.io.resolveLocalFileSystemURL(
        filePathToSave,
        function (entry) {
          // console.log("文件已存在")
          findFileOk(entry.toLocalURL())
        },
        function (e) {
          // console.log("文件不存在")
          findFileOk('')
        },
      )
    })
    if (fileCheck) {
      uni.hideLoading()
      return ok(fileCheck as string)
    }
    const dtask = plus.downloader.createDownload(
      url,
      {
        filename: filePathToSave,
      },
      function (d, status) {
        //d为下载的文件对象;status下载状态
        // console.log(d)
        if (status == 200) {
          //下载成功
          // console.log("下载成功")
          //d.filename是文件在保存在本地的相对路径，使用下面的API可转为平台绝对路径
          const fileSaveUrl = plus.io.convertLocalFileSystemURL(d.filename)
          // console.log(fileSaveUrl)
          // console.log(d.filename);
          ok(fileSaveUrl)
          uni.hideLoading()
        } else {
          //下载失败
          // console.log("下载失败")
          plus.downloader.clear() //清除下载任务
          ok('')
          uni.hideLoading()
        }
      },
    )
    dtask.start()
  })
}
