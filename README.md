# 鹿迹 (StagTrace)

鹿角蕨生长记录 PWA 应用。专为鹿角蕨爱好者设计的移动端 Web 应用，支持植物档案管理、拍照记录、时间轴展示、生长可视化 GIF 合成、光照检测、浇水打卡等核心功能。

## 技术栈

- **前端框架**: React 18 + React Router v6
- **样式方案**: Tailwind CSS 3
- **构建工具**: Vite 5
- **状态管理**: Zustand
- **本地存储**: IndexedDB (idb 库)
- **PWA 支持**: vite-plugin-pwa + Workbox
- **图片处理**: Canvas API (压缩 + GIF 合成)
- **通知推送**: Notification API + Service Worker

## 功能特性

### 1. 植物档案管理
- 添加和管理多株鹿角蕨
- 字段：品种名称、昵称、来源、购入价格、备注
- 支持删除单株植物及其所有关联记录

### 2. 拍照记录与时间轴
- 支持调用后置摄像头或从相册选取
- 自动时间戳记录
- 时间轴按时间倒序展示，含缩略图
- 点击缩略图可预览大图

### 3. 生长可视化
- 将历史照片合成为 GIF 动图（生长延时效果）
- 可调节帧间延迟
- 支持下载导出

### 4. 里程碑标记
- 手动标记关键节点（首次出盾叶、首次出孢子叶、分株等）
- 时间轴上高亮显示里程碑

### 5. 光照检测
- 调用 AmbientLightSensor API 检测环境光照
- < 3000 Lux 提示补光
- > 25000 Lux 提示遮阴
- 拍照时实时显示光照等级

### 6. 浇水打卡
- 记录浇水/浸盆时间
- 计算距上次浇水天数
- 根据季节推荐浇水间隔（夏季 5-7 天，冬季 10-14 天）
- 临近浇水期高亮提示

### 7. 周提醒推送
- 可设置每周固定时间推送提醒
- 提醒文案："该给你的鹿角蕨拍照啦！"
- 支持开启/关闭提醒开关

### 8. PWA 离线支持
- Service Worker 离线缓存
- 可添加到主屏幕（Android/iOS）
- 离线可查看已有记录

## 项目结构

```
stagtrace/
├── public/
│   ├── icons/              # PWA 图标
│   │   ├── icon-192.png
│   │   └── icon-512.png
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # 全局布局（导航 + Header）
│   │   ├── PlantCard.jsx       # 植物列表卡片
│   │   ├── Timeline.jsx        # 时间轴组件
│   │   ├── PhotoCapture.jsx    # 拍照组件
│   │   ├── WateringTracker.jsx # 浇水打卡组件
│   │   └── GifGenerator.jsx    # GIF 生成组件
│   ├── db/
│   │   └── indexedDB.js        # IndexedDB 数据层
│   ├── store/
│   │   └── useStore.js         # Zustand 状态管理
│   ├── utils/
│   │   ├── photo.js            # 图片处理工具
│   │   ├── gif.js              # GIF 合成工具
│   │   └── notifications.js    # 通知推送工具
│   ├── pages/
│   │   ├── Home.jsx            # 首页（植物列表）
│   │   ├── AddPlant.jsx        # 添加植物
│   │   ├── PlantDetail.jsx     # 植物详情（时间轴+功能）
│   │   └── Settings.jsx        # 设置页（提醒配置）
│   ├── App.jsx                 # 路由配置
│   ├── main.jsx                # 入口文件
│   └── index.css               # 全局样式
├── scripts/
│   └── generate-icons.js       # 图标生成脚本
├── index.html                  # HTML 模板
├── vite.config.js              # Vite 配置（含 PWA 插件）
├── tailwind.config.js          # Tailwind 配置
├── postcss.config.js           # PostCSS 配置
└── package.json
```

## 本地开发

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 华为手机添加到主屏幕

1. 在华为浏览器中打开部署后的网址
2. 点击浏览器底部菜单栏的「...」更多按钮
3. 选择「添加到主屏幕」
4. 确认应用名称「鹿迹」，点击「添加」
5. 主屏幕上会出现鹿迹图标，点击即可像原生 App 一样使用

## 数据隐私

所有数据（植物信息、照片、浇水记录等）**仅存储于浏览器本地 IndexedDB**，不上传至任何服务器，无需注册登录。

## 部署（GitHub + Vercel）

1. 将项目推送到 GitHub 仓库
2. 在 Vercel 中导入该仓库
3. Vercel 自动检测 Vite 项目并配置构建命令
4. 部署完成后获得 `*.vercel.app` 域名
5. 后续推送代码到 GitHub 会自动触发 Vercel 重新部署
