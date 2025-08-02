# 泰语学习卡片应用

智能化的泰语学习卡片应用，通过先进技术和交互式设计为语言学习者提供个性化、沉浸式的学习体验。

## 🚀 快速开始

### 本地运行
1. 下载或克隆项目文件
2. 双击打开 `index.html` 文件
3. 即可在浏览器中使用应用

### 使用Web服务器（推荐）
```bash
# 使用Python（如果已安装）
python -m http.server 8080

# 使用Node.js（如果已安装）
npx http-server -p 8080

# 使用PHP（如果已安装）
php -S localhost:8080
```

然后访问 `http://localhost:8080`

## 📦 部署说明

### GitHub Pages部署（推荐）
1. Fork或下载代码到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择main分支作为源
4. 访问 `https://your-username.github.io/repository-name`

### 其他部署选项
- **Netlify**: 拖拽文件夹到Netlify部署页面
- **Vercel**: 连接GitHub仓库自动部署  
- **阿里云OSS**: 上传文件并启用静态网站托管
- **任何静态托管服务**: 直接上传所有文件

详细部署指南请查看 [deploy.md](deploy.md)

## 🛠️ 技术栈

- **前端框架**: React 18 (生产版本，通过CDN加载)
- **样式框架**: Tailwind CSS
- **图标库**: Lucide Icons
- **语音服务**: SoundOfText API + Web Speech API
- **存储**: LocalStorage

## ✨ 功能特性

- 🎓 四级泰语课程体系
- 📚 交互式学习卡片
- 🎵 智能语音播放
- ⌨️ 键盘快捷键支持
- 🌙 深色模式
- 📱 响应式设计
- 📊 学习进度跟踪
- 🔧 文件管理功能
- 📥 文件下载功能（SVG图片 + 音频）
- 🎯 多重下载方式确保可靠性
- 📊 实时下载进度显示
- 🔄 智能音频生成和缓存

## 📁 项目结构

```
thai-learning-cards/
├── index.html              # 主页面
├── app.js                  # 主应用逻辑
├── package.json            # 项目配置文件
├── README.md               # 项目说明
├── utils/                  # 工具函数
│   ├── storage.js          # 本地存储
│   ├── audio.js            # 音频处理
│   ├── mockData.js         # 示例数据
│   └── zip.js              # 压缩工具
├── components/             # React组件
│   ├── Header.js           # 头部组件
│   ├── LearningCard.js     # 学习卡片
│   ├── CourseCard.js       # 课程卡片
│   ├── ThemeToggle.js      # 主题切换
│   ├── ProgressBar.js      # 进度条
│   └── LoginForm.js        # 登录表单
├── pages/                  # 页面组件
│   ├── CourseSelection.js  # 课程选择
│   ├── Learning.js         # 学习页面
│   ├── CardBrowser.js      # 卡片浏览
│   └── FileManagement.js   # 文件管理
└── trickle/                # 项目文档和规则
    ├── notes/              # 项目说明文档
    ├── rules/              # 开发规则
    └── assets/             # 资源文件记录
```

## 🎮 使用说明

### 学习模式快捷键
- `空格键` / `→`: 下一张卡片
- `←`: 上一张卡片
- `C`: 标记当前卡片为已完成
- `D`: 切换深色/浅色主题
- `H`: 显示/隐藏帮助面板
- `A`: 切换自动翻页模式

### 文件管理
管理员登录信息：
- 用户名: `sanghak.kim`
- 密码: `Nopassw1`

## 🔧 开发说明

本应用是纯前端应用，无需任何构建工具或后端服务器：
- 所有依赖通过CDN加载
- 使用原生JavaScript和React
- 数据存储在浏览器LocalStorage中
- 可直接在现代浏览器中运行

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

---

**注意**: 这是一个纯前端应用，package.json文件主要用于项目信息和部署兼容性，实际运行时不需要npm install。