# 服务器部署指南

## 阿里云ECS部署

### 1. 服务器准备

```bash
# 更新系统
sudo yum update -y  # CentOS
# 或
sudo apt update && sudo apt upgrade -y  # Ubuntu

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs  # CentOS
# 或
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs  # Ubuntu

# 安装PM2
sudo npm install -g pm2

# 安装Git
sudo yum install -y git  # CentOS
# 或
sudo apt install -y git  # Ubuntu
```

### 2. 部署应用

```bash
# 克隆代码
cd /var/www
sudo git clone https://github.com/your-username/thai-learning-cards.git
cd thai-learning-cards

# 安装依赖
sudo npm install --production

# 创建必要目录
sudo mkdir -p data logs backups

# 设置权限
sudo chown -R $USER:$USER /var/www/thai-learning-cards

# 启动应用
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save
```

### 3. 配置Nginx反向代理

```bash
# 安装Nginx
sudo yum install -y nginx  # CentOS
# 或
sudo apt install -y nginx  # Ubuntu

# 创建配置文件
sudo vim /etc/nginx/conf.d/thai-cards.conf
```

Nginx配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 静态文件
    location / {
        root /var/www/thai-learning-cards;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 测试配置
sudo nginx -t

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. 数据备份设置

```bash
# 创建备份脚本
echo '0 2 * * * cd /var/www/thai-learning-cards && npm run backup' | sudo crontab -

# 手动创建备份
npm run backup
```

### 5. 监控和维护

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs thai-learning-cards

# 重启应用
pm2 restart thai-learning-cards

# 更新代码
git pull origin main
npm install --production
pm2 reload thai-learning-cards
```

## 安全配置

### 防火墙设置
```bash
# 开放必要端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### SSL证书配置
```bash
# 安装Certbot
sudo yum install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 数据目录结构

```
/var/www/thai-learning-cards/
├── data/                   # 持久化数据
│   ├── level_1.json
│   ├── level_2.json
│   ├── level_3.json
│   └── level_4.json
├── backups/                # 备份文件
│   └── backup_*.json
├── logs/                   # 应用日志
│   ├── err.log
│   ├── out.log
│   └── combined.log
└── ...                     # 应用文件
```

## 故障排查

### 常见问题
1. **端口冲突**: 检查3000端口是否被占用
2. **权限问题**: 确保应用有读写data目录的权限
3. **内存不足**: 监控服务器内存使用情况

### 日志查看
```bash
# PM2日志
pm2 logs

# Nginx日志
sudo tail -f /var/log/nginx/error.log

# 系统日志
sudo journalctl -u nginx -f
```