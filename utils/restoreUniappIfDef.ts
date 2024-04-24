// 这个方法用于build结束后，将platform.ts中的ifDefPlatform方法内容恢复到index.js中
// 否则因为build后的index.js失去了uniapp的条件编译注释导致运行错误
// 函数都是在dts插件的afterBuild中运行

import {readFileSync, writeFileSync} from 'fs'
import {join} from 'path'

const buildRoot = process.cwd()

// 恢复uniapp的ifDefPlatform方法
export const restoreUniappIfDef = () => {
  console.info('开始恢复ifDefPlatform方法...')
  // 1. 拿到index.js
  const indexPath = join(buildRoot, 'dist', 'index.js')
  let indexContent = readFileSync(indexPath, 'utf-8')
  // 2. 拿到platform.ts
  const platformPath = join(buildRoot, 'components', 'config', 'platform.ts')
  let platformContent = readFileSync(platformPath, 'utf-8')
  // 通过正则表达式找到两个文件的ifDefPlatform方法
  const ifDefPlatformReg = /function ifDefPlatform\(\) {([\s\S]*?)}/
  const indexIfDefPlatform = ifDefPlatformReg.exec(indexContent)
  const platformIfDefPlatform = ifDefPlatformReg.exec(platformContent)
  // 进行替换
  if (indexIfDefPlatform && platformIfDefPlatform) {
    indexContent = indexContent.replace(
      indexIfDefPlatform[0],
      platformIfDefPlatform[0]
    )
    // 写入
    writeFileSync(indexPath, indexContent)
    console.info('恢复ifDefPlatform方法成功')
    return
  } else {
    console.error('未找到ifDefPlatform方法')
  }
  console.info('恢复ifDefPlatform方法失败')
}
