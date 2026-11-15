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
站点信息分布在两个地方，涵盖两个文件`site.config.ts`和`valaxy.config.ts`
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
| `npm run dev:cf`      | 8788 | **推荐**：构建 + 自动建表并导入 `content/` 到本地 D1/R2 + `wrangler pages dev`，等同云端 |
| `npm run dev:cf:lite` | 8788 | 仅重建前端并启动 wrangler，**跳过内容导入**（改样式/UI 时用）             |
说一下区别，`npm run dev:cf` 命令是本地全量预览，会自动把 `content/` 里的文章、友链、关于页、相册、公告栏导入到本地预览的 R2 和 D1 中，不需要逐条执行导入命令；`npm run dev:cf:lite` 和上一个命令一样，但会跳过导入部分，大大加快预览速度，首次建议 `npm run dev:cf`，后续使用 `npm run dev:cf:lite` 即可
要是想删除本地数据库数据，可以使用后台手动删除，也可以直接删除`AueXUE\.wrangler\state`
文件夹下所有文件，然后重新执行全量命令即可。

#### 云端部署
云端部署分为两种方式，终端部署和网页部署，终端部署比较简单，推荐终端
##### 终端部署
###### 步骤 1：登录 wrangler
```shell
npx wrangler login
```
没安装 wrangler 的话先装一下：`npm install -g wrangler`

###### 步骤 2：一条命令完成建库、建桶、建表、导入内容和部署
```shell
npm run cf:deploy
```
这条命令会按顺序自动完成下面 5 件事，中途不需要任何手工操作：

1. 按 `wrangler.toml` 里的 `database_name` 查询 D1：**已有就复用，没有就自动创建**，并把对应的 `database_id` 和 `[[d1_databases]]` 绑定写回 `wrangler.toml`（删库重建后 id 变了也会自动纠正）
2. 按 `bucket_name` 查询 R2：**已有就复用，没有就自动创建**，缺 `[[r2_buckets]]` 绑定段时也会自动补上
3. 应用 `migrations/` 下的全部表结构（已有表会跳过）
4. 把 `content/` 下的文章、友链、关于页、相册、公告栏导入到 R2 + D1
5. 构建站点并部署到 Cloudflare Pages

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

数据库名、桶名都取自 `wrangler.toml`，改名字后不用再改脚本；也可以用环境变量临时覆盖：`D1_DATABASE_NAME`、`R2_BUCKET_NAME`、`PAGES_PROJECT_NAME`。

数据库迁移文件位于 `migrations/`，包含如下文件：
1. `0001_posts.sql` — 文章表 + FTS
2. `0002_taxonomy.sql` — 分类/标签表
3. `0003_pin_order.sql` — 置顶字段
4. `0004_notice.sql` — 公告栏
5. `0005_admin_login_attempts.sql` — 登录限速
6. `0006_html_files.sql` — 独立 HTML 文件

旧的 `npm run migrate:posts` 等单条命令仍然可用，它们是 `content:import -- --only <类型>` 的等价封装。

###### 步骤 4：配置 Pages 环境变量
在 Cloudflare Dashboard → **Workers & Pages** → **aiovtue-blog** → **Settings** → **Environment variables** 中添加如下环境变量，和`.dev.vars`文件中的变量一样：

|变量名|类型|说明|
|---|---|---|
|`ADMIN_USERNAME`|变量|后台登录用户名|
|`ADMIN_PASSWORD`|**Secret**|后台登录密码|
|`ADMIN_API_TOKEN`|**Secret**（推荐）|API 调用令牌，建议与登录密码不同|
|`WEBDAV_PASSWORD`|**Secret**（可选）|相册 WebDAV 代理密码|
|`SITE_URL`|变量|站点主 URL，如 `https://daily.yybb.us`|

`wrangler.toml` 中 `[vars]` 的 `SITE_URL` 用于构建默认值；生产环境建议在 Dashboard 覆盖为你的自定义域名

###### 步骤 5：构建并部署（已包含在 `cf:deploy` 中）
如果你已经执行过 `npm run cf:deploy`，这一步不需要再做，它会自动构建并部署。
只想在改完前端后重新构建部署、不动数据时，单独运行：
```shell
npm run cf:deploy -- --skip-import
```
执行完之后就能在 cloudflare 的项目列表看到该项目了，此时就能进行访问了

###### 步骤 6：绑定自定义域名（可选）
Cloudflare Dashboard → Pages 项目 → **Custom domains** → 添加 `daily.yybb.us` 等域名，按提示配置 DNS
要和下列文件中的url保持一致哦，不一致的话请绑定配置好后重新运行部署命令部署一下：
- `site.config.ts` 中的 `url`
- `wrangler.toml` 中 `SITE_URL`（或 Dashboard 环境变量）

##### 网页部署
部署前只需要把 `wrangler.toml` 里的 `name`、`database_name`、`bucket_name` 改成自己的名字，`database_id` 留空即可，绑定段整个删掉也行——脚本会按名字查询，**D1 与 R2 已有就绑定已有的，没有才创建**，并把绑定和 `database_id` 自动写回 `wrangler.toml`。然后在本地跑一次 `npm run cf:deploy`，它会建表、导入 `content/` 内容并部署；之后日常改文章直接在后台管理即可。
###### 登录并进入 Pages
1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧选择 **Workers 和 Pages**（Workers & Pages）
3. 若已有项目，点击 **aiovtue-blog**；否则点击 **创建** → **Pages** → **连接到 Git**

###### 创建项目（关联 Git）
1. 选择 **连接到 Git**，授权 GitHub/GitLab
2. 选中本仓库 `AueXUE`
3. 点击 **开始设置**，填写构建配置：

|配置项|填写内容|
|---|---|
|项目名称|`aiovtue-blog`|
|生产分支|`main`（或你的主分支）|
|框架预设|`None`（无预设）|
|构建命令|`npm run build`|
|构建输出目录|`dist`|
|根目录|`/`（仓库根目录）|

4. 点击 **环境变量** → **添加变量**（见下文「四、配置环境变量」），也可以先保存后面在添加，然后 **保存并部署**

###### 绑定 D1 与 R2
部署完成后，进入项目 **aiovtue-blog** → **设置（Settings）** → **函数（Functions）** → **绑定（Bindings）**：
添加 D1 数据库绑定
1. 点击 **添加** → **D1 database**
2. 变量名填：`DB`（必须与 `wrangler.toml` 一致）
3. 选择数据库：`aiovtue-blog`
4. 保存

若列表中没有 D1，需先到 **Storage & databases** → **D1** → **创建数据库**，名称 `aiovtue-blog`。
添加 R2 存储桶绑定
1. 点击 **添加** → **R2 bucket**
2. 变量名填：`BUCKET`
3. 选择存储桶：`aiovtue-blog`
4. 保存

若尚无 R2，到 **R2** → **创建存储桶**，名称 `aiovtue-blog`

> 绑定修改后，需在 **部署（Deployments）** 中 **重新部署** 一次生产环境，新绑定才会生效。

---

###### 配置环境变量
路径：**设置** → **环境变量（Variables and Secrets）** → **添加**如下变量，和`.dev.vars`文件内变量一致

|变量名|类型|生产环境值示例|
|---|---|---|
|`ADMIN_USERNAME`|文本（Variable）|你的后台用户名|
|`ADMIN_PASSWORD`|加密（Secret）|你的后台密码|
|`ADMIN_API_TOKEN`|加密（Secret）|随机长字符串（与密码不同）|
|`WEBDAV_PASSWORD`|加密（Secret）|相册 WebDAV 密码（可选）|
|`SITE_URL`|文本（Variable）|`https://daily.yybb.us`|

- 修改环境变量后，点击 **重新部署** 使配置生效

###### 表结构、内容导入与首次初始化
关联 Git 的自动部署只负责构建前端页面，不会创建表结构，也不会把 `content/` 导入云端。首次使用（以及以后 `content/`、`migrations/` 有改动时）在本地仓库根目录跑一次：

```shell
npm run cf:deploy
```

它会按顺序完成：按 `wrangler.toml` 的 `database_name`/`bucket_name` 查询 D1 与 R2（已有就复用，没有才创建）→ 把绑定与 `database_id` 写回 `wrangler.toml` → 应用 `migrations/` 表结构 → 导入 `content/` 下的文章、友链、关于页、相册、公告栏 → 构建并部署。

导入是 upsert，同一篇 slug 只会更新不会重复，所以随时可以重跑。


###### 步骤 6：绑定自定义域名（可选）
Cloudflare Dashboard → Pages 项目 → **Custom domains** → 添加 `daily.yybb.us` 等域名，按提示配置 DNS
要和下列文件中的url保持一致哦，不一致的话请绑定配置好后重新运行部署命令部署一下：
- `site.config.ts` 中的 `url`
- `wrangler.toml` 中 `SITE_URL`（或 Dashboard 环境变量）

