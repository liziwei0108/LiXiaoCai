# 财咪 Chat 部署指南 - Vercel + Render

## 部署架构
- **前端**: Vercel (免费，自动部署)
- **后端**: Render (免费，750小时/月)
- **数据库**: 阿里云 PostgreSQL (已有)

---

## 第一步：准备工作

### 1.1 代码推送到 GitHub

确保你的代码已经在 GitHub 仓库中：

```bash
# 如果你还没初始化 git
git init
git add .
git commit -m "准备部署"

# 创建 GitHub 仓库并推送
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 1.2 注册账号

1. 访问 [GitHub](https://github.com) - 确保已有账号
2. 访问 [Vercel](https://vercel.com) - 用 GitHub 账号登录
3. 访问 [Render](https://render.com) - 用 GitHub 账号登录

---

## 第二步：配置阿里云数据库

### 2.1 获取数据库连接信息

从你的阿里云 PostgreSQL 控制台获取以下信息：

- **Host**: 阿里云数据库连接地址
- **Port**: `5432`
- **Database**: 数据库名
- **Username**: 用户名
- **Password**: 密码

### 2.2 配置数据库白名单

在阿里云数据库控制台，将 Render 的 IP 添加到白名单：

**获取 Render 出口 IP 的方法：**

1. 临时部署后端（可以先使用 `0.0.0.0/0` 让 Render 能连接）
2. 访问 `https://你的后端域名.onrender.com/api/ip`
3. 页面会显示 Render 的出口 IP 地址
4. 将该 IP 添加到阿里云白名单

**添加白名单步骤：**
1. 进入阿里云 RDS 控制台
2. 找到你的 PostgreSQL 实例
3. 点击 **"数据安全性"** → **"白名单设置"**
4. 添加 Render 的 IP（例如：`43.156.123.45`）
5. 如果有多个 IP，用逗号分隔

> ⚠️ **安全提示**：生产环境不要开放 `0.0.0.0/0`，只允许 Render 的特定 IP

### 2.3 确认表结构已创建

确保你的阿里云数据库中已经创建表


## 第三步：部署后端到 Render

### 3.1 创建 Web Service

1. 在 Render Dashboard 点击 **"New +"**
2. 选择 **"Web Service"**
3. 连接你的 GitHub 仓库
4. 配置如下：

| 配置项 | 值 |
|--------|-----|
| **Name** | `lixiaocai-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | `Free` |

5. 点击 **"Advanced"** 展开高级设置
6. 添加环境变量（见 3.2）
7. 点击 **"Create Web Service"**

### 3.2 配置环境变量

在 Render 的 Web Service 页面，点击 **"Environment"** 标签，添加以下变量：

```
# ==========================================
# 必需配置（部署时必须填写）
# ==========================================

# 数据库配置（阿里云数据库）
DB_HOST=你的阿里云数据库地址
DB_PORT=5432
DB_NAME=你的数据库名
DB_USER=你的数据库用户名
DB_PASSWORD=你的数据库密码

# AI API 密钥（阿里云魔搭）
DASHSCOPE_API_KEY=你的阿里云API密钥

# JWT 密钥（生产环境请修改为随机长字符串，至少32位）
JWT_SECRET=your_jwt_secret

# 环境标识（production 会启用严格 CORS）
NODE_ENV=production

# 前端域名（配置后只允许该域名访问 API）
FRONTEND_URL=https://your-frontend.vercel.app
```

### 3.3 等待部署完成

- 点击 **"Deploy"** 开始部署
- 等待构建完成（约 2-3 分钟）
- 看到 **"Your service is live"** 表示成功
- 记录下你的后端域名（例如：`https://lixiaocai-backend.onrender.com`）

**⚠️ 注意**: Render 免费版会在 15 分钟无访问后休眠，首次访问可能需要等待 30 秒唤醒。

---

## 第四步：部署前端到 Vercel

### 4.1 导入项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New..."** → **"Project"**
3. 导入你的 GitHub 仓库
4. 如果提示，授权 Vercel 访问你的仓库

### 4.2 配置项目

在配置页面设置：

| 配置项 | 值 |
|--------|-----|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build`（默认） |
| **Output Directory** | `dist`（默认） |

### 4.3 添加环境变量

点击 **"Environment Variables"** 展开，添加：

```
VITE_API_URL=https://你的后端域名.onrender.com
```

例如：
```
VITE_API_URL=https://lixiaocai-backend.onrender.com
```

### 4.4 部署

1. 点击 **"Deploy"**
2. 等待构建完成（约 1-2 分钟）
3. 看到 **"Congratulations!"** 表示成功
4. 点击 **"Continue to Dashboard"**
5. 记录下你的前端域名（例如：`https://lixiaocai.vercel.app`）

---

## 第五步：配置 CORS（重要）

### 5.1 更新后端环境变量

回到 Render Dashboard：

1. 进入你的后端服务 `lixiaocai-backend`
2. 点击 **"Environment"** 标签
3. 找到 `FRONTEND_URL` 变量
4. 填入你的 Vercel 域名：
   ```
   FRONTEND_URL=https://你的前端域名.vercel.app
   ```
5. 点击 **"Save Changes"**
6. Render 会自动重新部署（等待 1-2 分钟）

---

## 第六步：验证部署

### 6.1 检查前端

1. 访问你的 Vercel 域名（例如 `https://lixiaocai.vercel.app`）
2. 应该能看到财咪 Chat 的欢迎页面
3. 尝试发送一条消息，看是否能正常回复

### 6.2 检查后端

1. 访问 `https://你的后端域名.onrender.com/api/conversations`
2. 应该返回 `401` 或 `[]`（表示 API 正常工作）

### 6.3 检查数据库

1. 注册一个新账号
2. 发送几条消息
3. 检查阿里云数据库中数据是否正常写入

---

## 常见问题排查

### 问题 1：前端显示 "无法连接到服务器"

**原因**: CORS 配置不正确或后端未启动

**解决**:
1. 检查 Render 的 `FRONTEND_URL` 是否设置正确
2. 检查 `VITE_API_URL` 是否指向正确的后端地址
3. 查看 Render 日志是否有错误

### 问题 2：数据库连接失败

**原因**: 阿里云数据库白名单或环境变量配置错误

**解决**:
1. 检查阿里云数据库白名单是否包含 Render 的 IP
2. 检查 Render 的环境变量是否和阿里云数据库信息一致
3. 注意使用 `DB_USER`（不是 `DB_USERNAME`）
4. 密码不要有特殊字符，如果有需要用引号包裹

### 问题 3：AI 回复失败

**原因**: AI API Key 配置错误

**解决**:
1. 检查 `AI_API_KEY` 是否有效
2. 检查 `AI_BASE_URL` 是否正确
3. 查看 Render 日志中的具体错误信息

### 问题 4：笔记功能无法使用

**原因**: 笔记表没有创建或 embedding 字段问题

**解决**:
1. 确认阿里云数据库中已执行建表 SQL
2. 确认已创建 pgvector 扩展：
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

---

## 自定义域名（可选）

### Vercel 自定义域名

1. 进入 Vercel 项目 → **"Settings"** → **"Domains"**
2. 输入你的域名（例如：`chat.yourdomain.com`）
3. 按提示添加 DNS 记录
4. 等待 SSL 证书自动生成

---

## 更新部署

### 前端更新

每次推送到 GitHub 主分支，Vercel 会自动重新部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

### 后端更新

Render 也会自动检测 GitHub 推送并重新部署。

### 环境变量更新

如果修改了环境变量：
1. 在 Render/Vercel 后台修改
2. 服务会自动重新部署

---

## 费用说明

| 服务 | 费用 |
|------|------|
| Vercel | 免费（无限流量）|
| Render | 免费（750小时/月，15分钟无访问休眠）|
| 阿里云 PostgreSQL | 按阿里云计费 |

**注意**: Render 免费版会在 15 分钟无访问后休眠，首次访问有 30 秒延迟。

---

## 需要帮助？

1. Render 文档: https://render.com/docs
2. Vercel 文档: https://vercel.com/docs
3. 查看 Render/Vercel 的日志页面排查错误
