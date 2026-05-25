# 用 Supabase + Vercel 上线饭搭子

这份是最推荐的路线，因为最省心。

## 第一步：建 Supabase 数据库

1. 打开 [Supabase](https://supabase.com/)
2. 注册 / 登录
3. 新建一个 project
4. 等数据库初始化完成
5. 进入：
   - `Project Settings`
   - `Database`
6. 找到连接串

你最终要的是：

- `DATABASE_URL`

建议拿 `URI` 或 `Connection string`，格式一般像：

```env
postgresql://postgres:密码@db.xxx.supabase.co:5432/postgres
```

## 第二步：在本地这份上线版配置环境变量

在这个目录新建 `.env.local`：

[/Users/katey.yang/Documents/Codex/2026-05-19/fandazi-domain-release](/Users/katey.yang/Documents/Codex/2026-05-19/fandazi-domain-release)

参考 [/.env.example](/Users/katey.yang/Documents/Codex/2026-05-19/fandazi-domain-release/.env.example)

至少填：

```env
DATABASE_URL="你的 Supabase Postgres 连接串"
NEXT_PUBLIC_APP_URL="https://katey.online"
SEED_DEMO_USERNAME="demo001"
SEED_DEMO_NICKNAME="饭搭子演示账号"
SEED_DEMO_PASSWORD="1234"
```

## 第三步：初始化数据库

在这个目录运行：

```bash
npm run db:push
npm run db:seed
```

这样会：

- 把表结构推到 Supabase
- 建一个演示账号
- 建一个默认群组和样例外卖池

## 第四步：把上线版传到 GitHub

建议新建一个独立仓库，只放这份目录。

## 第五步：Vercel 部署

1. 打开 [Vercel](https://vercel.com/)
2. 导入你的 GitHub 仓库
3. Framework 选 Next.js
4. 在 Environment Variables 里填：
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `SEED_DEMO_USERNAME`
   - `SEED_DEMO_NICKNAME`
   - `SEED_DEMO_PASSWORD`

## 第六步：绑定域名

在 Vercel 项目里：

1. `Settings`
2. `Domains`
3. 添加：
   - `katey.online`
   - `www.katey.online`

Vercel 会告诉你要去阿里云加什么记录。

## 第七步：回阿里云配置解析

你在阿里云域名控制台里找到：

- `katey.online`
- `解析设置`

然后按 Vercel 提示加：

- 根域名通常是 `A` 记录
- `www` 通常是 `CNAME`

## 你部署完成后怎么验证

1. 打开 `https://katey.online`
2. 注册一个新账号
3. 创建群组
4. 新增一条外卖
5. 打开“开今日外卖”
6. 测试打卡

如果这 6 步都通，基本就算上线完成。

## 现在这份代码已经替你准备好的部分

- Prisma 已切到 Postgres
- Vercel 构建可以通过
- 域名元数据入口已经补好
- 环境变量模板已经补好

## 下一步最适合我继续帮你做的

1. 我帮你继续清理“演示数据”和“正式数据”的边界
2. 我帮你补一份“阿里云里具体点哪里”的域名解析操作稿
3. 我帮你把首页再做一轮上线前细节收尾
