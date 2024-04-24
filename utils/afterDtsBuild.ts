// 这里写一个逻辑，用于在dts文件生成后，对入口文件index.d.ts进行global声明的补充
// 原理是拿到map的路径中有dist/components/xxx/index.d.ts的路径，确定是组件名称和组件dist路径
// 检测源码./components/xxx/global-extend.d.ts文件是否存在，如果存在，就复制到dist/components/xxx/global-extend.d.ts
// 并向index.d.ts中添加export *  './components/xxx/global-extend.d.ts'
import fs from 'fs'
import {join,normalize} from 'path'

const buildRoot = process.cwd()

// 检查global-extend.d.ts文件并移动到dist
export const checkGlobalExtendAfterDtsBuild = (map: Map<string, string>)=>{
  console.log('检查global-extend.d.ts文件...')
  // 待检测的path, 默认的，加入了./components/的路径
  const checkPaths = [
    normalize(join(buildRoot, 'components')), 
    ]
  for (let [key, value] of map) {
    if (key.includes('dist/components/')) {
      const componentName = key.split('dist/components/')[1].split('/')[0]
      // 是.d.ts的跳过，说明这些模块在component根目录
      if(componentName.includes('.d.ts')){
        continue
      }
      const pathToCheck = join(buildRoot, 'components', componentName)
      // 已经存在的跳过
      if(checkPaths.includes(pathToCheck)){
        continue;
      }
      checkPaths.push(pathToCheck) 
    }
  }
  // 检查global-extend.d.ts文件是否存在
  let hasGlobalExtend = false
  const globalExtendComponents = [] as string[];
  checkPaths.forEach(path=>{
    const globalExtendPath = join(path, 'global-extend.d.ts')
    if(fs.existsSync(globalExtendPath)){
      const distGlobalExtendPath = join(path.replace('components', 'dist/components'), 'global-extend.d.ts')
      fs.copyFileSync(globalExtendPath, distGlobalExtendPath)
      // console.log(`复制global-extend.d.ts文件到${distGlobalExtendPath}`)
      // index.d.ts入口 在 ./dist/index.d.ts下，引入对应模块的global-extend.d.ts
      // 根据path确定模块，如引入 export * from './components/xxx/global-extend.d.ts'
      const indexDtsPath = join(buildRoot, 'dist', 'index.d.ts')
      const indexDtsContent = fs.readFileSync(indexDtsPath, 'utf-8')
      // 先加一行空行和注释
      if(!hasGlobalExtend){
        fs.appendFileSync(indexDtsPath, '\n// global-extend.d.ts\n')
        hasGlobalExtend = true
      }
      // window上的路径分隔符是\，这里为了兼容，直接slice(1)，去掉第一个/或者\
      const componentName = path.split('components')[1].slice(1)
      const importPath = `export * from './components/${componentName}/global-extend'\n`
      if(indexDtsContent.includes(importPath)){
        // console.log(`已存在${importPath}，跳过`)
        return
      }
      fs.appendFileSync(indexDtsPath, importPath)
      globalExtendComponents.push(componentName)
    }
  })
  if(globalExtendComponents.length !== 0){
    console.log(`写入global-extend的组件:`, globalExtendComponents)
    
  }
}