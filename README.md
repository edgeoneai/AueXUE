### 简介
*AueXUE* 是一个基于cloudflare进行托管，使用R2作为储存源，D1作为数据库的现代化动态博客项目，无需每次更改重新部署项目，实时预览你的更改，同时配套专属obsidian插件，方便在obsidian管理和发布文章，配有一键发布文章的功能，在obsidian打开对应文章点击发布即可直接将文档发布到云端并返回分享链接。
原作者：[AIOVTUE](https://github.com/AIOVTUE/AueXUE)

#### 网站预览
网站样式预览可以前往 **https://daily.yybb.us** 该站点是基于hugo重构，ui界面保持一致，如果对这个感兴趣的话，请看 [Hugo最美主题-aiovtue](posts/hugoTheme-aiovtue)
这里也放几张站点的截图方便预览
![](https://r2tc.20030327.xyz/file/%E5%8D%9A%E5%AE%A2/%E6%96%87%E7%AB%A0/1782137472842_6a3938ff4a893629d992bb61.png)
![](https://r2tc.20030327.xyz/file/%E5%8D%9A%E5%AE%A2/%E6%96%87%E7%AB%A0/1780923255231_1780923153704.png)
具体还是前往站点亲自体验比较好，下面是站点后台管理的样式，这个无法体验，我多几张
![登陆页面](https://r2tc.20030327.xyz/file/%E5%8D%9A%E5%AE%A2/%E6%96%87%E7%AB%A0/NBxHR4aV.png)
![文章页面](https://r2tc.20030327.xyz/file/%E5%8D%9A%E5%AE%A2/%E6%96%87%E7%AB%A0/QlXxCaTn.png)
![友链管理](https://r2tc.20030327.xyz/file/%E5%8D%9A%E5%AE%A2/%E6%96%87%E7%AB%A0/Uvnt7X7L.png)

### 自定义
#### 页面
下面是各个页面的自定义部分位置，首先是文章，由于文章储存在云端，但是在部署的时候会进行一次文章迁移，会将本地文章迁移至云端，因此，本地调试时可以加上想写的文章，不过后续更新文章不要使用这种方式，直接在后台管理即可，具体路径是`\AueXUE\content\posts`文件夹，默认放了两篇文章
同样的，在`\AueXUE\content`文件夹内部还有关于页，相册页，友链页以及公告栏等页面的相关配置，修改相关页面头图标题之类的找到对应`index.md`文件修改即可
#### 其他页面
部分页面只有静态文件，没有放在云端，后续也只需要修改一次，上面那些页面基本都是能在后台管理的，本地改不改都行，只是首次会进行同步，但是这部分的页面并不是，只是一次性的，静态文件，不支持后台修改，但是基本只需要修改一次，使用没有集成到后台，具体路径是`\AueXUE\pages`文件夹下各文件夹，包括分类，标签，等页面，注意，后缀为`.vue`的文件不要修改，只需要找到相应的`index.md`文件修改即可

#### 站点信息
站点信息有两个来源：**后台「站点设置」**（推荐）和**配置文件**。

登录后台 → 左侧「站点设置」，可以修改站点名称、头像、描述、社交链接、主题色、打赏、首页 hero、顶栏/页脚文字、备案号、每页文章数等，**保存后前台刷新即生效**，不需要重新部署。这些值存在 D1 的 `site_settings` 表里，会覆盖下面两个文件中的默认值；点「恢复默认」即回到文件里的值。

仍需要改配置文件的情形：导航菜单项、侧边栏结构、页面布局等结构性配置。

`site.config.ts`文件包含内容如下：
> 站点地址
> 站点标题
> 站点头像
> 站点图标
> 社交图标
> 打赏信息

`valaxy.config.ts`文件包含内容如下：
> 主题色
> 导航页视频链接
> 默认文章封面
> 首页头图文字、背景
> 顶栏信息
> 侧边栏信息
> 页脚计时起始时间
> 页脚备案信息
> 归档页图表起始时间
> 评论配置（twikoo）

以上凡是在后台「站点设置」里出现的项目，优先以数据库中的值为准。

大部分应该都写上去了，可能会漏掉一些~
#### 友链公告
这部分比较特殊，被写死了，所以没再配置文件里面，具体修改位置在`\AueXUE\components\FriendLinkNotice.vue`文件内，具体位置在
```
          本站友链信息如下：
        </p>
        <ul class="friend-link-site-info__list">
          <li>
            站点名称：<span class="friend-link-highlight">AIOVTUE-雪</span>
          </li>
          <li>
            站点链接：<span class="friend-link-highlight">https://live.yybb.us</span>
          </li>
          <li>
            站长头像：<span class="friend-link-highlight">{{ siteInfo.avatar }}</span>
          </li>
          <li>
            站点描述：<span class="friend-link-highlight">雨滴会记录生命中的每一个瞬间</span>
          </li>
          <li>
            站点截图：<span class="friend-link-highlight">https://r2tc.20030327.xyz/file/博客/主题/1780909850378_1780909790262.png</span>
          </li>
```
具体在这部分，正常情况会自动获取站点配置，但是部分信息得自己改，修改很简单，直接把对应文字或者链接改为自己的即可

### 部署
#### 本地部署预览
##### 环境变量
部署之前需要配置环境变量，先将根目录`.dev.vars.example`文件复制一份，重命名为`.dev.vars`，然后在里面按需配置信息即可，包含如下内容
```
WEBDAV_PASSWORD=你的webdav密码
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_API_TOKEN=yourAPItoken
SITE_URL=https://你的网站地址
```
webdav密码，不使用云端相册可以不配置，账号密码必须要，否则打不开后台，apiToken尽量配置长一点复杂一点，用来在obsidian插件进行认证，请务必不要泄露这些信息，上传github仓库也请不要将环境变量一起上传，或者干脆将仓库设为私有，最保险
##### 安装依赖
使用命令安装依赖
```
pnpm install
```
或者
```
npm install
```
可能需要特殊网络环境，注意最好使用管理员身份打开终端，不然容易报错

##### 运行预览
预览命令如下

| 命令                    | 端口   | 说明                                                  |
| --------------------- | ---- | --------------------------------------------------- |
| `npm run dev`         | 4859 | Vite 热更新；API 走本地 `content/` 插件，**与云端行为不完全一致**       |
| `npm run dev:cf`      | 8788 | **推荐**：构建 + 自动建表并导入 `content/` 到本地 D1/R2 + `wrangler dev`，等同云端 |
| `npm run dev:cf:lite` | 8788 | 仅重建前端并启动 wrangler，**跳过内容导入**（改样式/UI 时用）             |
说一下区别，`npm run dev:cf` 命令是本地全量预览，会自动把 `content/` 里的文章、友链、关于页、相册、公告栏导入到本地预览的 R2 和 D1 中，不需要逐条执行导入命令；`npm run dev:cf:lite` 和上一个命令一样，但会跳过导入部分，大大加快预览速度，首次建议 `npm run dev:cf`，后续使用 `npm run dev:cf:lite` 即可
要是想删除本地数据库数据，可以使用后台手动删除，也可以直接删除`AueXUE\.wrangler\state`
文件夹下所有文件，然后重新执行全量命令即可。

#### 云端部署
云端部署分为两种方式，终端部署和网页部署，终端部署比较简单，推荐终端

> 本项目部署为 **Cloudflare Workers**（不是 Pages）。Worker 既提供 `/api/*` 接口，也托管 `dist/` 静态页面。

##### 终端部署
###### 步骤 1：登录 wrangler
```shell
npx wrangler login
```

###### 步骤 2：一条命令完成建库、建桶、建表、导入内容和部署
```shell
npm run cf:deploy
```
这条命令会按顺序自动完成下面 5 件事，中途不需要任何手工操作：

1. 按 `wrangler.toml` 里的 `database_name` 查询 D1：**已有就复用，没有就自动创建**，并把对应的 `database_id` 和 `[[d1_databases]]` 绑定写回 `wrangler.toml`（删库重建后 id 变了也会自动纠正）
2. 按 `bucket_name` 查询 R2：**已有就复用，没有就自动创建**，缺 `[[r2_buckets]]` 绑定段时也会自动补上
3. 应用 `migrations/` 下的全部表结构（已有表会跳过）
4. 把 `content/` 下的文章、友链、关于页、相册、公告栏导入到 R2 + D1
5. 构建站点并部署到 Cloudflare Workers

只想先看看会做什么、不实际动手：
```shell
npm run cf:deploy -- --dry-run
```

###### 步骤 3：常用可选命令
如果不需要全流程，可以按需单独执行：

| 命令 | 作用 |
|---|---|
| `npm run cf:bootstrap` | 只处理绑定：D1/R2 有就复用、没有就创建，并写回 `wrangler.toml` |
| `npm run d1:migrate` | 只应用 `migrations/` 表结构 |
| `npm run content:import` | 只导入 `content/` 内容（自动先建表） |
| `npm run content:import -- --only posts,links` | 只导入指定类型，可选 `posts`/`links`/`about`/`gallery`/`notice` |
| `npm run cf:deploy -- --skip-import` | 内容没变，只建表 + 构建 + 部署 |
| `npm run cf:deploy -- --skip-build` | 复用已有 `dist/`，直接部署 |

导入是全量覆盖式的 upsert（同一篇 slug 会更新而不是重复），所以内容改完随时可以重跑，不需要先清库。

数据库名、桶名都取自 `wrangler.toml`，改名字后不用再改脚本；也可以用环境变量临时覆盖：`D1_DATABASE_NAME`、`R2_BUCKET_NAME`、PAGES 项目名用 `WORKER_NAME`。

数据库迁移文件位于 `migrations/`，包含如下文件：
1. `0001_posts.sql` — 文章表 + FTS
2. `0002_taxonomy.sql` — 分类/标签表
3. `0003_pin_order.sql` — 置顶字段
4. `0004_notice.sql` — 公告栏
5. `0005_admin_login_attempts.sql` — 登录限速
6. `0006_html_files.sql` — 独立 HTML 文件

旧的 `npm run migrate:posts` 等单条命令仍然可用，它们是 `content:import -- --only <类型>` 的等价封装。

###### 步骤 4：配置环境变量
在 Cloudflare Dashboard → **Workers & Pages** → **aiovtue-blog** → **Settings** → **Variables and Secrets** 中添加如下变量，和 `.dev.vars` 文件中的变量一样：

|变量名|类型|说明|
|---|---|---|
|`ADMIN_USERNAME`|变量|后台登录用户名|
|`ADMIN_PASSWORD`|**Secret**|后台登录密码|
|`ADMIN_API_TOKEN`|**Secret**（推荐）|API 调用令牌，建议与登录密码不同|
|`WEBDAV_PASSWORD`|**Secret**（可选）|相册 WebDAV 代理密码|
|`SITE_URL`|变量|站点主 URL，如 `https://daily.yybb.us`|

`wrangler.toml` 中 `[vars]` 的 `SITE_URL` 用于构建默认值；生产环境建议在 Dashboard 覆盖为你的自定义域名

###### 步骤 5：绑定自定义域名（可选）
Cloudflare Dashboard → Workers 项目 → **Settings** → **Domains & Routes** → 添加 `daily.yybb.us` 等域名，按提示配置 DNS
要和下列文件中的url保持一致哦，不一致的话请绑定配置好后重新运行部署命令部署一下：
- `site.config.ts` 中的 `url`
- `wrangler.toml` 中 `SITE_URL`（或 Dashboard 环境变量）

##### 网页部署
网页部署（关联 Git，push 自动部署）**同样会自动建表并导入 `content/`**。

###### 登录并进入 Workers
1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧选择 **Workers 和 Pages**（Workers & Pages）
3. 点击 **创建** → **Workers** → **连接到 Git**

###### 创建项目（关联 Git）
1. 选择 **连接到 Git**，授权 GitHub/GitLab
2. 选中本仓库 `AueXUE`
3. 填写构建配置：

|配置项|填写内容|
|---|---|
|项目名称|`aiovtue-blog`（或你自己的名字）|
|生产分支|`main`（或你的主分支）|
|构建命令|`npm run cf:build`|
|部署命令|`npm run cf:deploy:only`|
|根目录|`/`（仓库根目录）|

4. 点击 **保存并部署**

这两个命令的分工：

| 命令 | 做什么 |
|---|---|
| `npm run cf:build`（Build） | 读取 D1 绑定 → 生成 `wrangler.build.toml` → 应用 `migrations/` 建表 → 导入 `content/` → 构建前端 |
| `npm run cf:deploy:only`（Deploy） | 用上一步生成的配置部署 Worker，不重复建表和导入 |

所以每次 push 都会自动建表、自动导入内容、自动部署，不需要在本地跑任何命令。

构建阶段会按 `database_name` 查找 D1：**已有就复用，没有就自动创建**；R2 同样自动创建。因此首次 push 就能一键跑通，不需要预先手工建资源。

创建得到 `database_id` 后，构建日志会提示把它写进 `wrangler.toml`。建议照做并提交——虽然不写也能工作（每次构建会重新按名字查到同一个库），但显式写死可以避免依赖列表接口的返回结果。

> 规则细节：`wrangler.toml` 里填了 `database_id` 时，会以云端同名库的 id 为准自动纠正过期或填错的值；若列表接口因权限原因没返回该库，会回退使用配置里的 id，不会重复创建。
>
> `worker/wrangler.toml.template` 不含账号 ID，`database_id` 只在构建期渲染进 `wrangler.build.toml`（已 gitignore）。

###### 配置构建变量（可选）
如果 D1/R2/Worker 名字和 `wrangler.toml` 里的默认值不同，在 **设置 → 构建 → 构建变量** 里添加：

|变量名|说明|
|---|---|
|`D1_DATABASE_NAME`|D1 数据库名，默认 `aiovtue-blog`|
|`R2_BUCKET_NAME`|R2 存储桶名，默认 `aiovtue-blog`|
|`WORKER_NAME`|Worker 名，默认取 `wrangler.toml` 的 `name`|
|`SITE_URL`|站点主 URL|

> Workers Builds 会自动注入 API Token，构建阶段因此可以操作 D1/R2。**不要**把 Token 写进仓库。
>
> 构建阶段的 Token 需要 D1 与 R2 的读写权限，否则无法自动创建资源。

###### 配置环境变量
路径：**设置** → **变量和密钥（Variables and Secrets）** → **添加**如下变量，和 `.dev.vars` 文件内变量一致

|变量名|类型|生产环境值示例|
|---|---|---|
|`ADMIN_USERNAME`|文本（Variable）|你的后台用户名|
|`ADMIN_PASSWORD`|加密（Secret）|你的后台密码|
|`ADMIN_API_TOKEN`|加密（Secret）|随机长字符串（与密码不同）|
|`WEBDAV_PASSWORD`|加密（Secret）|相册 WebDAV 密码（可选）|
|`SITE_URL`|文本（Variable）|`https://daily.yybb.us`|

- 修改环境变量后，点击 **重新部署** 使配置生效

> **重要：`wrangler.toml` 里已设置 `keep_vars = true`。**
>
> 默认情况下，`wrangler deploy` 会用配置文件里的 `[vars]` 覆盖 Dashboard 上的变量，把你在页面上配的 `ADMIN_USERNAME` 等冲掉——表现就是后台登录报「管理员登录未配置」。
>
> `keep_vars = true` 会让部署保留 Dashboard 上的变量。**不要删掉这一行**，除非你打算把所有变量都写进 `wrangler.toml`（不推荐，密码等敏感项不应入库）。

###### 绑定自定义域名（可选）
Cloudflare Dashboard → Workers 项目 → **Settings** → **Domains & Routes** → 添加 `daily.yybb.us` 等域名，按提示配置 DNS
要和下列文件中的url保持一致哦，不一致的话请绑定配置好后重新运行部署命令部署一下：
- `site.config.ts` 中的 `url`
- `wrangler.toml` 中 `SITE_URL`（或 Dashboard 环境变量）
