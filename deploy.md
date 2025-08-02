# 部署指南

## 快速部署到GitHub Pages

### 1. 准备GitHub仓库
```bash
# 克隆或下载项目
git clone https://github.com/your-username/thai-learning-cards.git
cd thai-learning-cards

# 或者创建新仓库
git init
git remote add origin https://github.com/your-username/thai-learning-cards.git
```

### 2. 推送代码
```bash
git add .
git commit -m "Initial commit: Thai learning cards application"
git push -u origin main
```

### 3. 启用GitHub Pages
1. 进入GitHub仓库页面
2. 点击 Settings 标签
3. 滚动到 Pages 部分
4. Source 选择 "Deploy from a branch"
5. Branch 选择 "main"
6. 文件夹选择 "/ (root)"
7. 点击 Save

### 4. 访问应用
几分钟后，访问：`https://your-username.github.io/thai-learning-cards`

## 其他部署选项

### Netlify
1. 拖拽整个项目文件夹到 Netlify 部署页面
2. 或连接GitHub仓库自动部署

### Vercel
1. 导入GitHub仓库到Vercel
2. 保持默认设置，点击部署

### 阿里云OSS
1. 创建OSS存储桶
2. 上传所有文件到存储桶
3. 启用静态网站托管
4. 配置index.html作为默认页面

## 自定义域名配置

### GitHub Pages
1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为您的域名：`yourdomain.com`
3. 在域名DNS设置中添加CNAME记录指向：`your-username.github.io`

### 其他平台
参考各平台的域名配置文档。

## 注意事项

- 这是纯静态网站，无需服务器端配置
- 所有功能都在客户端运行
- 支持HTTPS和现代浏览器
- 移动设备完全兼容

## 版本更新

当有新版本时：
```bash
git pull origin main  # 获取最新代码
git add .
git commit -m "Update to latest version"
git push origin main  # 推送更新
```

GitHub Pages会自动重新部署。