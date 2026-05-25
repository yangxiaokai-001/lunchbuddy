# 饭搭子上线清单

这份目录是专门给 `katey.online` 上线用的副本。

## 你现在要做什么

1. 选部署平台

- 推荐：`Vercel`
- 原因：这套是 Next.js，最省心

2. 准备一个 Postgres 数据库

- 推荐任选一个：
  - Supabase Postgres
  - Neon Postgres
  - 阿里云 RDS PostgreSQL

你拿到的东西只有一个最重要：

- `DATABASE_URL`

格式大概像这样：

```env
DATABASE_URL="postgresql://postgres:password@db-host:5432/fandazi?schema=public"
```

3. 在这个目录创建 `.env.local`

参考 [/.env.example](/Users/katey.yang/Documents/Codex/2026-05-19/fandazi-domain-release/.env.example)

至少填这几个：

```env
DATABASE_URL="你的 Postgres 连接串"
NEXT_PUBLIC_APP_URL="https://katey.online"
SEED_DEMO_USERNAME="demo001"
SEED_DEMO_NICKNAME="饭搭子演示账号"
SEED_DEMO_PASSWORD="1234"
```

4. 初始化数据库

在这个目录运行：

```bash
npm install
npm run db:push
npm run db:seed
```

5. 本地确认上线版能跑

```bash
npm run dev
```

6. 部署到 Vercel

- 把这个目录单独传到一个新 GitHub 仓库
- 在 Vercel 导入这个仓库
- 在 Vercel 项目设置里填环境变量：
  - `DATABASE_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `SEED_DEMO_USERNAME`
  - `SEED_DEMO_NICKNAME`
  - `SEED_DEMO_PASSWORD`

7. 绑定你的域名 `katey.online`

在 Vercel 项目里：

- `Settings`
- `Domains`
- 添加：
  - `katey.online`
  - `www.katey.online`

然后回阿里云配置解析。

常见做法：

- 根域名 `katey.online`：
  - 按 Vercel 提示配置 `A` 记录或 nameserver
- `www.katey.online`：
  - 按 Vercel 提示配置 `CNAME`

## 关于备案

### 如果你部署在 Vercel / 海外 / 中国香港

- 通常不需要工信备案

### 如果你部署在中国大陆服务器

- 需要 ICP 备案

## 我已经先替你做好的改造

- 数据库入口已从 SQLite 改成 Postgres
- 环境变量模板已补齐
- Cookie 名和密码哈希前缀已改成 `饭搭子` 版本
- 加了 `db:migrate:deploy` 脚本
- 加了 `postinstall -> prisma generate`

## 我建议你下一步让我做的事

1. 我继续把这份上线版做成更适合 Vercel 的正式配置
2. 我帮你清理演示账号和种子数据策略
3. 我帮你出一份阿里云域名解析的逐步操作稿
