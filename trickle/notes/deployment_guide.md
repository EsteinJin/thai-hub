# 部署指南

本文档详细介绍如何将泰语学习卡片应用推送到GitHub并部署到阿里云。

## 1. 推送代码到GitHub

### 1.1 准备工作

首先确保您已经安装了Git并配置了GitHub账户：

```bash
# 检查Git是否已安装
git --version

# 配置Git用户信息（如果尚未配置）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 1.2 创建GitHub仓库

1. 登录GitHub (https://github.com)
2. 点击右上角的"+"按钮，选择"New repository"
3. 填写仓库信息：
   - Repository name: `thai-learning-cards`
   - Description: `智能化泰语学习卡片应用`
   - 选择Public或Private
   - 不要勾选"Initialize this repository with a README"
4. 点击"Create repository"

### 1.3 初始化本地仓库并推送

在项目根目录执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加所有文件到暂存区
git add .

# 创建首次提交
git commit -m "Initial commit: Thai learning cards application"

# 添加远程仓库地址（替换为您的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/thai-learning-cards.git

# 推送到GitHub
git push -u origin main
```

### 1.4 后续更新推送

当您修改代码后，使用以下命令推送更新：

```bash
# 添加修改的文件
git add .

# 创建提交
git commit -m "描述您的修改内容"

# 推送到GitHub
git push origin main
```

## 2. 部署到阿里云

### 2.1 选择部署方式

推荐以下几种部署方式：

#### 方式一：阿里云ECS + Nginx（推荐）
- 成本较低
- 完全控制服务器
- 适合长期运行

#### 方式二：阿里云OSS静态网站托管
- 成本最低
- 配置简单
- 适合纯静态网站

#### 方式三：阿里云函数计算
- 按需付费
- 自动扩缩容
- 适合流量波动大的应用

### 2.2 方式一：ECS + Nginx 部署

#### 2.2.1 购买ECS实例

1. 登录阿里云控制台 (https://ecs.console.aliyun.com)
2. 点击"创建实例"
3. 选择配置：
   - 实例规格：ecs.t6-c1m1.large（1核2GB，适合小型应用）
   - 镜像：CentOS 8.4 或 Ubuntu 20.04
   - 网络：默认VPC
   - 安全组：开放22(SSH)、80(HTTP)、443(HTTPS)端口
4. 设置登录密码
5. 完成购买

#### 2.2.2 连接ECS实例

```bash
# 使用SSH连接到ECS（替换为您的公网IP）
ssh root@YOUR_ECS_PUBLIC_IP
```

#### 2.2.3 安装Nginx

**CentOS系统：**
```bash
# 更新系统
yum update -y

# 安装Nginx
yum install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx
```

**Ubuntu系统：**
```bash
# 更新系统
apt update -y

# 安装Nginx
apt install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx
```

#### 2.2.4 部署应用

```bash
# 安装Git
yum install -y git  # CentOS
# 或
apt install -y git  # Ubuntu

# 克隆项目到服务器
cd /var/www
git clone https://github.com/YOUR_USERNAME/thai-learning-cards.git

# 设置文件权限
chown -R nginx:nginx thai-learning-cards
chmod -R 755 thai-learning-cards
```

#### 2.2.5 配置Nginx

编辑Nginx配置文件：

```bash
# 创建站点配置文件
vim /etc/nginx/conf.d/thai-learning.conf
```

添加以下配置内容：

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;
    
    root /var/www/thai-learning-cards;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 处理单页应用路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

重启Nginx：

```bash
# 测试配置文件语法
nginx -t

# 重启Nginx
systemctl restart nginx
```

### 2.3 方式二：OSS静态网站托管

#### 2.3.1 创建OSS Bucket

1. 登录阿里云OSS控制台 (https://oss.console.aliyun.com)
2. 点击"创建Bucket"
3. 填写配置：
   - Bucket名称：`thai-learning-cards-web`
   - 地域：选择离用户最近的地域
   - 存储类型：标准存储
   - 读写权限：公共读
4. 点击"确定"

#### 2.3.2 上传文件

1. 进入创建的Bucket
2. 点击"上传文件"
3. 选择项目中的所有文件上传
4. 确保文件结构保持不变

#### 2.3.3 配置静态网站

1. 在Bucket管理页面，点击"基础设置"
2. 找到"静态页面"设置
3. 开启静态网站托管
4. 设置默认首页：`index.html`
5. 设置默认404页面：`index.html`
6. 保存设置

#### 2.3.4 配置自定义域名（可选）

1. 在"传输管理" > "域名管理"中添加自定义域名
2. 在域名服务商处添加CNAME记录指向OSS域名
3. 等待DNS生效

### 2.4 配置HTTPS（推荐）

#### 2.4.1 申请SSL证书

1. 登录阿里云SSL证书控制台
2. 申请免费DV证书
3. 按照指引完成域名验证
4. 下载证书文件

#### 2.4.2 配置Nginx HTTPS

将证书文件上传到服务器：

```bash
# 创建证书目录
mkdir -p /etc/nginx/ssl

# 上传证书文件到该目录
# your_domain.pem (证书文件)
# your_domain.key (私钥文件)
```

修改Nginx配置：

```nginx
server {
    listen 80;
    server_name your_domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your_domain.com;
    
    ssl_certificate /etc/nginx/ssl/your_domain.pem;
    ssl_certificate_key /etc/nginx/ssl/your_domain.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_prefer_server_ciphers on;
    
    root /var/www/thai-learning-cards;
    index index.html;
    
    # 其他配置保持不变...
}
```

### 2.5 域名配置

#### 2.5.1 购买域名

1. 在阿里云域名控制台购买域名
2. 完成实名认证
3. 等待审核通过

#### 2.5.2 配置DNS解析

1. 进入云解析DNS控制台
2. 添加A记录：
   - 主机记录：@（根域名）或 www
   - 记录值：ECS公网IP地址
   - TTL：10分钟

### 2.6 性能优化

#### 2.6.1 开启CDN加速

1. 登录阿里云CDN控制台
2. 添加加速域名
3. 配置源站为ECS公网IP或OSS域名
4. 开启HTTPS和HTTP/2
5. 配置缓存规则

#### 2.6.2 监控和日志

```bash
# 查看Nginx访问日志
tail -f /var/log/nginx/access.log

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log

# 查看系统资源使用情况
htop
```

## 3. 自动化部署

### 3.1 创建部署脚本

创建 `deploy.sh` 脚本：

```bash
#!/bin/bash

echo "开始部署泰语学习应用..."

# 进入项目目录
cd /var/www/thai-learning-cards

# 备份当前版本
cp -r . ../thai-learning-cards-backup-$(date +%Y%m%d_%H%M%S)

# 拉取最新代码
git pull origin main

# 设置权限
chown -R nginx:nginx .
chmod -R 755 .

# 重启Nginx
systemctl reload nginx

echo "部署完成！"
```

### 3.2 使用GitHub Actions自动部署

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Alibaba Cloud

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        password: ${{ secrets.PASSWORD }}
        script: |
          cd /var/www/thai-learning-cards
          git pull origin main
          chown -R nginx:nginx .
          chmod -R 755 .
          systemctl reload nginx
```

## 4. 故障排查

### 4.1 常见问题

**问题1：无法访问网站**
- 检查安全组是否开放80/443端口
- 检查Nginx是否正常运行：`systemctl status nginx`
- 查看Nginx错误日志

**问题2：静态资源404**
- 检查文件路径和权限
- 确认Nginx配置中的root路径正确

**问题3：HTTPS证书问题**
- 检查证书文件路径和权限
- 验证证书是否过期

### 4.2 性能监控

```bash
# 安装监控工具
yum install -y htop iotop nethogs

# 监控系统资源
htop

# 监控网络使用
nethogs

# 检查磁盘使用
df -h
```

## 5. 维护和更新

### 5.1 定期备份

```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backup/thai-learning-$DATE.tar.gz /var/www/thai-learning-cards
```

### 5.2 日志轮转

配置日志轮转避免日志文件过大：

```bash
# 编辑logrotate配置
vim /etc/logrotate.d/nginx
```

### 5.3 安全更新

```bash
# 定期更新系统
yum update -y  # CentOS
apt update && apt upgrade -y  # Ubuntu
```

## 6. 成本估算

### 6.1 ECS方案
- ECS实例：约¥30-50/月
- 公网带宽：约¥10-30/月
- 域名：约¥50-100/年
- SSL证书：免费

### 6.2 OSS方案
- 存储费用：约¥1-5/月
- 流量费用：约¥5-20/月
- 域名：约¥50-100/年

总体而言，OSS方案更适合小型静态网站，ECS方案更适合需要服务器端功能的应用。