# 陈阿姨到家 · 国内主体展示站（cn-showcase）

基于 `base` 精简的**前端展示站**：

- 完整营销页面（首页 / 服务 / 关于 / FAQ / 售后 / 预约表单 UI / 加入我们 / 博客 / 政策）
- **仅国内主体信息**（占位符，需替换）
- **无后台管理系统**
- **无在线支付 / 订单 / Airwallex / API**
- CMS 内容使用本地 `data/cms-defaults.ts` 静态数据

## 替换国内主体信息

编辑：

```ts
// lib/company-identity.ts
export const companyIdentity = {
  legalName: "杭州陈阿姨到家品牌管理有限公司",
  registeredOffice: "浙江省杭州市余杭区仓前街道文一西路1218号4幢501-11室",
  contactEmail: "auntiechenhome@gmail.com",
  // 不展示联系电话
  // ...
}
```

联系页、页脚、政策页会自动读取该文件。

## 本地运行

```bash
cd cn-showcase
pnpm install
pnpm dev
# http://localhost:3001
```

## 与 base 的差异

| 项目 | base | cn-showcase |
|------|------|-------------|
| 主体 | 香港 AUNTIE CHEN HOME SOLUTIONS LIMITED | 国内主体占位 |
| 后台 `/admin` | 有 | 无 |
| 支付 `/checkout` | Airwallex | 无 |
| API | 有 | 无 |
| 内容来源 | CMS API + 默认值 | 仅本地默认值 |
| 预约表单 | 可创建支付订单 | 仅前端演示提交 |

## Docker 一键打包

```bash
cd cn-showcase
pnpm install
pnpm package:docker
```

成功后会在 `release/` 生成：

```text
release/auntie-chen-cn-showcase-YYYYMMDDHHMMSS.tar.gz
```

服务器部署：

```bash
tar -xzf auntie-chen-cn-showcase-*.tar.gz
cd auntie-chen-cn-showcase-*
cp .env.example .env
docker compose up --build -d
# 默认访问 http://服务器IP:4175
```

可选环境变量：

```env
APP_PORT=4175
PUBLIC_SITE_URL=https://your-domain.com
```
