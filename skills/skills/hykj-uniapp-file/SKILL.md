---
name: hykj-uniapp-file
description: "@hykj-js/uniapp 文件能力: downloadFile(url)下载到本地临时路径、getStaticFile(relativePath)获取static资源绝对路径"
---

# uniapp 文件工具

```ts
import { downloadFile, getStaticFile } from '@hykj-js/uniapp'

// 下载远程文件到本地临时路径（返回 localPath）
const localPath = await downloadFile('https://example.com/file.pdf')

// 获取 static 目录资源的绝对路径
const logoUrl = getStaticFile('static/img/logo.png')
```
