# wx.auntiechen.com 部署配置

## 文件

- `nginx/wx.auntiechen.com.conf` — Nginx 反代配置（HTTP，证书由 certbot 自动补全）
- `.env.wx.auntiechen.com` — Docker 环境变量示例

## 步骤

```bash
# 1) 启动 Docker 展示站（端口 4175）
cp .env.wx.auntiechen.com .env
docker compose up --build -d
curl -I http://127.0.0.1:4175/

# 2) 安装 Nginx 站点配置
sudo cp nginx/wx.auntiechen.com.conf /etc/nginx/conf.d/wx.auntiechen.com.conf
sudo nginx -t && sudo systemctl reload nginx

# 3) 申请 HTTPS（certbot 会自动改 nginx 并跳转 https）
sudo certbot --nginx -d wx.auntiechen.com

# 4) 验证
curl -I https://wx.auntiechen.com/
```
