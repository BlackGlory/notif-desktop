# unotifier-desktop

## 动机

该项目通过Electron为桌面平台提供高度一致的通知功能, 其原因在于桌面操作系统的原生通知功能难以使用:
- 不同平台支持的通知功能特性不同, 使得跨平台API难以成立.
- 一些平台存在着足以影响交互的差异性: Windows 10有着功能丰富的通知API, 却无法允许单个应用同时显示多个通知.
- 对数据类型有严格限制: 一些平台限制了图片的分辨率, 文件大小, 文件类型.
- 一些桌面环境没有实现通知.
