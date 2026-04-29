---
name: hykj-media-preview
description: "@hykj-js/vue3-element-plus mediaFilePreview(url, options): 函数式调用弹出媒体预览对话框，支持图片/视频/PDF，可选useWindowOpen"
---

# mediaFilePreview — 函数式媒体预览

```ts
import { mediaFilePreview } from '@hykj-js/vue3-element-plus'

// 图片预览
mediaFilePreview('https://example.com/photo.jpg')

// 视频预览
mediaFilePreview('https://example.com/video.mp4', { previewType: 'video' })

// PDF（在新窗口打开）
mediaFilePreview('https://example.com/doc.pdf', { useWindowOpen: true })

// PDF（对话框内嵌预览）
mediaFilePreview('https://example.com/doc.pdf', { previewType: 'pdf' })
```

| 选项 | 说明 |
|------|------|
| `previewType` | `'image'|'video'|'pdf'`，默认按文件扩展名推断 |
| `useWindowOpen` | `true` 时直接 `window.open(url)`，不弹对话框 |
