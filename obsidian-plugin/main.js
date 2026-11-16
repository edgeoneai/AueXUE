"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ValaxySyncPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian12 = require("obsidian");

// src/api/siteApi.ts
var import_obsidian = require("obsidian");

// src/settings.ts
var DEFAULT_SETTINGS = {
  siteUrl: "",
  authMode: "token",
  apiToken: "",
  username: "",
  password: "",
  sessionCookie: "",
  publishedUrlKey: "published_url",
  postDownloadFolder: "Valaxy/Posts"
};
function normalizeSiteUrl(input) {
  return input.trim().replace(/\/+$/, "");
}
function apiUrl(siteUrl, path) {
  const base = normalizeSiteUrl(siteUrl);
  if (!base)
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u7AD9\u70B9\u5730\u5740");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
function postPublicUrl(siteUrl, slug) {
  return `${normalizeSiteUrl(siteUrl)}/posts/${encodeURIComponent(slug)}`;
}
function publishedUrlFrontmatterKeys(publishedUrlKey) {
  const seen = /* @__PURE__ */ new Set();
  const keys = [];
  for (const key of [publishedUrlKey, "published_url", "\u53D1\u5E03\u94FE\u63A5"]) {
    const normalized = key == null ? void 0 : key.trim();
    if (!normalized || seen.has(normalized))
      continue;
    seen.add(normalized);
    keys.push(normalized);
  }
  return keys;
}
function readPublishedUrl(frontmatter, publishedUrlKey) {
  for (const key of publishedUrlFrontmatterKeys(publishedUrlKey)) {
    const value = frontmatter[key];
    if (value !== void 0 && value !== null && String(value).trim())
      return String(value).trim();
  }
  return "";
}

// src/constants.ts
var VALAXY_POST_KEYS = /* @__PURE__ */ new Set([
  "title",
  "excerpt",
  "description",
  "date",
  "updated",
  "categories",
  "tags",
  "cover",
  "image",
  "top",
  "pin_order",
  "draft",
  "hidden",
  "slug"
]);
var IGNORE_FRONTMATTER_KEYS = /* @__PURE__ */ new Set([
  "alias",
  "aliases",
  "cssclass",
  "cssclasses",
  "cssClasses",
  "publish",
  "published",
  "position",
  "starred",
  "sticker",
  "mood",
  "weather",
  "author",
  "uid",
  "id",
  "created",
  "modified",
  "published_url",
  "\u53D1\u5E03\u94FE\u63A5"
]);
var SLUG_RE = /^[a-zA-Z0-9._-]+$/;
function isValidPostSlug(slug) {
  if (!slug || slug.includes("..") || slug.includes("/") || slug.includes("\\"))
    return false;
  return SLUG_RE.test(slug);
}

// src/lib/frontmatter.ts
var FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
function unquote(value) {
  if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'"))
    return value.slice(1, -1);
  return value;
}
function parseScalar(value) {
  const v = unquote(value);
  if (v === "true")
    return true;
  if (v === "false")
    return false;
  if (/^-?\d+$/.test(v))
    return Number(v);
  return v;
}
function parseFrontmatterYaml(yaml) {
  const result = {};
  let currentKey = null;
  let listItems = null;
  function flushList() {
    if (currentKey && listItems)
      result[currentKey] = listItems;
    listItems = null;
  }
  for (const rawLine of yaml.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trim().startsWith("#"))
      continue;
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && listItems) {
      listItems.push(unquote(listMatch[1].trim()));
      continue;
    }
    flushList();
    const kvMatch = line.match(/^([A-Za-z0-9_\u4e00-\u9fff-]+):\s*(.*)$/);
    if (!kvMatch)
      continue;
    const key = kvMatch[1];
    const value = kvMatch[2].trim();
    currentKey = key;
    if (!value) {
      listItems = [];
      continue;
    }
    result[key] = parseScalar(value);
  }
  flushList();
  return result;
}
function splitMarkdown(source) {
  const match = source.match(FRONTMATTER_RE);
  if (!match)
    return { frontmatter: {}, content: source };
  return {
    frontmatter: parseFrontmatterYaml(match[1]),
    content: match[2]
  };
}
function readNoteFrontmatter(cacheFm, source) {
  const parsed = splitMarkdown(source);
  return {
    frontmatter: { ...cacheFm || {}, ...parsed.frontmatter },
    content: parsed.content
  };
}
function formatYamlValue(value) {
  if (typeof value === "boolean")
    return value ? "true" : "false";
  if (typeof value === "number")
    return String(value);
  const str = String(value);
  if (/[:#]/.test(str) || str.includes('"'))
    return `"${str.replace(/"/g, '\\"')}"`;
  return str;
}
function serializeFrontmatter(fm, content) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fm)) {
    if (value === void 0 || value === null || value === "")
      continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value)
        lines.push(`  - ${formatYamlValue(item)}`);
      continue;
    }
    lines.push(`${key}: ${formatYamlValue(value)}`);
  }
  lines.push("---", "");
  const body = content.startsWith("\n") ? content : `
${content}`;
  return `${lines.join("\n")}${body}`;
}
function pickValaxyFrontmatter(raw) {
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (IGNORE_FRONTMATTER_KEYS.has(key))
      continue;
    if (!VALAXY_POST_KEYS.has(key))
      continue;
    if (key === "slug")
      continue;
    out[key] = value;
  }
  if (out.image && !out.cover)
    out.cover = out.image;
  delete out.image;
  return out;
}
function mergeFrontmatter(existing, patch) {
  return { ...existing, ...patch };
}
function todayDateString() {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function checkRequiredFields(fm, slug) {
  const missing = [];
  if (!String(fm.title || "").trim())
    missing.push("title");
  if (!String(fm.date || "").trim())
    missing.push("date");
  if (!slug.trim())
    missing.push("slug");
  return { missing };
}

// src/lib/aboutFrontmatter.ts
var FRONTMATTER_RE2 = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
function splitMarkdown2(source) {
  const match = source.match(FRONTMATTER_RE2);
  if (!match) {
    return {
      frontmatter: {},
      content: source
    };
  }
  return {
    frontmatter: parseFrontmatterYaml(match[1]),
    content: match[2]
  };
}
function serializeFrontmatter2(fm, content) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fm)) {
    if (value === void 0 || value === null)
      continue;
    if (typeof value === "string" && /[:#]/.test(value))
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    else
      lines.push(`${key}: ${value}`);
  }
  lines.push("---", "");
  return `${lines.join("\n")}${content}`;
}
function normalizeAboutFrontmatter(frontmatter) {
  return {
    layout: "post",
    title: String(frontmatter.title || "\u5173\u4E8E\u6211").trim() || "\u5173\u4E8E\u6211",
    cover: frontmatter.cover ? String(frontmatter.cover).trim() : void 0,
    date: frontmatter.date ? String(frontmatter.date).trim() : void 0,
    updated: frontmatter.updated ? String(frontmatter.updated).trim() : void 0,
    comment: frontmatter.comment === true ? true : void 0
  };
}
function defaultAboutDetail() {
  return {
    frontmatter: {
      title: "\u5173\u4E8E\u6211",
      layout: "post",
      date: todayDateString()
    },
    markdown: "\n# \u5173\u4E8E\u672C\u7AD9\n\n"
  };
}
function parseAboutDetail(data) {
  var _a;
  const markdown = (_a = data.markdown) != null ? _a : data.source ? splitMarkdown2(data.source).content : defaultAboutDetail().markdown;
  return {
    frontmatter: normalizeAboutFrontmatter(data.frontmatter || {}),
    html: data.html,
    markdown,
    source: data.source
  };
}
function buildAboutSource(meta, markdown) {
  const frontmatter = normalizeAboutFrontmatter({
    title: meta.title.trim() || "\u5173\u4E8E\u6211",
    cover: meta.cover.trim() || void 0,
    date: meta.date.trim() || todayDateString()
  });
  const body = markdown.startsWith("\n") ? markdown : `
${markdown}`;
  return serializeFrontmatter2(frontmatter, body);
}

// src/api/siteApi.ts
var SiteApi = class {
  constructor(plugin, getSettings) {
    this.plugin = plugin;
    this.getSettings = getSettings;
    this.tokenVerified = false;
    this.verifiedToken = "";
    this.verifiedSiteUrl = "";
  }
  resetAuthCache() {
    this.tokenVerified = false;
    this.verifiedToken = "";
    this.verifiedSiteUrl = "";
  }
  async saveSettings(patch) {
    this.plugin.settings = { ...this.plugin.settings, ...patch };
    await this.plugin.saveSettings();
  }
  authHeaders() {
    const s = this.getSettings();
    if (s.authMode === "token" && s.apiToken.trim())
      return { Authorization: `Bearer ${this.normalizeToken(s.apiToken)}` };
    if (s.sessionCookie)
      return { Cookie: s.sessionCookie };
    return {};
  }
  normalizeToken(token) {
    return token.trim();
  }
  /** 验证 Token 是否具备管理员权限（兼容未升级 /api/admin/me 的旧站点） */
  async verifyTokenAdminAccess(token, siteUrl) {
    var _a;
    const bearer = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    const meRes = await (0, import_obsidian.requestUrl)({
      url: apiUrl(siteUrl, "/api/admin/me"),
      throw: false,
      headers: bearer
    });
    if (meRes.status === 200) {
      try {
        const me = JSON.parse(meRes.text);
        if (me.authenticated)
          return true;
      } catch (e) {
      }
    }
    const listRes = await (0, import_obsidian.requestUrl)({
      url: apiUrl(siteUrl, "/api/posts?pageSize=1"),
      throw: false,
      headers: bearer
    });
    if (listRes.status === 401)
      return false;
    let posts = [];
    if (listRes.status === 200) {
      try {
        posts = JSON.parse(listRes.text).posts || [];
      } catch (e) {
        return false;
      }
    }
    if (!posts.length)
      return true;
    const postRes = await (0, import_obsidian.requestUrl)({
      url: apiUrl(siteUrl, `/api/posts/${encodeURIComponent(posts[0].slug)}`),
      throw: false,
      headers: bearer
    });
    if (postRes.status === 401)
      return false;
    if (postRes.status !== 200)
      return false;
    try {
      const detail = JSON.parse(postRes.text);
      return Boolean(((_a = detail.source) == null ? void 0 : _a.trim()) || detail.markdown != null);
    } catch (e) {
      return false;
    }
  }
  async request(path, init = {}) {
    await this.ensureAuth();
    const url = apiUrl(this.getSettings().siteUrl, path);
    const headers = {
      Accept: "application/json",
      ...this.authHeaders(),
      ...init.headers
    };
    if (init.body && !headers["Content-Type"]) {
      headers["Content-Type"] = typeof init.body === "string" && init.body.trimStart().startsWith("---") ? "text/markdown; charset=utf-8" : "application/json; charset=utf-8";
    }
    let response;
    try {
      response = await (0, import_obsidian.requestUrl)({
        url,
        throw: false,
        ...init,
        headers
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25\uFF1A${message}`);
    }
    if (response.status === 401)
      throw new Error("\u672A\u6388\u6743\uFF1A\u8BF7\u68C0\u67E5 API Token \u6216\u8D26\u53F7\u5BC6\u7801");
    let data = {};
    if (response.text) {
      try {
        data = JSON.parse(response.text);
      } catch (e) {
        data = { message: response.text };
      }
    }
    if (response.status < 200 || response.status >= 300) {
      throw new Error(data.message || `\u8BF7\u6C42\u5931\u8D25 (${response.status})`);
    }
    return data;
  }
  async ensureAuth() {
    const s = this.getSettings();
    if (!normalizeSiteUrl(s.siteUrl))
      throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u7AD9\u70B9\u5730\u5740");
    if (s.authMode === "token") {
      const token = this.normalizeToken(s.apiToken);
      if (!token)
        throw new Error("\u8BF7\u914D\u7F6E API Token\uFF08\u4E0E\u7AD9\u70B9 ADMIN_API_TOKEN \u4E00\u81F4\uFF09");
      const siteUrl = normalizeSiteUrl(s.siteUrl);
      if (this.tokenVerified && this.verifiedToken === token && this.verifiedSiteUrl === siteUrl)
        return;
      const ok = await this.verifyTokenAdminAccess(token, s.siteUrl);
      if (!ok) {
        throw new Error("API Token \u65E0\u6548\u6216\u65E0\u7BA1\u7406\u5458\u6743\u9650\u3002\u8BF7\u786E\u8BA4\u4E0E\u7AD9\u70B9 ADMIN_API_TOKEN \u5B8C\u5168\u4E00\u81F4\uFF08\u6CE8\u610F\u9996\u5C3E\u7A7A\u683C\uFF09");
      }
      this.tokenVerified = true;
      this.verifiedToken = token;
      this.verifiedSiteUrl = siteUrl;
      return;
    }
    if (s.sessionCookie) {
      try {
        const url2 = apiUrl(s.siteUrl, "/api/admin/me");
        const meRes = await (0, import_obsidian.requestUrl)({
          url: url2,
          throw: false,
          headers: { ...this.authHeaders(), Accept: "application/json" }
        });
        if (meRes.status === 200) {
          const me = JSON.parse(meRes.text);
          if (me.authenticated)
            return;
        }
      } catch (e) {
      }
    }
    if (!s.username.trim() || !s.password)
      throw new Error("\u8BF7\u914D\u7F6E\u7BA1\u7406\u5458\u8D26\u53F7\u4E0E\u5BC6\u7801");
    const url = apiUrl(s.siteUrl, "/api/admin/login");
    const response = await (0, import_obsidian.requestUrl)({
      url,
      method: "POST",
      throw: false,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ username: s.username.trim(), password: s.password })
    });
    if (response.status !== 200) {
      let message = "\u767B\u5F55\u5931\u8D25";
      try {
        const body = JSON.parse(response.text);
        if (body.message)
          message = body.message;
      } catch (e) {
      }
      throw new Error(message);
    }
    const cookie = extractSessionCookie(response.headers);
    if (!cookie)
      throw new Error("\u767B\u5F55\u6210\u529F\u4F46\u672A\u6536\u5230\u4F1A\u8BDD Cookie");
    await this.saveSettings({ sessionCookie: cookie });
    new import_obsidian.Notice("Valaxy \u767B\u5F55\u6210\u529F");
  }
  async testConnection() {
    const s = this.getSettings();
    if (!normalizeSiteUrl(s.siteUrl))
      throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u7AD9\u70B9\u5730\u5740");
    if (s.authMode === "token") {
      const token = this.normalizeToken(s.apiToken);
      if (!token)
        throw new Error("\u8BF7\u914D\u7F6E API Token");
      const ok = await this.verifyTokenAdminAccess(token, s.siteUrl);
      if (!ok)
        throw new Error("API Token \u65E0\u6548\u6216\u65E0\u7BA1\u7406\u5458\u6743\u9650");
      this.tokenVerified = true;
      this.verifiedToken = token;
      this.verifiedSiteUrl = normalizeSiteUrl(s.siteUrl);
      return;
    }
    await this.ensureAuth();
    const me = await this.request("/api/admin/me");
    if (!me.authenticated)
      throw new Error("\u4F1A\u8BDD\u65E0\u6548");
  }
  // —— Posts ——
  async listPosts() {
    const data = await this.request("/api/posts?pageSize=200");
    return data.posts || [];
  }
  async getPost(slug) {
    var _a;
    const detail = await this.request(`/api/posts/${encodeURIComponent(slug)}`);
    if (((_a = detail.source) == null ? void 0 : _a.trim()) || detail.markdown != null)
      return detail;
    throw new Error("\u65E0\u6CD5\u83B7\u53D6\u6587\u7AE0\u6E90\u7801\uFF1A\u8BF7\u786E\u8BA4 API Token \u6216\u767B\u5F55\u72B6\u6001\u6709\u6548");
  }
  async savePost(slug, source) {
    return this.request(`/api/posts/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body: source,
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    });
  }
  async deletePost(slug) {
    return this.request(`/api/posts/${encodeURIComponent(slug)}`, { method: "DELETE" });
  }
  // —— Links / About / Notice ——
  async getLinksDetail() {
    return this.request("/api/links");
  }
  async getLinksSource() {
    const data = await this.getLinksDetail();
    return data.source || "";
  }
  async saveLinksSource(source) {
    return this.request("/api/links", {
      method: "PUT",
      body: source,
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    });
  }
  async getAboutDetail() {
    try {
      const data = await this.request("/api/about");
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/404|不存在/.test(message))
        return { frontmatter: { title: "\u5173\u4E8E\u6211", layout: "post" }, markdown: "\n# \u5173\u4E8E\u672C\u7AD9\n\n" };
      throw error;
    }
  }
  async getAboutSource() {
    var _a;
    const detail = parseAboutDetail(await this.getAboutDetail());
    if ((_a = detail.source) == null ? void 0 : _a.trim())
      return detail.source;
    return buildAboutSource(
      {
        title: detail.frontmatter.title || "\u5173\u4E8E\u6211",
        cover: detail.frontmatter.cover || "",
        date: detail.frontmatter.date || ""
      },
      detail.markdown || ""
    );
  }
  async saveAboutSource(source) {
    return this.request("/api/about", {
      method: "PUT",
      body: source,
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    });
  }
  async getNoticeDetail() {
    try {
      return await this.request("/api/notice");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/404|不存在/.test(message)) {
        return {
          title: "\u516C\u544A\u680F",
          sections: []
        };
      }
      throw error;
    }
  }
  async saveNoticeDetail(board) {
    return this.request("/api/notice", {
      method: "PUT",
      body: JSON.stringify(board),
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
  // —— HTML 文件 ——
  async listHtmlFiles() {
    const data = await this.request("/api/html-files");
    return Array.isArray(data == null ? void 0 : data.files) ? data.files : [];
  }
  async getHtmlFile(slug) {
    return this.request(`/api/html-files/${encodeURIComponent(slug)}`);
  }
  async saveHtmlFile(payload) {
    return this.request("/api/html-files", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
  async deleteHtmlFile(slug) {
    return this.request(`/api/html-files/${encodeURIComponent(slug)}`, {
      method: "DELETE"
    });
  }
  // —— 站点设置 ——
  async getSiteSettings() {
    return this.request("/api/site-settings");
  }
  async saveSiteSettings(payload) {
    return this.request("/api/site-settings", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
  async resetSiteSettings() {
    return this.request("/api/site-settings/reset", { method: "POST" });
  }
  // —— Gallery ——
  async getGalleryHub() {
    return this.request("/api/gallery");
  }
  async saveGalleryHub(source) {
    return this.request("/api/gallery", {
      method: "PUT",
      body: source,
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    });
  }
  async getGalleryAlbum(slug) {
    return this.request(`/api/gallery/${encodeURIComponent(slug)}`);
  }
  async saveGalleryAlbum(slug, source) {
    return this.request(`/api/gallery/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body: source,
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    });
  }
  async deleteGalleryAlbum(slug) {
    return this.request(`/api/gallery/${encodeURIComponent(slug)}`, { method: "DELETE" });
  }
};
function extractSessionCookie(headers) {
  if (!headers)
    return "";
  const raw = typeof headers.get === "function" ? headers.get("set-cookie") || headers.get("Set-Cookie") || "" : String(headers["set-cookie"] || headers["Set-Cookie"] || "");
  if (!raw)
    return "";
  const match = raw.match(/admin_session=([^;]+)/);
  if (!match)
    return "";
  return `admin_session=${match[1]}`;
}

// src/upload/uploadPost.ts
var import_obsidian5 = require("obsidian");

// src/modals/ConfirmOverwriteModal.ts
var import_obsidian2 = require("obsidian");
var ConfirmOverwriteModal = class extends import_obsidian2.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.confirmed = false;
    this.resolveWait = null;
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText("\u4E91\u7AEF\u5DF2\u5B58\u5728");
    contentEl.createEl("p", {
      text: "\u8BE5\u7B14\u8BB0\u5DF2\u6709\u53D1\u5E03\u94FE\u63A5\uFF0C\u4E91\u7AEF\u53EF\u80FD\u5DF2\u6709\u6B64\u6587\u7AE0\u3002\u786E\u5B9A\u8981\u8986\u76D6\u66F4\u65B0\u5417\uFF1F"
    });
    contentEl.createEl("p", {
      text: `\u6807\u9898\uFF1A${this.options.title}`,
      cls: "vax-modal-meta"
    });
    contentEl.createEl("p", {
      text: `Slug\uFF1A${this.options.slug}`,
      cls: "vax-modal-meta"
    });
    contentEl.createEl("p", {
      text: this.options.publishedUrl,
      cls: "vax-modal-hint"
    });
    const actions = contentEl.createDiv({ cls: "vax-modal-actions" });
    new import_obsidian2.ButtonComponent(actions).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian2.ButtonComponent(actions).setButtonText("\u8986\u76D6\u66F4\u65B0").setCta().onClick(() => {
      this.confirmed = true;
      this.close();
    });
  }
  waitForClose() {
    return new Promise((resolve) => {
      this.resolveWait = resolve;
      this.open();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.resolveWait) {
      this.resolveWait(this.confirmed);
      this.resolveWait = null;
    }
  }
};

// src/modals/MissingFieldsModal.ts
var import_obsidian4 = require("obsidian");

// src/lib/modalActions.ts
var import_obsidian3 = require("obsidian");
function appendModalActions(container, actions) {
  const row = container.createDiv({ cls: "vax-modal-actions" });
  for (const action of actions) {
    const btn = new import_obsidian3.ButtonComponent(row);
    btn.setButtonText(action.label);
    if (action.cta)
      btn.setCta();
    if (action.warning)
      btn.setWarning();
    btn.onClick(() => {
      void action.onClick();
    });
  }
  return row;
}

// src/modals/MissingFieldsModal.ts
var MissingFieldsModal = class extends import_obsidian4.Modal {
  constructor(app, initial, missing) {
    super(app);
    this.missing = missing;
    this.resolveWait = null;
    this.result = {
      cancelled: true,
      values: {
        title: initial.title || "",
        date: initial.date || todayDateString(),
        slug: initial.slug || "",
        categories: initial.categories || "",
        tags: initial.tags || "",
        excerpt: initial.excerpt || "",
        cover: initial.cover || ""
      }
    };
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText("\u8865\u5145\u6587\u7AE0\u5C5E\u6027");
    contentEl.createEl("p", {
      text: "\u4EE5\u4E0B\u5B57\u6BB5\u5C06\u5199\u5165\u5F53\u524D\u7B14\u8BB0 frontmatter\uFF0C\u591A\u4F59 Obsidian \u5C5E\u6027\u4E0D\u4F1A\u4E0A\u4F20\u3002",
      cls: "vax-modal-hint"
    });
    if (this.missing.includes("title") || !this.result.values.title) {
      new import_obsidian4.Setting(contentEl).setName("\u6807\u9898 *").addText((t) => t.setPlaceholder("\u6587\u7AE0\u6807\u9898").setValue(this.result.values.title).onChange((v) => {
        this.result.values.title = v;
      }));
    }
    if (this.missing.includes("date") || !this.result.values.date) {
      new import_obsidian4.Setting(contentEl).setName("\u65E5\u671F *").setDesc("\u683C\u5F0F YYYY-MM-DD").addText((t) => t.setValue(this.result.values.date).onChange((v) => {
        this.result.values.date = v;
      }));
    }
    if (this.missing.includes("slug") || !this.result.values.slug) {
      new import_obsidian4.Setting(contentEl).setName("Slug *").setDesc("\u4EC5\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u70B9\u3001\u4E0B\u5212\u7EBF\u4E0E\u8FDE\u5B57\u7B26").addText((t) => t.setPlaceholder("my-post").setValue(this.result.values.slug).onChange((v) => {
        this.result.values.slug = v;
      }));
    }
    new import_obsidian4.Setting(contentEl).setName("\u5206\u7C7B").addText((t) => t.setPlaceholder("\u968F\u7B14").setValue(this.result.values.categories).onChange((v) => {
      this.result.values.categories = v;
    }));
    new import_obsidian4.Setting(contentEl).setName("\u6807\u7B7E").setDesc("\u591A\u4E2A\u6807\u7B7E\u7528\u82F1\u6587\u9017\u53F7\u5206\u9694").addText((t) => t.setValue(this.result.values.tags).onChange((v) => {
      this.result.values.tags = v;
    }));
    new import_obsidian4.Setting(contentEl).setName("\u6458\u8981").addText((t) => t.setValue(this.result.values.excerpt).onChange((v) => {
      this.result.values.excerpt = v;
    }));
    new import_obsidian4.Setting(contentEl).setName("\u5C01\u9762 URL").addText((t) => t.setValue(this.result.values.cover).onChange((v) => {
      this.result.values.cover = v;
    }));
    appendModalActions(contentEl, [
      {
        label: "\u53D6\u6D88",
        onClick: () => this.close()
      },
      {
        label: "\u786E\u8BA4\u5E76\u4E0A\u4F20",
        cta: true,
        onClick: () => {
          const v = this.result.values;
          if (!v.title.trim()) {
            this.contentEl.createDiv({ text: "\u8BF7\u586B\u5199\u6807\u9898", cls: "vax-error" });
            return;
          }
          if (!v.date.trim()) {
            this.contentEl.createDiv({ text: "\u8BF7\u586B\u5199\u65E5\u671F", cls: "vax-error" });
            return;
          }
          if (!isValidPostSlug(v.slug.trim())) {
            this.contentEl.createDiv({ text: "Slug \u683C\u5F0F\u65E0\u6548", cls: "vax-error" });
            return;
          }
          this.result.cancelled = false;
          this.close();
        }
      }
    ]);
  }
  waitForClose() {
    return new Promise((resolve) => {
      this.resolveWait = resolve;
      this.open();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.resolveWait) {
      this.resolveWait(this.result);
      this.resolveWait = null;
    }
  }
};

// src/upload/uploadPost.ts
function slugFromBasename(name) {
  return name.replace(/\.md$/i, "");
}
function parseTagsInput(input) {
  const items = input.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  return items.length ? items : void 0;
}
function formatTagsForForm(value) {
  if (Array.isArray(value))
    return value.map(String).join(", ");
  if (value)
    return String(value);
  return "";
}
var PostUploader = class {
  constructor(app, api, getSettings) {
    this.app = app;
    this.api = api;
    this.getSettings = getSettings;
  }
  async uploadActiveNote() {
    const file = this.app.workspace.getActiveFile();
    if (!file)
      throw new Error("\u8BF7\u5148\u6253\u5F00\u4E00\u7BC7 Markdown \u7B14\u8BB0");
    await this.uploadFile(file);
  }
  async uploadFile(file) {
    var _a;
    if (file.extension.toLowerCase() !== "md")
      throw new Error("\u4EC5\u652F\u6301 Markdown \u7B14\u8BB0");
    const source = await this.app.vault.read(file);
    const cacheFm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    const { frontmatter: rawFm, content } = readNoteFrontmatter(cacheFm, source);
    let slug = String(rawFm.slug || slugFromBasename(file.basename)).trim();
    const valaxyFm = pickValaxyFrontmatter(rawFm);
    let title = String(valaxyFm.title || rawFm.title || file.basename.replace(/\.md$/i, "")).trim();
    let date = String(valaxyFm.date || rawFm.date || todayDateString()).trim();
    let categories = String(valaxyFm.categories || rawFm.categories || "").trim();
    let tags = formatTagsForForm(valaxyFm.tags || rawFm.tags);
    let excerpt = String(valaxyFm.excerpt || rawFm.excerpt || "").trim();
    let cover = String(valaxyFm.cover || rawFm.cover || "").trim();
    const required = checkRequiredFields({ title, date }, slug);
    const needsModal = required.missing.length > 0 || !isValidPostSlug(slug);
    if (needsModal) {
      new import_obsidian5.Notice("\u8BF7\u8865\u5145\u6587\u7AE0\u5C5E\u6027", 3e3);
      const modal = new MissingFieldsModal(this.app, {
        title,
        date,
        slug: isValidPostSlug(slug) ? slug : slugFromBasename(file.basename),
        categories,
        tags,
        excerpt,
        cover
      }, required.missing.length ? required.missing : ["slug"]);
      const result = await modal.waitForClose();
      if (result.cancelled) {
        new import_obsidian5.Notice("\u5DF2\u53D6\u6D88\u4E0A\u4F20", 3e3);
        return;
      }
      title = result.values.title.trim();
      date = result.values.date.trim();
      slug = result.values.slug.trim();
      categories = result.values.categories.trim();
      tags = result.values.tags.trim();
      excerpt = result.values.excerpt.trim();
      cover = result.values.cover.trim();
    }
    if (!isValidPostSlug(slug))
      throw new Error(`Slug \u65E0\u6548\uFF1A${slug}`);
    const publishedKey = this.getSettings().publishedUrlKey || "published_url";
    const existingPublishedUrl = readPublishedUrl(rawFm, publishedKey);
    if (existingPublishedUrl) {
      const confirmModal = new ConfirmOverwriteModal(this.app, {
        title,
        slug,
        publishedUrl: existingPublishedUrl
      });
      const confirmed = await confirmModal.waitForClose();
      if (!confirmed) {
        new import_obsidian5.Notice("\u5DF2\u53D6\u6D88\u4E0A\u4F20", 3e3);
        return;
      }
    }
    const uploadFm = {
      ...valaxyFm,
      title,
      date
    };
    if (categories)
      uploadFm.categories = categories;
    if (excerpt)
      uploadFm.excerpt = excerpt;
    if (cover)
      uploadFm.cover = cover;
    const tagList = parseTagsInput(tags);
    if (tagList)
      uploadFm.tags = tagList;
    if (!uploadFm.updated)
      uploadFm.updated = todayDateString();
    const markdown = serializeFrontmatter(uploadFm, content);
    new import_obsidian5.Notice("\u6B63\u5728\u4E0A\u4F20\u2026", 2e3);
    await this.api.savePost(slug, markdown);
    const publishedUrl = postPublicUrl(this.getSettings().siteUrl, slug);
    const mergedFm = mergeFrontmatter(rawFm, {
      ...uploadFm,
      slug,
      [publishedKey]: publishedUrl
    });
    const nextSource = serializeFrontmatter(mergedFm, content);
    await this.app.vault.modify(file, nextSource);
    new import_obsidian5.Notice(existingPublishedUrl ? `\u5DF2\u8986\u76D6\u66F4\u65B0\uFF1A${title}` : `\u5DF2\u4E0A\u4F20\uFF1A${title}`);
    return publishedUrl;
  }
};

// src/download/downloadPost.ts
var import_obsidian6 = require("obsidian");

// src/lib/workspace.ts
function focusMainWorkspace(app) {
  var _a;
  const { workspace } = app;
  if (((_a = workspace.activeLeaf) == null ? void 0 : _a.getRoot()) === workspace.rootSplit)
    return;
  let mainLeaf = null;
  workspace.iterateAllLeaves((leaf) => {
    if (leaf.getRoot() === workspace.rootSplit)
      mainLeaf = leaf;
  });
  if (mainLeaf)
    workspace.setActiveLeaf(mainLeaf, { focus: true });
}
async function openInMainTab(app, viewType, state) {
  const { workspace } = app;
  focusMainWorkspace(app);
  const leaf = workspace.getLeaf("tab");
  await leaf.setViewState({ type: viewType, active: true, state });
  workspace.revealLeaf(leaf);
  return leaf;
}

// src/download/downloadPost.ts
function normalizeVaultFolder(input) {
  return input.trim().replace(/^\/+|\/+$/g, "").replace(/\\/g, "/");
}
function resolveDownloadFolder(settings) {
  const folder = normalizeVaultFolder(settings.postDownloadFolder);
  return folder || DEFAULT_SETTINGS.postDownloadFolder;
}
function postSourceFromDetail(detail) {
  var _a;
  if ((_a = detail.source) == null ? void 0 : _a.trim())
    return detail.source;
  if (detail.markdown != null) {
    const fm = detail.frontmatter && typeof detail.frontmatter === "object" ? { ...detail.frontmatter } : { title: detail.title, date: detail.date };
    return serializeFrontmatter(fm, detail.markdown);
  }
  throw new Error("\u65E0\u6CD5\u83B7\u53D6\u6587\u7AE0\u6E90\u7801\uFF1A\u8BF7\u786E\u8BA4 API Token \u6216\u767B\u5F55\u72B6\u6001\u6709\u6548\uFF08\u7BA1\u7406\u5458\u6743\u9650\uFF09");
}
function withLocalFrontmatter(source, slug, settings) {
  const publishedKey = settings.publishedUrlKey || "published_url";
  const { frontmatter, content } = splitMarkdown(source);
  const merged = mergeFrontmatter(frontmatter, {
    slug,
    [publishedKey]: postPublicUrl(settings.siteUrl, slug)
  });
  return serializeFrontmatter(merged, content);
}
var PostDownloader = class {
  constructor(app, api, getSettings) {
    this.app = app;
    this.api = api;
    this.getSettings = getSettings;
  }
  async downloadAndOpen(slug) {
    const settings = this.getSettings();
    const folder = resolveDownloadFolder(settings);
    if (!folder)
      throw new Error("\u8BF7\u5148\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u6587\u7AE0\u4E0B\u8F7D\u76EE\u5F55");
    const filePath = `${folder}/${slug}.md`;
    const localFile = this.app.vault.getAbstractFileByPath(filePath);
    if (localFile instanceof import_obsidian6.TFile) {
      await this.openFile(localFile);
      return;
    }
    new import_obsidian6.Notice("\u6B63\u5728\u4E0B\u8F7D\u6587\u7AE0\u2026", 2e3);
    const detail = await this.api.getPost(slug);
    const rawSource = postSourceFromDetail(detail);
    const source = withLocalFrontmatter(rawSource, slug, settings);
    await this.ensureFolder(folder);
    const file = await this.writePostFile(filePath, source);
    await this.openFile(file);
    new import_obsidian6.Notice(`\u5DF2\u4E0B\u8F7D\u5E76\u6253\u5F00\uFF1A${detail.title}`);
  }
  async writePostFile(filePath, source) {
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof import_obsidian6.TFile) {
      await this.app.vault.modify(existing, source);
      return existing;
    }
    if (existing)
      throw new Error(`\u65E0\u6CD5\u5199\u5165\uFF1A${filePath} \u8DEF\u5F84\u5DF2\u88AB\u5360\u7528`);
    try {
      return await this.app.vault.create(filePath, source);
    } catch (error) {
      const retry = this.app.vault.getAbstractFileByPath(filePath);
      if (retry instanceof import_obsidian6.TFile) {
        await this.app.vault.modify(retry, source);
        return retry;
      }
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`\u5199\u5165\u6587\u4EF6\u5931\u8D25\uFF08${filePath}\uFF09\uFF1A${msg}`);
    }
  }
  async ensureFolder(folder) {
    const parts = folder.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      const existing = this.app.vault.getAbstractFileByPath(current);
      if (existing instanceof import_obsidian6.TFile)
        throw new Error(`\u4E0B\u8F7D\u76EE\u5F55\u65E0\u6548\uFF1A${current} \u662F\u6587\u4EF6\u800C\u4E0D\u662F\u6587\u4EF6\u5939`);
      if (existing instanceof import_obsidian6.TFolder)
        continue;
      await this.app.vault.createFolder(current);
    }
  }
  findOpenLeaf(file) {
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const view = leaf.view;
      if (view && "file" in view) {
        const viewFile = view.file;
        if ((viewFile == null ? void 0 : viewFile.path) === file.path)
          return leaf;
      }
    }
    return null;
  }
  async openFile(file) {
    focusMainWorkspace(this.app);
    const existingLeaf = this.findOpenLeaf(file);
    if (existingLeaf) {
      this.app.workspace.setActiveLeaf(existingLeaf, { focus: true });
      return;
    }
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file, { active: true, state: { mode: "source" } });
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }
  /** 本地存在该文章时，移除 frontmatter 中的发布链接字段 */
  async clearLocalPublishedUrl(slug) {
    const settings = this.getSettings();
    const folder = resolveDownloadFolder(settings);
    const filePath = `${folder}/${slug}.md`;
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof import_obsidian6.TFile))
      return false;
    const source = await this.app.vault.read(file);
    const { frontmatter, content } = splitMarkdown(source);
    const keys = publishedUrlFrontmatterKeys(settings.publishedUrlKey || "published_url");
    let changed = false;
    for (const key of keys) {
      if (key in frontmatter) {
        delete frontmatter[key];
        changed = true;
      }
    }
    if (!changed)
      return false;
    await this.app.vault.modify(file, serializeFrontmatter(frontmatter, content));
    return true;
  }
};
async function openPostForEdit(app, downloader, slug) {
  try {
    await downloader.downloadAndOpen(slug);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    new import_obsidian6.Notice(`\u6253\u5F00\u5931\u8D25\uFF1A${message}`, 8e3);
    console.error("[aiovtue-valaxy-sync] openPostForEdit failed:", error);
  }
}

// src/views/AdminPanelView.ts
var import_obsidian11 = require("obsidian");

// src/preview/previewPost.ts
var import_obsidian7 = require("obsidian");
var PostPreviewModal = class extends import_obsidian7.Modal {
  constructor(app, postTitle, source) {
    super(app);
    this.postTitle = postTitle;
    this.source = source;
    this.component = new import_obsidian7.Component();
  }
  onOpen() {
    const { contentEl, titleEl, modalEl } = this;
    titleEl.setText(this.postTitle);
    modalEl.addClass("vax-post-preview-modal");
    contentEl.addClass("vax-post-preview-modal__content");
    const { frontmatter, content } = splitMarkdown(this.source);
    const date = frontmatter.date;
    if (date != null && String(date).trim()) {
      contentEl.createDiv({
        cls: "vax-post-preview-meta",
        text: String(date)
      });
    }
    const scroll = contentEl.createDiv({ cls: "vax-post-preview-scroll" });
    const container = scroll.createDiv({
      cls: "markdown-preview-view markdown-rendered vax-post-preview-body"
    });
    void import_obsidian7.MarkdownRenderer.render(this.app, content, container, "", this.component);
  }
  onClose() {
    this.component.unload();
    this.contentEl.empty();
    this.modalEl.removeClass("vax-post-preview-modal");
  }
};
async function openPostPreview(app, api, slug, title) {
  try {
    new import_obsidian7.Notice("\u6B63\u5728\u52A0\u8F7D\u9884\u89C8\u2026", 1500);
    const detail = await api.getPost(slug);
    const source = postSourceFromDetail(detail);
    new PostPreviewModal(app, title || detail.title, source).open();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    new import_obsidian7.Notice(`\u9884\u89C8\u5931\u8D25\uFF1A${message}`, 8e3);
    console.error("[aiovtue-valaxy-sync] openPostPreview failed:", error);
  }
}

// src/modals/EditorModal.ts
var import_obsidian8 = require("obsidian");
// —— HTML 文件编辑器 ——
var HtmlFileEditorModal = class extends import_obsidian8.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.payload = {
      slug: options.initial.slug || "",
      title: options.initial.title || "",
      description: options.initial.description || "",
      content: options.initial.content || ""
    };
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText(this.options.isNew ? "\u65B0\u5EFA HTML \u6587\u4EF6" : "\u7F16\u8F91 HTML \u6587\u4EF6");
    contentEl.createEl("p", {
      text: "\u53D1\u5E03\u540E\u53EF\u901A\u8FC7 /{slug}.html \u8BBF\u95EE\u3002\u6587\u4EF6\u540D\u4EC5\u652F\u6301\u5B57\u6BCD\u3001\u6570\u5B57\u4E0E\u8FDE\u5B57\u7B26\u3002",
      cls: "vax-modal-hint"
    });
    const errorEl = contentEl.createDiv({ cls: "vax-error" });
    const slugInput = this.addField(contentEl, "\u6587\u4EF6\u540D", this.payload.slug, "my-page");
    if (!this.options.isNew)
      slugInput.disabled = true;
    const titleInput = this.addField(contentEl, "\u6807\u9898", this.payload.title, "\u9875\u9762\u6807\u9898");
    const descInput = this.addField(contentEl, "\u63CF\u8FF0\uFF08\u53EF\u9009\uFF09", this.payload.description, "\u7528\u4E8E\u5217\u8868\u5C55\u793A");
    const codeWrap = contentEl.createDiv({ cls: "vax-field" });
    codeWrap.createEl("label", { text: "HTML \u5185\u5BB9", cls: "vax-field__label" });
    const textarea = codeWrap.createEl("textarea", { cls: "vax-editor-textarea vax-editor-textarea--code" });
    textarea.value = this.payload.content;
    textarea.spellcheck = false;
    appendModalActions(contentEl, [
      { label: "\u53D6\u6D88", onClick: () => this.close() },
      {
        label: "\u4FDD\u5B58",
        cta: true,
        onClick: async () => {
          errorEl.setText("");
          const slug = slugInput.value.trim().replace(/\.html$/i, "");
          const title = titleInput.value.trim();
          const content = textarea.value;
          if (!slug) {
            errorEl.setText("\u6587\u4EF6\u540D\u4E0D\u80FD\u4E3A\u7A7A");
            return;
          }
          if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
            errorEl.setText("\u6587\u4EF6\u540D\u4EC5\u652F\u6301\u5B57\u6BCD\u3001\u6570\u5B57\u4E0E\u8FDE\u5B57\u7B26\uFF0C\u4E14\u9700\u4EE5\u5B57\u6BCD\u6216\u6570\u5B57\u5F00\u5934");
            return;
          }
          if (!title) {
            errorEl.setText("\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A");
            return;
          }
          if (!content.trim()) {
            errorEl.setText("HTML \u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
            return;
          }
          try {
            await this.options.onSave({ slug, title, description: descInput.value.trim(), content });
            await this.options.onSaved();
            this.close();
          } catch (error) {
            errorEl.setText(error instanceof Error ? error.message : "\u4FDD\u5B58\u5931\u8D25");
          }
        }
      }
    ]);
  }
  addField(parent, label, value, placeholder) {
    const wrap = parent.createDiv({ cls: "vax-field" });
    wrap.createEl("label", { text: label, cls: "vax-field__label" });
    const input = wrap.createEl("input", { type: "text", cls: "vax-field__input" });
    input.value = value || "";
    if (placeholder)
      input.placeholder = placeholder;
    return input;
  }
};
// —— 站点设置编辑器（对应后台「站点设置」页）——
var SITE_SETTINGS_SECTIONS = [
  {
    key: "basic",
    title: "\u7AD9\u70B9\u57FA\u7840\u4FE1\u606F",
    hint: "\u5BF9\u5E94 site.config.ts\uFF0C\u4FDD\u5B58\u540E\u524D\u53F0\u5237\u65B0\u5373\u751F\u6548\u3002",
    fields: [
      { path: "url", label: "\u7AD9\u70B9 URL", placeholder: "https://example.com" },
      { path: "title", label: "\u7AD9\u70B9\u6807\u9898" },
      { path: "subtitle", label: "\u7AD9\u70B9\u526F\u6807\u9898" },
      { path: "description", label: "\u7AD9\u70B9\u63CF\u8FF0", type: "textarea" },
      { path: "lang", label: "\u8BED\u8A00", placeholder: "zh-CN" },
      { path: "authorName", label: "\u4F5C\u8005\u540D" },
      { path: "avatar", label: "\u7AD9\u957F\u5934\u50CF URL" },
      { path: "authorStatus.emoji", label: "\u4F5C\u8005\u72B6\u6001\u8868\u60C5", placeholder: "\u{1F338}" },
      { path: "authorStatus.message", label: "\u4F5C\u8005\u72B6\u6001\u6587\u5B57" },
      { path: "favicon", label: "\u7AD9\u70B9\u56FE\u6807 favicon", placeholder: "/favicon.png" },
      { path: "themePrimary", label: "\u4E3B\u9898\u8272", type: "color", placeholder: "#DF9193" },
      { path: "defaultCover", label: "\u6587\u7AE0\u9ED8\u8BA4\u5C01\u9762" },
      { path: "itemsPerPage", label: "\u6BCF\u9875\u6587\u7AE0\u6570", type: "number" }
    ]
  },
  {
    key: "hero",
    title: "\u9996\u9875 Hero",
    hint: "\u5BF9\u5E94 valaxy.config.ts \u7684 themeConfig.hero\u3002",
    fields: [
      { path: "hero.title", label: "\u9996\u9875\u5927\u6807\u9898" },
      { path: "hero.motto", label: "\u683C\u8A00 / \u526F\u6807\u9898" },
      { path: "hero.playerUrl", label: "\u64AD\u653E\u5668\u89C6\u9891\u5730\u5740" },
      { path: "hero.style", label: "\u6307\u793A\u70B9\u6837\u5F0F", placeholder: "dot" },
      { path: "hero.urls", label: "\u80CC\u666F\u56FE / \u89C6\u9891\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09", type: "list" },
      { path: "hero.randomUrls", label: "\u968F\u673A\u80CC\u666F", type: "checkbox" },
      { path: "hero.fixedImg", label: "\u56FA\u5B9A\u80CC\u666F\u56FE", type: "checkbox" },
      { path: "hero.typewriter", label: "\u6253\u5B57\u673A\u6548\u679C", type: "checkbox" },
      { path: "hero.enableHitokoto", label: "\u4E00\u8A00", type: "checkbox" }
    ]
  },
  {
    key: "navbar",
    title: "\u9876\u680F\u4E0E\u9875\u811A",
    fields: [
      { path: "navbar.title", label: "\u9876\u680F\u6587\u5B57\uFF08\u7528 | \u5206\u9694\u591A\u6BB5\u7740\u8272\uFF09", type: "pipe-list" },
      { path: "navbar.subTitle", label: "\u9876\u680F\u526F\u6807\u9898" },
      { path: "footer.runtimeSince", label: "\u9875\u811A\u8BA1\u65F6\u8D77\u59CB", placeholder: "2024-01-01" },
      { path: "footer.since", label: "\u5EFA\u7AD9\u5E74\u4EFD", type: "number" },
      { path: "footer.icp", label: "\u5907\u6848\u4FE1\u606F\uFF08\u652F\u6301 HTML\uFF09", type: "textarea" }
    ]
  },
  {
    key: "styles",
    title: "\u5217\u8868\u9875\u6837\u5F0F",
    fields: [
      { path: "pageStyles.categories", label: "\u5206\u7C7B\u9875", type: "select", options: [["list", "\u5217\u8868"], ["chart", "\u56FE\u8868"]] },
      { path: "pageStyles.archives", label: "\u5F52\u6863\u9875", type: "select", options: [["list", "\u5217\u8868"], ["chart", "\u56FE\u8868"]] },
      { path: "pageStyles.archivesStartMonth", label: "\u5F52\u6863\u8D77\u59CB\u6708\u4EFD", placeholder: "2024-01" },
      { path: "pageStyles.tags", label: "\u6807\u7B7E\u9875", type: "select", options: [["list", "\u5217\u8868"], ["chart", "\u56FE\u8868"]] },
      { path: "pageStyles.tagsChartLength", label: "\u6807\u7B7E\u56FE\u8868\u6570\u91CF", type: "number" }
    ]
  }
];
function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => acc == null ? void 0 : acc[key], obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  let cursor = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (cursor[key] == null || typeof cursor[key] !== "object")
      cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
  return obj;
}
var SiteSettingsEditor = class {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.form = JSON.parse(JSON.stringify(options.initial || {}));
  }
  render() {
    this.container.empty();
    const section = this.container.createDiv({ cls: "vax-admin-section vax-admin-section--settings" });
    renderSectionHeader(section, {
      title: "\u7AD9\u70B9\u8BBE\u7F6E",
      subtitle: "\u4FEE\u6539\u7AD9\u70B9\u540D\u79F0\u3001\u5934\u50CF\u3001\u4E3B\u9898\u8272\u3001\u9996\u9875\u4E0E\u9875\u811A\u7B49\u4FE1\u606F",
      actions: []
    });
    for (const group of SITE_SETTINGS_SECTIONS) {
      const groupEl = section.createDiv({ cls: "vax-settings-group" });
      groupEl.createEl("h4", { text: group.title, cls: "vax-settings-group__title" });
      if (group.hint)
        groupEl.createEl("p", { text: group.hint, cls: "vax-modal-hint" });
      const grid = groupEl.createDiv({ cls: "vax-settings-grid" });
      for (const field of group.fields)
        this.renderField(grid, field);
    }
    this.renderSocial(section);
    this.renderSponsor(section);
    const actions = section.createDiv({ cls: "vax-settings-actions" });
    const resetBtn = actions.createEl("button", { text: "\u6062\u590D\u9ED8\u8BA4" });
    resetBtn.onclick = async () => {
      if (!confirm("\u786E\u5B9A\u6062\u590D\u4E3A\u914D\u7F6E\u6587\u4EF6\u91CC\u7684\u9ED8\u8BA4\u503C\u5417\uFF1F\u5F53\u524D\u4FDD\u5B58\u7684\u8BBE\u7F6E\u4F1A\u88AB\u6E05\u9664\u3002"))
        return;
      try {
        this.options.onStatus("\u6062\u590D\u4E2D\u2026");
        this.form = await this.options.onReset();
        this.options.onStatus("");
        this.render();
      } catch (error) {
        this.options.onStatus(error instanceof Error ? error.message : "\u6062\u590D\u5931\u8D25", true);
      }
    };
    const saveBtn = actions.createEl("button", { text: "\u4FDD\u5B58\u8BBE\u7F6E", cls: "mod-cta" });
    saveBtn.onclick = async () => {
      try {
        saveBtn.disabled = true;
        this.options.onStatus("\u4FDD\u5B58\u4E2D\u2026");
        this.form = await this.options.onSave(JSON.parse(JSON.stringify(this.form)));
        this.options.onStatus("");
        this.render();
      } catch (error) {
        this.options.onStatus(error instanceof Error ? error.message : "\u4FDD\u5B58\u5931\u8D25", true);
      } finally {
        saveBtn.disabled = false;
      }
    };
  }
  renderField(parent, field) {
    const wrap = parent.createDiv({ cls: `vax-field vax-field--${field.type || "text"}` });
    const current = getPath(this.form, field.path);
    if (field.type === "checkbox") {
      const label = wrap.createEl("label", { cls: "vax-field__checkbox" });
      const input = label.createEl("input", { type: "checkbox" });
      input.checked = Boolean(current);
      input.onchange = () => setPath(this.form, field.path, input.checked);
      label.createSpan({ text: field.label });
      return;
    }
    wrap.createEl("label", { text: field.label, cls: "vax-field__label" });
    if (field.type === "textarea" || field.type === "list") {
      const area = wrap.createEl("textarea", { cls: "vax-field__input" });
      area.rows = field.type === "list" ? 5 : 2;
      area.value = field.type === "list" ? (Array.isArray(current) ? current.join("\n") : "") : (current || "");
      if (field.placeholder)
        area.placeholder = field.placeholder;
      area.oninput = () => {
        if (field.type === "list")
          setPath(this.form, field.path, area.value.split("\n").map((v) => v.trim()).filter(Boolean));
        else
          setPath(this.form, field.path, area.value);
      };
      return;
    }
    if (field.type === "pipe-list") {
      const input2 = wrap.createEl("input", { type: "text", cls: "vax-field__input" });
      input2.value = Array.isArray(current) ? current.join("|") : (current || "");
      input2.placeholder = field.placeholder || "\u5B57\u6BB5A|\u5B57\u6BB5B";
      input2.oninput = () => setPath(this.form, field.path, input2.value.split("|").map((v) => v.trim()).filter(Boolean));
      return;
    }
    if (field.type === "select") {
      const select = wrap.createEl("select", { cls: "vax-field__input" });
      for (const [value, label] of field.options) {
        const opt = select.createEl("option", { text: label, value });
        if (String(current) === value)
          opt.selected = true;
      }
      select.onchange = () => setPath(this.form, field.path, select.value);
      return;
    }
    if (field.type === "color") {
      const row = wrap.createDiv({ cls: "vax-field__color-row" });
      const input3 = row.createEl("input", { type: "text", cls: "vax-field__input" });
      input3.value = current || "";
      input3.placeholder = field.placeholder || "#DF9193";
      const picker = row.createEl("input", { type: "color", cls: "vax-field__color" });
      picker.value = /^#[0-9a-f]{6}$/i.test(input3.value) ? input3.value : "#df9193";
      input3.oninput = () => {
        setPath(this.form, field.path, input3.value.trim());
        if (/^#[0-9a-f]{6}$/i.test(input3.value))
          picker.value = input3.value;
      };
      picker.oninput = () => {
        input3.value = picker.value;
        setPath(this.form, field.path, picker.value);
      };
      return;
    }
    const input = wrap.createEl("input", {
      type: field.type === "number" ? "number" : "text",
      cls: "vax-field__input"
    });
    input.value = current == null ? "" : String(current);
    if (field.placeholder)
      input.placeholder = field.placeholder;
    input.oninput = () => {
      setPath(this.form, field.path, field.type === "number" ? Number(input.value) : input.value);
    };
  }
  renderSocial(section) {
    const group = section.createDiv({ cls: "vax-settings-group" });
    group.createEl("h4", { text: "\u793E\u4EA4\u94FE\u63A5", cls: "vax-settings-group__title" });
    const list = group.createDiv({ cls: "vax-repeater" });
    const items = Array.isArray(this.form.social) ? this.form.social : (this.form.social = []);
    const rebuild = () => {
      list.empty();
      items.forEach((item, index) => {
        const row = list.createDiv({ cls: "vax-repeater__row" });
        const mk = (key, placeholder) => {
          const input = row.createEl("input", { type: "text", cls: "vax-field__input" });
          input.value = item[key] || "";
          input.placeholder = placeholder;
          input.oninput = () => {
            item[key] = input.value;
          };
          return input;
        };
        mk("name", "\u540D\u79F0");
        mk("link", "\u94FE\u63A5");
        mk("icon", "\u56FE\u6807\uFF0Ci-ri-github-line");
        mk("color", "\u989C\u8272");
        const acts = row.createDiv({ cls: "vax-repeater__actions" });
        const up = acts.createEl("button", { text: "\u2191" });
        up.onclick = () => {
          if (index === 0)
            return;
          [items[index - 1], items[index]] = [items[index], items[index - 1]];
          rebuild();
        };
        const down = acts.createEl("button", { text: "\u2193" });
        down.onclick = () => {
          if (index === items.length - 1)
            return;
          [items[index + 1], items[index]] = [items[index], items[index + 1]];
          rebuild();
        };
        const del = acts.createEl("button", { text: "\u5220\u9664", cls: "mod-warning" });
        del.onclick = () => {
          items.splice(index, 1);
          rebuild();
        };
      });
      const add = list.createEl("button", { text: "+ \u6DFB\u52A0\u793E\u4EA4\u94FE\u63A5", cls: "vax-repeater__add" });
      add.onclick = () => {
        items.push({ name: "", link: "", icon: "i-ri-link", color: "#0078e7" });
        rebuild();
      };
    };
    rebuild();
  }
  renderSponsor(section) {
    const group = section.createDiv({ cls: "vax-settings-group" });
    group.createEl("h4", { text: "\u6253\u8D4F", cls: "vax-settings-group__title" });
    if (!this.form.sponsor || typeof this.form.sponsor !== "object")
      this.form.sponsor = { enable: true, title: "", methods: [] };
    if (!Array.isArray(this.form.sponsor.methods))
      this.form.sponsor.methods = [];
    const enableWrap = group.createDiv({ cls: "vax-field vax-field--checkbox" });
    const enableLabel = enableWrap.createEl("label", { cls: "vax-field__checkbox" });
    const enableInput = enableLabel.createEl("input", { type: "checkbox" });
    enableInput.checked = Boolean(this.form.sponsor.enable);
    enableInput.onchange = () => {
      this.form.sponsor.enable = enableInput.checked;
    };
    enableLabel.createSpan({ text: "\u542F\u7528\u6253\u8D4F" });
    const titleWrap = group.createDiv({ cls: "vax-field" });
    titleWrap.createEl("label", { text: "\u6253\u8D4F\u6807\u9898", cls: "vax-field__label" });
    const titleInput = titleWrap.createEl("input", { type: "text", cls: "vax-field__input" });
    titleInput.value = this.form.sponsor.title || "";
    titleInput.oninput = () => {
      this.form.sponsor.title = titleInput.value;
    };
    const list = group.createDiv({ cls: "vax-repeater" });
    const methods = this.form.sponsor.methods;
    const rebuild = () => {
      list.empty();
      methods.forEach((item, index) => {
        const row = list.createDiv({ cls: "vax-repeater__row" });
        const mk = (key, placeholder) => {
          const input = row.createEl("input", { type: "text", cls: "vax-field__input" });
          input.value = item[key] || "";
          input.placeholder = placeholder;
          input.oninput = () => {
            item[key] = input.value;
          };
        };
        mk("name", "\u65B9\u5F0F\u540D\u79F0");
        mk("url", "\u4E8C\u7EF4\u7801\u56FE\u7247\u5730\u5740");
        mk("icon", "\u56FE\u6807");
        mk("color", "\u989C\u8272");
        const acts = row.createDiv({ cls: "vax-repeater__actions" });
        const del = acts.createEl("button", { text: "\u5220\u9664", cls: "mod-warning" });
        del.onclick = () => {
          methods.splice(index, 1);
          rebuild();
        };
      });
      const add = list.createEl("button", { text: "+ \u6DFB\u52A0\u6253\u8D4F\u65B9\u5F0F", cls: "vax-repeater__add" });
      add.onclick = () => {
        methods.push({ name: "", url: "", icon: "i-ri-wallet-line", color: "#0078e7" });
        rebuild();
      };
    };
    rebuild();
  }
};
var EditorModal = class extends import_obsidian8.Modal {
  constructor(app, title, initial, onSave, options) {
    super(app);
    this.title = title;
    this.initial = initial;
    this.onSave = onSave;
    this.options = options;
    this.saved = false;
  }
  onOpen() {
    var _a;
    const { contentEl, titleEl } = this;
    titleEl.setText(this.title);
    if ((_a = this.options) == null ? void 0 : _a.hint) {
      contentEl.createEl("p", { text: this.options.hint, cls: "vax-modal-hint" });
    }
    const textarea = contentEl.createEl("textarea", {
      cls: "vax-editor-textarea",
      text: this.initial
    });
    textarea.value = this.initial;
    textarea.spellcheck = false;
    appendModalActions(contentEl, [
      {
        label: "\u53D6\u6D88",
        onClick: () => this.close()
      },
      {
        label: "\u4FDD\u5B58",
        cta: true,
        onClick: async () => {
          try {
            await this.onSave(textarea.value);
            this.saved = true;
            this.close();
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            contentEl.createDiv({ text: msg, cls: "vax-error" });
          }
        }
      }
    ]);
  }
  wasSaved() {
    return this.saved;
  }
};
var ConfirmModal = class extends import_obsidian8.Modal {
  constructor(app, message, onConfirm, onDismiss) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
    this.onDismiss = onDismiss;
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText("\u786E\u8BA4");
    contentEl.createEl("p", { text: this.message });
    appendModalActions(contentEl, [
      {
        label: "\u53D6\u6D88",
        onClick: async () => {
          if (this.onDismiss)
            await this.onDismiss();
          this.close();
        }
      },
      {
        label: "\u786E\u5B9A",
        warning: true,
        onClick: async () => {
          await this.onConfirm();
          this.close();
        }
      }
    ]);
  }
};

// src/modals/LinksEditorModals.ts
var import_obsidian9 = require("obsidian");

// node_modules/yaml/browser/dist/index.js
var dist_exports = {};
__export(dist_exports, {
  Alias: () => Alias,
  CST: () => cst_exports,
  Composer: () => Composer,
  Document: () => Document,
  Lexer: () => Lexer,
  LineCounter: () => LineCounter,
  Pair: () => Pair,
  Parser: () => Parser,
  Scalar: () => Scalar,
  Schema: () => Schema,
  YAMLError: () => YAMLError,
  YAMLMap: () => YAMLMap,
  YAMLParseError: () => YAMLParseError,
  YAMLSeq: () => YAMLSeq,
  YAMLWarning: () => YAMLWarning,
  isAlias: () => isAlias,
  isCollection: () => isCollection,
  isDocument: () => isDocument,
  isMap: () => isMap,
  isNode: () => isNode,
  isPair: () => isPair,
  isScalar: () => isScalar,
  isSeq: () => isSeq,
  parse: () => parse,
  parseAllDocuments: () => parseAllDocuments,
  parseDocument: () => parseDocument,
  stringify: () => stringify3,
  visit: () => visit,
  visitAsync: () => visitAsync
});

// node_modules/yaml/browser/dist/nodes/identity.js
var ALIAS = Symbol.for("yaml.alias");
var DOC = Symbol.for("yaml.document");
var MAP = Symbol.for("yaml.map");
var PAIR = Symbol.for("yaml.pair");
var SCALAR = Symbol.for("yaml.scalar");
var SEQ = Symbol.for("yaml.seq");
var NODE_TYPE = Symbol.for("yaml.node.type");
var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
function isCollection(node) {
  if (node && typeof node === "object")
    switch (node[NODE_TYPE]) {
      case MAP:
      case SEQ:
        return true;
    }
  return false;
}
function isNode(node) {
  if (node && typeof node === "object")
    switch (node[NODE_TYPE]) {
      case ALIAS:
      case MAP:
      case SCALAR:
      case SEQ:
        return true;
    }
  return false;
}
var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;

// node_modules/yaml/browser/dist/visit.js
var BREAK = Symbol("break visit");
var SKIP = Symbol("skip children");
var REMOVE = Symbol("remove node");
function visit(node, visitor) {
  const visitor_ = initVisitor(visitor);
  if (isDocument(node)) {
    const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
    if (cd === REMOVE)
      node.contents = null;
  } else
    visit_(null, node, visitor_, Object.freeze([]));
}
visit.BREAK = BREAK;
visit.SKIP = SKIP;
visit.REMOVE = REMOVE;
function visit_(key, node, visitor, path) {
  const ctrl = callVisitor(key, node, visitor, path);
  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl);
    return visit_(key, ctrl, visitor, path);
  }
  if (typeof ctrl !== "symbol") {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node));
      for (let i = 0; i < node.items.length; ++i) {
        const ci = visit_(i, node.items[i], visitor, path);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK)
          return BREAK;
        else if (ci === REMOVE) {
          node.items.splice(i, 1);
          i -= 1;
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node));
      const ck = visit_("key", node.key, visitor, path);
      if (ck === BREAK)
        return BREAK;
      else if (ck === REMOVE)
        node.key = null;
      const cv = visit_("value", node.value, visitor, path);
      if (cv === BREAK)
        return BREAK;
      else if (cv === REMOVE)
        node.value = null;
    }
  }
  return ctrl;
}
async function visitAsync(node, visitor) {
  const visitor_ = initVisitor(visitor);
  if (isDocument(node)) {
    const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
    if (cd === REMOVE)
      node.contents = null;
  } else
    await visitAsync_(null, node, visitor_, Object.freeze([]));
}
visitAsync.BREAK = BREAK;
visitAsync.SKIP = SKIP;
visitAsync.REMOVE = REMOVE;
async function visitAsync_(key, node, visitor, path) {
  const ctrl = await callVisitor(key, node, visitor, path);
  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl);
    return visitAsync_(key, ctrl, visitor, path);
  }
  if (typeof ctrl !== "symbol") {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node));
      for (let i = 0; i < node.items.length; ++i) {
        const ci = await visitAsync_(i, node.items[i], visitor, path);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK)
          return BREAK;
        else if (ci === REMOVE) {
          node.items.splice(i, 1);
          i -= 1;
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node));
      const ck = await visitAsync_("key", node.key, visitor, path);
      if (ck === BREAK)
        return BREAK;
      else if (ck === REMOVE)
        node.key = null;
      const cv = await visitAsync_("value", node.value, visitor, path);
      if (cv === BREAK)
        return BREAK;
      else if (cv === REMOVE)
        node.value = null;
    }
  }
  return ctrl;
}
function initVisitor(visitor) {
  if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
    return Object.assign({
      Alias: visitor.Node,
      Map: visitor.Node,
      Scalar: visitor.Node,
      Seq: visitor.Node
    }, visitor.Value && {
      Map: visitor.Value,
      Scalar: visitor.Value,
      Seq: visitor.Value
    }, visitor.Collection && {
      Map: visitor.Collection,
      Seq: visitor.Collection
    }, visitor);
  }
  return visitor;
}
function callVisitor(key, node, visitor, path) {
  var _a, _b, _c, _d, _e;
  if (typeof visitor === "function")
    return visitor(key, node, path);
  if (isMap(node))
    return (_a = visitor.Map) == null ? void 0 : _a.call(visitor, key, node, path);
  if (isSeq(node))
    return (_b = visitor.Seq) == null ? void 0 : _b.call(visitor, key, node, path);
  if (isPair(node))
    return (_c = visitor.Pair) == null ? void 0 : _c.call(visitor, key, node, path);
  if (isScalar(node))
    return (_d = visitor.Scalar) == null ? void 0 : _d.call(visitor, key, node, path);
  if (isAlias(node))
    return (_e = visitor.Alias) == null ? void 0 : _e.call(visitor, key, node, path);
  return void 0;
}
function replaceNode(key, path, node) {
  const parent = path[path.length - 1];
  if (isCollection(parent)) {
    parent.items[key] = node;
  } else if (isPair(parent)) {
    if (key === "key")
      parent.key = node;
    else
      parent.value = node;
  } else if (isDocument(parent)) {
    parent.contents = node;
  } else {
    const pt = isAlias(parent) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${pt} parent`);
  }
}

// node_modules/yaml/browser/dist/doc/directives.js
var escapeChars = {
  "!": "%21",
  ",": "%2C",
  "[": "%5B",
  "]": "%5D",
  "{": "%7B",
  "}": "%7D"
};
var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
var Directives = class _Directives {
  constructor(yaml, tags) {
    this.docStart = null;
    this.docEnd = false;
    this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
    this.tags = Object.assign({}, _Directives.defaultTags, tags);
  }
  clone() {
    const copy = new _Directives(this.yaml, this.tags);
    copy.docStart = this.docStart;
    return copy;
  }
  /**
   * During parsing, get a Directives instance for the current document and
   * update the stream state according to the current version's spec.
   */
  atDocument() {
    const res = new _Directives(this.yaml, this.tags);
    switch (this.yaml.version) {
      case "1.1":
        this.atNextDocument = true;
        break;
      case "1.2":
        this.atNextDocument = false;
        this.yaml = {
          explicit: _Directives.defaultYaml.explicit,
          version: "1.2"
        };
        this.tags = Object.assign({}, _Directives.defaultTags);
        break;
    }
    return res;
  }
  /**
   * @param onError - May be called even if the action was successful
   * @returns `true` on success
   */
  add(line, onError) {
    if (this.atNextDocument) {
      this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
      this.tags = Object.assign({}, _Directives.defaultTags);
      this.atNextDocument = false;
    }
    const parts = line.trim().split(/[ \t]+/);
    const name = parts.shift();
    switch (name) {
      case "%TAG": {
        if (parts.length !== 2) {
          onError(0, "%TAG directive should contain exactly two parts");
          if (parts.length < 2)
            return false;
        }
        const [handle, prefix] = parts;
        this.tags[handle] = prefix;
        return true;
      }
      case "%YAML": {
        this.yaml.explicit = true;
        if (parts.length !== 1) {
          onError(0, "%YAML directive should contain exactly one part");
          return false;
        }
        const [version] = parts;
        if (version === "1.1" || version === "1.2") {
          this.yaml.version = version;
          return true;
        } else {
          const isValid = /^\d+\.\d+$/.test(version);
          onError(6, `Unsupported YAML version ${version}`, isValid);
          return false;
        }
      }
      default:
        onError(0, `Unknown directive ${name}`, true);
        return false;
    }
  }
  /**
   * Resolves a tag, matching handles to those defined in %TAG directives.
   *
   * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
   *   `'!local'` tag, or `null` if unresolvable.
   */
  tagName(source, onError) {
    if (source === "!")
      return "!";
    if (source[0] !== "!") {
      onError(`Not a valid tag: ${source}`);
      return null;
    }
    if (source[1] === "<") {
      const verbatim = source.slice(2, -1);
      if (verbatim === "!" || verbatim === "!!") {
        onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
        return null;
      }
      if (source[source.length - 1] !== ">")
        onError("Verbatim tags must end with a >");
      return verbatim;
    }
    const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
    if (!suffix)
      onError(`The ${source} tag has no suffix`);
    const prefix = this.tags[handle];
    if (prefix) {
      try {
        return prefix + decodeURIComponent(suffix);
      } catch (error) {
        onError(String(error));
        return null;
      }
    }
    if (handle === "!")
      return source;
    onError(`Could not resolve tag: ${source}`);
    return null;
  }
  /**
   * Given a fully resolved tag, returns its printable string form,
   * taking into account current tag prefixes and defaults.
   */
  tagString(tag) {
    for (const [handle, prefix] of Object.entries(this.tags)) {
      if (tag.startsWith(prefix))
        return handle + escapeTagName(tag.substring(prefix.length));
    }
    return tag[0] === "!" ? tag : `!<${tag}>`;
  }
  toString(doc) {
    const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
    const tagEntries = Object.entries(this.tags);
    let tagNames;
    if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
      const tags = {};
      visit(doc.contents, (_key, node) => {
        if (isNode(node) && node.tag)
          tags[node.tag] = true;
      });
      tagNames = Object.keys(tags);
    } else
      tagNames = [];
    for (const [handle, prefix] of tagEntries) {
      if (handle === "!!" && prefix === "tag:yaml.org,2002:")
        continue;
      if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
        lines.push(`%TAG ${handle} ${prefix}`);
    }
    return lines.join("\n");
  }
};
Directives.defaultYaml = { explicit: false, version: "1.2" };
Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };

// node_modules/yaml/browser/dist/doc/anchors.js
function anchorIsValid(anchor) {
  if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
    const sa = JSON.stringify(anchor);
    const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
    throw new Error(msg);
  }
  return true;
}
function anchorNames(root) {
  const anchors = /* @__PURE__ */ new Set();
  visit(root, {
    Value(_key, node) {
      if (node.anchor)
        anchors.add(node.anchor);
    }
  });
  return anchors;
}
function findNewAnchor(prefix, exclude) {
  for (let i = 1; true; ++i) {
    const name = `${prefix}${i}`;
    if (!exclude.has(name))
      return name;
  }
}
function createNodeAnchors(doc, prefix) {
  const aliasObjects = [];
  const sourceObjects = /* @__PURE__ */ new Map();
  let prevAnchors = null;
  return {
    onAnchor: (source) => {
      aliasObjects.push(source);
      prevAnchors != null ? prevAnchors : prevAnchors = anchorNames(doc);
      const anchor = findNewAnchor(prefix, prevAnchors);
      prevAnchors.add(anchor);
      return anchor;
    },
    /**
     * With circular references, the source node is only resolved after all
     * of its child nodes are. This is why anchors are set only after all of
     * the nodes have been created.
     */
    setAnchors: () => {
      for (const source of aliasObjects) {
        const ref = sourceObjects.get(source);
        if (typeof ref === "object" && ref.anchor && (isScalar(ref.node) || isCollection(ref.node))) {
          ref.node.anchor = ref.anchor;
        } else {
          const error = new Error("Failed to resolve repeated object (this should not happen)");
          error.source = source;
          throw error;
        }
      }
    },
    sourceObjects
  };
}

// node_modules/yaml/browser/dist/doc/applyReviver.js
function applyReviver(reviver, obj, key, val) {
  if (val && typeof val === "object") {
    if (Array.isArray(val)) {
      for (let i = 0, len = val.length; i < len; ++i) {
        const v0 = val[i];
        const v1 = applyReviver(reviver, val, String(i), v0);
        if (v1 === void 0)
          delete val[i];
        else if (v1 !== v0)
          val[i] = v1;
      }
    } else if (val instanceof Map) {
      for (const k of Array.from(val.keys())) {
        const v0 = val.get(k);
        const v1 = applyReviver(reviver, val, k, v0);
        if (v1 === void 0)
          val.delete(k);
        else if (v1 !== v0)
          val.set(k, v1);
      }
    } else if (val instanceof Set) {
      for (const v0 of Array.from(val)) {
        const v1 = applyReviver(reviver, val, v0, v0);
        if (v1 === void 0)
          val.delete(v0);
        else if (v1 !== v0) {
          val.delete(v0);
          val.add(v1);
        }
      }
    } else {
      for (const [k, v0] of Object.entries(val)) {
        const v1 = applyReviver(reviver, val, k, v0);
        if (v1 === void 0)
          delete val[k];
        else if (v1 !== v0)
          val[k] = v1;
      }
    }
  }
  return reviver.call(obj, key, val);
}

// node_modules/yaml/browser/dist/nodes/toJS.js
function toJS(value, arg, ctx) {
  if (Array.isArray(value))
    return value.map((v, i) => toJS(v, String(i), ctx));
  if (value && typeof value.toJSON === "function") {
    if (!ctx || !hasAnchor(value))
      return value.toJSON(arg, ctx);
    const data = { aliasCount: 0, count: 1, res: void 0 };
    ctx.anchors.set(value, data);
    ctx.onCreate = (res2) => {
      data.res = res2;
      delete ctx.onCreate;
    };
    const res = value.toJSON(arg, ctx);
    if (ctx.onCreate)
      ctx.onCreate(res);
    return res;
  }
  if (typeof value === "bigint" && !(ctx == null ? void 0 : ctx.keep))
    return Number(value);
  return value;
}

// node_modules/yaml/browser/dist/nodes/Node.js
var NodeBase = class {
  constructor(type) {
    Object.defineProperty(this, NODE_TYPE, { value: type });
  }
  /** Create a copy of this node.  */
  clone() {
    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  /** A plain JavaScript representation of this node. */
  toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
    if (!isDocument(doc))
      throw new TypeError("A document argument is required");
    const ctx = {
      anchors: /* @__PURE__ */ new Map(),
      doc,
      keep: true,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
    };
    const res = toJS(this, "", ctx);
    if (typeof onAnchor === "function")
      for (const { count, res: res2 } of ctx.anchors.values())
        onAnchor(res2, count);
    return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  }
};

// node_modules/yaml/browser/dist/nodes/Alias.js
var Alias = class extends NodeBase {
  constructor(source) {
    super(ALIAS);
    this.source = source;
    Object.defineProperty(this, "tag", {
      set() {
        throw new Error("Alias nodes cannot have tags");
      }
    });
  }
  /**
   * Resolve the value of this alias within `doc`, finding the last
   * instance of the `source` anchor before this node.
   */
  resolve(doc, ctx) {
    if ((ctx == null ? void 0 : ctx.maxAliasCount) === 0)
      throw new ReferenceError("Alias resolution is disabled");
    let nodes;
    if (ctx == null ? void 0 : ctx.aliasResolveCache) {
      nodes = ctx.aliasResolveCache;
    } else {
      nodes = [];
      visit(doc, {
        Node: (_key, node) => {
          if (isAlias(node) || hasAnchor(node))
            nodes.push(node);
        }
      });
      if (ctx)
        ctx.aliasResolveCache = nodes;
    }
    let found = void 0;
    for (const node of nodes) {
      if (node === this)
        break;
      if (node.anchor === this.source)
        found = node;
    }
    return found;
  }
  toJSON(_arg, ctx) {
    if (!ctx)
      return { source: this.source };
    const { anchors, doc, maxAliasCount } = ctx;
    const source = this.resolve(doc, ctx);
    if (!source) {
      const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(msg);
    }
    let data = anchors.get(source);
    if (!data) {
      toJS(source, null, ctx);
      data = anchors.get(source);
    }
    if ((data == null ? void 0 : data.res) === void 0) {
      const msg = "This should not happen: Alias anchor was not resolved?";
      throw new ReferenceError(msg);
    }
    if (maxAliasCount >= 0) {
      data.count += 1;
      if (data.aliasCount === 0)
        data.aliasCount = getAliasCount(doc, source, anchors);
      if (data.count * data.aliasCount > maxAliasCount) {
        const msg = "Excessive alias count indicates a resource exhaustion attack";
        throw new ReferenceError(msg);
      }
    }
    return data.res;
  }
  toString(ctx, _onComment, _onChompKeep) {
    const src = `*${this.source}`;
    if (ctx) {
      anchorIsValid(this.source);
      if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(msg);
      }
      if (ctx.implicitKey)
        return `${src} `;
    }
    return src;
  }
};
function getAliasCount(doc, node, anchors) {
  if (isAlias(node)) {
    const source = node.resolve(doc);
    const anchor = anchors && source && anchors.get(source);
    return anchor ? anchor.count * anchor.aliasCount : 0;
  } else if (isCollection(node)) {
    let count = 0;
    for (const item of node.items) {
      const c = getAliasCount(doc, item, anchors);
      if (c > count)
        count = c;
    }
    return count;
  } else if (isPair(node)) {
    const kc = getAliasCount(doc, node.key, anchors);
    const vc = getAliasCount(doc, node.value, anchors);
    return Math.max(kc, vc);
  }
  return 1;
}

// node_modules/yaml/browser/dist/nodes/Scalar.js
var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
var Scalar = class extends NodeBase {
  constructor(value) {
    super(SCALAR);
    this.value = value;
  }
  toJSON(arg, ctx) {
    return (ctx == null ? void 0 : ctx.keep) ? this.value : toJS(this.value, arg, ctx);
  }
  toString() {
    return String(this.value);
  }
};
Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
Scalar.PLAIN = "PLAIN";
Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";

// node_modules/yaml/browser/dist/doc/createNode.js
var defaultTagPrefix = "tag:yaml.org,2002:";
function findTagObject(value, tagName, tags) {
  var _a;
  if (tagName) {
    const match = tags.filter((t) => t.tag === tagName);
    const tagObj = (_a = match.find((t) => !t.format)) != null ? _a : match[0];
    if (!tagObj)
      throw new Error(`Tag ${tagName} not found`);
    return tagObj;
  }
  return tags.find((t) => {
    var _a2;
    return ((_a2 = t.identify) == null ? void 0 : _a2.call(t, value)) && !t.format;
  });
}
function createNode(value, tagName, ctx) {
  var _a, _b, _c, _d;
  if (isDocument(value))
    value = value.contents;
  if (isNode(value))
    return value;
  if (isPair(value)) {
    const map2 = (_b = (_a = ctx.schema[MAP]).createNode) == null ? void 0 : _b.call(_a, ctx.schema, null, ctx);
    map2.items.push(value);
    return map2;
  }
  if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
    value = value.valueOf();
  }
  const { aliasDuplicateObjects, onAnchor, onTagObj, schema: schema4, sourceObjects } = ctx;
  let ref = void 0;
  if (aliasDuplicateObjects && value && typeof value === "object") {
    ref = sourceObjects.get(value);
    if (ref) {
      (_c = ref.anchor) != null ? _c : ref.anchor = onAnchor(value);
      return new Alias(ref.anchor);
    } else {
      ref = { anchor: null, node: null };
      sourceObjects.set(value, ref);
    }
  }
  if (tagName == null ? void 0 : tagName.startsWith("!!"))
    tagName = defaultTagPrefix + tagName.slice(2);
  let tagObj = findTagObject(value, tagName, schema4.tags);
  if (!tagObj) {
    if (value && typeof value.toJSON === "function") {
      value = value.toJSON();
    }
    if (!value || typeof value !== "object") {
      const node2 = new Scalar(value);
      if (ref)
        ref.node = node2;
      return node2;
    }
    tagObj = value instanceof Map ? schema4[MAP] : Symbol.iterator in Object(value) ? schema4[SEQ] : schema4[MAP];
  }
  if (onTagObj) {
    onTagObj(tagObj);
    delete ctx.onTagObj;
  }
  const node = (tagObj == null ? void 0 : tagObj.createNode) ? tagObj.createNode(ctx.schema, value, ctx) : typeof ((_d = tagObj == null ? void 0 : tagObj.nodeClass) == null ? void 0 : _d.from) === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar(value);
  if (tagName)
    node.tag = tagName;
  else if (!tagObj.default)
    node.tag = tagObj.tag;
  if (ref)
    ref.node = node;
  return node;
}

// node_modules/yaml/browser/dist/nodes/Collection.js
function collectionFromPath(schema4, path, value) {
  let v = value;
  for (let i = path.length - 1; i >= 0; --i) {
    const k = path[i];
    if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
      const a = [];
      a[k] = v;
      v = a;
    } else {
      v = /* @__PURE__ */ new Map([[k, v]]);
    }
  }
  return createNode(v, void 0, {
    aliasDuplicateObjects: false,
    keepUndefined: false,
    onAnchor: () => {
      throw new Error("This should not happen, please report a bug.");
    },
    schema: schema4,
    sourceObjects: /* @__PURE__ */ new Map()
  });
}
var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
var Collection = class extends NodeBase {
  constructor(type, schema4) {
    super(type);
    Object.defineProperty(this, "schema", {
      value: schema4,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  /**
   * Create a copy of this collection.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(schema4) {
    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    if (schema4)
      copy.schema = schema4;
    copy.items = copy.items.map((it) => isNode(it) || isPair(it) ? it.clone(schema4) : it);
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  /**
   * Adds a value to the collection. For `!!map` and `!!omap` the value must
   * be a Pair instance or a `{ key, value }` object, which may not have a key
   * that already exists in the map.
   */
  addIn(path, value) {
    if (isEmptyPath(path))
      this.add(value);
    else {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (isCollection(node))
        node.addIn(rest, value);
      else if (node === void 0 && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value));
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  }
  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(path) {
    const [key, ...rest] = path;
    if (rest.length === 0)
      return this.delete(key);
    const node = this.get(key, true);
    if (isCollection(node))
      return node.deleteIn(rest);
    else
      throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(path, keepScalar) {
    const [key, ...rest] = path;
    const node = this.get(key, true);
    if (rest.length === 0)
      return !keepScalar && isScalar(node) ? node.value : node;
    else
      return isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
  }
  hasAllNullValues(allowScalar) {
    return this.items.every((node) => {
      if (!isPair(node))
        return false;
      const n = node.value;
      return n == null || allowScalar && isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
    });
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   */
  hasIn(path) {
    const [key, ...rest] = path;
    if (rest.length === 0)
      return this.has(key);
    const node = this.get(key, true);
    return isCollection(node) ? node.hasIn(rest) : false;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path, value) {
    const [key, ...rest] = path;
    if (rest.length === 0) {
      this.set(key, value);
    } else {
      const node = this.get(key, true);
      if (isCollection(node))
        node.setIn(rest, value);
      else if (node === void 0 && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value));
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyComment.js
var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
function indentComment(comment, indent) {
  if (/^\n+$/.test(comment))
    return comment.substring(1);
  return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
}
var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;

// node_modules/yaml/browser/dist/stringify/foldFlowLines.js
var FOLD_FLOW = "flow";
var FOLD_BLOCK = "block";
var FOLD_QUOTED = "quoted";
function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
  if (!lineWidth || lineWidth < 0)
    return text;
  if (lineWidth < minContentWidth)
    minContentWidth = 0;
  const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
  if (text.length <= endStep)
    return text;
  const folds = [];
  const escapedFolds = {};
  let end = lineWidth - indent.length;
  if (typeof indentAtStart === "number") {
    if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
      folds.push(0);
    else
      end = lineWidth - indentAtStart;
  }
  let split = void 0;
  let prev = void 0;
  let overflow = false;
  let i = -1;
  let escStart = -1;
  let escEnd = -1;
  if (mode === FOLD_BLOCK) {
    i = consumeMoreIndentedLines(text, i, indent.length);
    if (i !== -1)
      end = i + endStep;
  }
  for (let ch; ch = text[i += 1]; ) {
    if (mode === FOLD_QUOTED && ch === "\\") {
      escStart = i;
      switch (text[i + 1]) {
        case "x":
          i += 3;
          break;
        case "u":
          i += 5;
          break;
        case "U":
          i += 9;
          break;
        default:
          i += 1;
      }
      escEnd = i;
    }
    if (ch === "\n") {
      if (mode === FOLD_BLOCK)
        i = consumeMoreIndentedLines(text, i, indent.length);
      end = i + indent.length + endStep;
      split = void 0;
    } else {
      if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
        const next = text[i + 1];
        if (next && next !== " " && next !== "\n" && next !== "	")
          split = i;
      }
      if (i >= end) {
        if (split) {
          folds.push(split);
          end = split + endStep;
          split = void 0;
        } else if (mode === FOLD_QUOTED) {
          while (prev === " " || prev === "	") {
            prev = ch;
            ch = text[i += 1];
            overflow = true;
          }
          const j = i > escEnd + 1 ? i - 2 : escStart - 1;
          if (escapedFolds[j])
            return text;
          folds.push(j);
          escapedFolds[j] = true;
          end = j + endStep;
          split = void 0;
        } else {
          overflow = true;
        }
      }
    }
    prev = ch;
  }
  if (overflow && onOverflow)
    onOverflow();
  if (folds.length === 0)
    return text;
  if (onFold)
    onFold();
  let res = text.slice(0, folds[0]);
  for (let i2 = 0; i2 < folds.length; ++i2) {
    const fold = folds[i2];
    const end2 = folds[i2 + 1] || text.length;
    if (fold === 0)
      res = `
${indent}${text.slice(0, end2)}`;
    else {
      if (mode === FOLD_QUOTED && escapedFolds[fold])
        res += `${text[fold]}\\`;
      res += `
${indent}${text.slice(fold + 1, end2)}`;
    }
  }
  return res;
}
function consumeMoreIndentedLines(text, i, indent) {
  let end = i;
  let start = i + 1;
  let ch = text[start];
  while (ch === " " || ch === "	") {
    if (i < start + indent) {
      ch = text[++i];
    } else {
      do {
        ch = text[++i];
      } while (ch && ch !== "\n");
      end = i;
      start = i + 1;
      ch = text[start];
    }
  }
  return end;
}

// node_modules/yaml/browser/dist/stringify/stringifyString.js
var getFoldOptions = (ctx, isBlock2) => ({
  indentAtStart: isBlock2 ? ctx.indent.length : ctx.indentAtStart,
  lineWidth: ctx.options.lineWidth,
  minContentWidth: ctx.options.minContentWidth
});
var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
function lineLengthOverLimit(str, lineWidth, indentLength) {
  if (!lineWidth || lineWidth < 0)
    return false;
  const limit = lineWidth - indentLength;
  const strLen = str.length;
  if (strLen <= limit)
    return false;
  for (let i = 0, start = 0; i < strLen; ++i) {
    if (str[i] === "\n") {
      if (i - start > limit)
        return true;
      start = i + 1;
      if (strLen - start <= limit)
        return false;
    }
  }
  return true;
}
function doubleQuotedString(value, ctx) {
  const json = JSON.stringify(value);
  if (ctx.options.doubleQuotedAsJSON)
    return json;
  const { implicitKey } = ctx;
  const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  let str = "";
  let start = 0;
  for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
    if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
      str += json.slice(start, i) + "\\ ";
      i += 1;
      start = i;
      ch = "\\";
    }
    if (ch === "\\")
      switch (json[i + 1]) {
        case "u":
          {
            str += json.slice(start, i);
            const code = json.substr(i + 2, 4);
            switch (code) {
              case "0000":
                str += "\\0";
                break;
              case "0007":
                str += "\\a";
                break;
              case "000b":
                str += "\\v";
                break;
              case "001b":
                str += "\\e";
                break;
              case "0085":
                str += "\\N";
                break;
              case "00a0":
                str += "\\_";
                break;
              case "2028":
                str += "\\L";
                break;
              case "2029":
                str += "\\P";
                break;
              default:
                if (code.substr(0, 2) === "00")
                  str += "\\x" + code.substr(2);
                else
                  str += json.substr(i, 6);
            }
            i += 5;
            start = i + 1;
          }
          break;
        case "n":
          if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
            i += 1;
          } else {
            str += json.slice(start, i) + "\n\n";
            while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
              str += "\n";
              i += 2;
            }
            str += indent;
            if (json[i + 2] === " ")
              str += "\\";
            i += 1;
            start = i + 1;
          }
          break;
        default:
          i += 1;
      }
  }
  str = start ? str + json.slice(start) : json;
  return implicitKey ? str : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
}
function singleQuotedString(value, ctx) {
  if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
    return doubleQuotedString(value, ctx);
  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
  return ctx.implicitKey ? res : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function quotedString(value, ctx) {
  const { singleQuote } = ctx.options;
  let qs;
  if (singleQuote === false)
    qs = doubleQuotedString;
  else {
    const hasDouble = value.includes('"');
    const hasSingle = value.includes("'");
    if (hasDouble && !hasSingle)
      qs = singleQuotedString;
    else if (hasSingle && !hasDouble)
      qs = doubleQuotedString;
    else
      qs = singleQuote ? singleQuotedString : doubleQuotedString;
  }
  return qs(value, ctx);
}
var blockEndNewlines;
try {
  blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
} catch (e) {
  blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
  const { blockQuote, commentString, lineWidth } = ctx.options;
  if (!blockQuote || /\n[\t ]+$/.test(value)) {
    return quotedString(value, ctx);
  }
  const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
  const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.BLOCK_FOLDED ? false : type === Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
  if (!value)
    return literal ? "|\n" : ">\n";
  let chomp;
  let endStart;
  for (endStart = value.length; endStart > 0; --endStart) {
    const ch = value[endStart - 1];
    if (ch !== "\n" && ch !== "	" && ch !== " ")
      break;
  }
  let end = value.substring(endStart);
  const endNlPos = end.indexOf("\n");
  if (endNlPos === -1) {
    chomp = "-";
  } else if (value === end || endNlPos !== end.length - 1) {
    chomp = "+";
    if (onChompKeep)
      onChompKeep();
  } else {
    chomp = "";
  }
  if (end) {
    value = value.slice(0, -end.length);
    if (end[end.length - 1] === "\n")
      end = end.slice(0, -1);
    end = end.replace(blockEndNewlines, `$&${indent}`);
  }
  let startWithSpace = false;
  let startEnd;
  let startNlPos = -1;
  for (startEnd = 0; startEnd < value.length; ++startEnd) {
    const ch = value[startEnd];
    if (ch === " ")
      startWithSpace = true;
    else if (ch === "\n")
      startNlPos = startEnd;
    else
      break;
  }
  let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
  if (start) {
    value = value.substring(start.length);
    start = start.replace(/\n+/g, `$&${indent}`);
  }
  const indentSize = indent ? "2" : "1";
  let header = (startWithSpace ? indentSize : "") + chomp;
  if (comment) {
    header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
    if (onComment)
      onComment();
  }
  if (!literal) {
    const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
    let literalFallback = false;
    const foldOptions = getFoldOptions(ctx, true);
    if (blockQuote !== "folded" && type !== Scalar.BLOCK_FOLDED) {
      foldOptions.onOverflow = () => {
        literalFallback = true;
      };
    }
    const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
    if (!literalFallback)
      return `>${header}
${indent}${body}`;
  }
  value = value.replace(/\n+/g, `$&${indent}`);
  return `|${header}
${indent}${start}${value}${end}`;
}
function plainString(item, ctx, onComment, onChompKeep) {
  const { type, value } = item;
  const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
  if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
    return quotedString(value, ctx);
  }
  if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
    return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
  }
  if (!implicitKey && !inFlow && type !== Scalar.PLAIN && value.includes("\n")) {
    return blockString(item, ctx, onComment, onChompKeep);
  }
  if (containsDocumentMarker(value)) {
    if (indent === "") {
      ctx.forceBlockIndent = true;
      return blockString(item, ctx, onComment, onChompKeep);
    } else if (implicitKey && indent === indentStep) {
      return quotedString(value, ctx);
    }
  }
  const str = value.replace(/\n+/g, `$&
${indent}`);
  if (actualString) {
    const test = (tag) => {
      var _a;
      return tag.default && tag.tag !== "tag:yaml.org,2002:str" && ((_a = tag.test) == null ? void 0 : _a.test(str));
    };
    const { compat, tags } = ctx.doc.schema;
    if (tags.some(test) || (compat == null ? void 0 : compat.some(test)))
      return quotedString(value, ctx);
  }
  return implicitKey ? str : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function stringifyString(item, ctx, onComment, onChompKeep) {
  const { implicitKey, inFlow } = ctx;
  const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
  let { type } = item;
  if (type !== Scalar.QUOTE_DOUBLE) {
    if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
      type = Scalar.QUOTE_DOUBLE;
  }
  const _stringify = (_type) => {
    switch (_type) {
      case Scalar.BLOCK_FOLDED:
      case Scalar.BLOCK_LITERAL:
        return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
      case Scalar.QUOTE_DOUBLE:
        return doubleQuotedString(ss.value, ctx);
      case Scalar.QUOTE_SINGLE:
        return singleQuotedString(ss.value, ctx);
      case Scalar.PLAIN:
        return plainString(ss, ctx, onComment, onChompKeep);
      default:
        return null;
    }
  };
  let res = _stringify(type);
  if (res === null) {
    const { defaultKeyType, defaultStringType } = ctx.options;
    const t = implicitKey && defaultKeyType || defaultStringType;
    res = _stringify(t);
    if (res === null)
      throw new Error(`Unsupported default string type ${t}`);
  }
  return res;
}

// node_modules/yaml/browser/dist/stringify/stringify.js
function createStringifyContext(doc, options) {
  const opt = Object.assign({
    blockQuote: true,
    commentString: stringifyComment,
    defaultKeyType: null,
    defaultStringType: "PLAIN",
    directives: null,
    doubleQuotedAsJSON: false,
    doubleQuotedMinMultiLineLength: 40,
    falseStr: "false",
    flowCollectionPadding: true,
    indentSeq: true,
    lineWidth: 80,
    minContentWidth: 20,
    nullStr: "null",
    simpleKeys: false,
    singleQuote: null,
    trailingComma: false,
    trueStr: "true",
    verifyAliasOrder: true
  }, doc.schema.toStringOptions, options);
  let inFlow;
  switch (opt.collectionStyle) {
    case "block":
      inFlow = false;
      break;
    case "flow":
      inFlow = true;
      break;
    default:
      inFlow = null;
  }
  return {
    anchors: /* @__PURE__ */ new Set(),
    doc,
    flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
    indent: "",
    indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
    inFlow,
    options: opt
  };
}
function getTagObject(tags, item) {
  var _a, _b, _c, _d;
  if (item.tag) {
    const match = tags.filter((t) => t.tag === item.tag);
    if (match.length > 0)
      return (_a = match.find((t) => t.format === item.format)) != null ? _a : match[0];
  }
  let tagObj = void 0;
  let obj;
  if (isScalar(item)) {
    obj = item.value;
    let match = tags.filter((t) => {
      var _a2;
      return (_a2 = t.identify) == null ? void 0 : _a2.call(t, obj);
    });
    if (match.length > 1) {
      const testMatch = match.filter((t) => t.test);
      if (testMatch.length > 0)
        match = testMatch;
    }
    tagObj = (_b = match.find((t) => t.format === item.format)) != null ? _b : match.find((t) => !t.format);
  } else {
    obj = item;
    tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
  }
  if (!tagObj) {
    const name = (_d = (_c = obj == null ? void 0 : obj.constructor) == null ? void 0 : _c.name) != null ? _d : obj === null ? "null" : typeof obj;
    throw new Error(`Tag not resolved for ${name} value`);
  }
  return tagObj;
}
function stringifyProps(node, tagObj, { anchors, doc }) {
  var _a;
  if (!doc.directives)
    return "";
  const props = [];
  const anchor = (isScalar(node) || isCollection(node)) && node.anchor;
  if (anchor && anchorIsValid(anchor)) {
    anchors.add(anchor);
    props.push(`&${anchor}`);
  }
  const tag = (_a = node.tag) != null ? _a : tagObj.default ? null : tagObj.tag;
  if (tag)
    props.push(doc.directives.tagString(tag));
  return props.join(" ");
}
function stringify(item, ctx, onComment, onChompKeep) {
  var _a, _b;
  if (isPair(item))
    return item.toString(ctx, onComment, onChompKeep);
  if (isAlias(item)) {
    if (ctx.doc.directives)
      return item.toString(ctx);
    if ((_a = ctx.resolvedAliases) == null ? void 0 : _a.has(item)) {
      throw new TypeError(`Cannot stringify circular structure without alias nodes`);
    } else {
      if (ctx.resolvedAliases)
        ctx.resolvedAliases.add(item);
      else
        ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
      item = item.resolve(ctx.doc);
    }
  }
  let tagObj = void 0;
  const node = isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
  tagObj != null ? tagObj : tagObj = getTagObject(ctx.doc.schema.tags, node);
  const props = stringifyProps(node, tagObj, ctx);
  if (props.length > 0)
    ctx.indentAtStart = ((_b = ctx.indentAtStart) != null ? _b : 0) + props.length + 1;
  const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : isScalar(node) ? stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
  if (!props)
    return str;
  return isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
}

// node_modules/yaml/browser/dist/stringify/stringifyPair.js
function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
  var _a, _b;
  const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
  let keyComment = isNode(key) && key.comment || null;
  if (simpleKeys) {
    if (keyComment) {
      throw new Error("With simple keys, key nodes cannot have comments");
    }
    if (isCollection(key) || !isNode(key) && typeof key === "object") {
      const msg = "With simple keys, collection cannot be used as a key value";
      throw new Error(msg);
    }
  }
  let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || isCollection(key) || (isScalar(key) ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL : typeof key === "object"));
  ctx = Object.assign({}, ctx, {
    allNullValues: false,
    implicitKey: !explicitKey && (simpleKeys || !allNullValues),
    indent: indent + indentStep
  });
  let keyCommentDone = false;
  let chompKeep = false;
  let str = stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
  if (!explicitKey && !ctx.inFlow && str.length > 1024) {
    if (simpleKeys)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    explicitKey = true;
  }
  if (ctx.inFlow) {
    if (allNullValues || value == null) {
      if (keyCommentDone && onComment)
        onComment();
      return str === "" ? "?" : explicitKey ? `? ${str}` : str;
    }
  } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
    str = `? ${str}`;
    if (keyComment && !keyCommentDone) {
      str += lineComment(str, ctx.indent, commentString(keyComment));
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  if (keyCommentDone)
    keyComment = null;
  if (explicitKey) {
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment));
    str = `? ${str}
${indent}:`;
  } else {
    str = `${str}:`;
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment));
  }
  let vsb, vcb, valueComment;
  if (isNode(value)) {
    vsb = !!value.spaceBefore;
    vcb = value.commentBefore;
    valueComment = value.comment;
  } else {
    vsb = false;
    vcb = null;
    valueComment = null;
    if (value && typeof value === "object")
      value = doc.createNode(value);
  }
  ctx.implicitKey = false;
  if (!explicitKey && !keyComment && isScalar(value))
    ctx.indentAtStart = str.length + 1;
  chompKeep = false;
  if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && isSeq(value) && !value.flow && !value.tag && !value.anchor) {
    ctx.indent = ctx.indent.substring(2);
  }
  let valueCommentDone = false;
  const valueStr = stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
  let ws = " ";
  if (keyComment || vsb || vcb) {
    ws = vsb ? "\n" : "";
    if (vcb) {
      const cs = commentString(vcb);
      ws += `
${indentComment(cs, ctx.indent)}`;
    }
    if (valueStr === "" && !ctx.inFlow) {
      if (ws === "\n" && valueComment)
        ws = "\n\n";
    } else {
      ws += `
${ctx.indent}`;
    }
  } else if (!explicitKey && isCollection(value)) {
    const vs0 = valueStr[0];
    const nl0 = valueStr.indexOf("\n");
    const hasNewline = nl0 !== -1;
    const flow = (_b = (_a = ctx.inFlow) != null ? _a : value.flow) != null ? _b : value.items.length === 0;
    if (hasNewline || !flow) {
      let hasPropsLine = false;
      if (hasNewline && (vs0 === "&" || vs0 === "!")) {
        let sp0 = valueStr.indexOf(" ");
        if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
          sp0 = valueStr.indexOf(" ", sp0 + 1);
        }
        if (sp0 === -1 || nl0 < sp0)
          hasPropsLine = true;
      }
      if (!hasPropsLine)
        ws = `
${ctx.indent}`;
    }
  } else if (valueStr === "" || valueStr[0] === "\n") {
    ws = "";
  }
  str += ws + valueStr;
  if (ctx.inFlow) {
    if (valueCommentDone && onComment)
      onComment();
  } else if (valueComment && !valueCommentDone) {
    str += lineComment(str, ctx.indent, commentString(valueComment));
  } else if (chompKeep && onChompKeep) {
    onChompKeep();
  }
  return str;
}

// node_modules/yaml/browser/dist/log.js
function warn(logLevel, warning) {
  if (logLevel === "debug" || logLevel === "warn") {
    console.warn(warning);
  }
}

// node_modules/yaml/browser/dist/schema/yaml-1.1/merge.js
var MERGE_KEY = "<<";
var merge = {
  identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
  default: "key",
  tag: "tag:yaml.org,2002:merge",
  test: /^<<$/,
  resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), {
    addToJSMap: addMergeToJSMap
  }),
  stringify: () => MERGE_KEY
};
var isMergeKey = (ctx, key) => (merge.identify(key) || isScalar(key) && (!key.type || key.type === Scalar.PLAIN) && merge.identify(key.value)) && (ctx == null ? void 0 : ctx.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default));
function addMergeToJSMap(ctx, map2, value) {
  const source = resolveAliasValue(ctx, value);
  if (isSeq(source))
    for (const it of source.items)
      mergeValue(ctx, map2, it);
  else if (Array.isArray(source))
    for (const it of source)
      mergeValue(ctx, map2, it);
  else
    mergeValue(ctx, map2, source);
}
function mergeValue(ctx, map2, value) {
  const source = resolveAliasValue(ctx, value);
  if (!isMap(source))
    throw new Error("Merge sources must be maps or map aliases");
  const srcMap = source.toJSON(null, ctx, Map);
  for (const [key, value2] of srcMap) {
    if (map2 instanceof Map) {
      if (!map2.has(key))
        map2.set(key, value2);
    } else if (map2 instanceof Set) {
      map2.add(key);
    } else if (!Object.prototype.hasOwnProperty.call(map2, key)) {
      Object.defineProperty(map2, key, {
        value: value2,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
  }
  return map2;
}
function resolveAliasValue(ctx, value) {
  return ctx && isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
}

// node_modules/yaml/browser/dist/nodes/addPairToJSMap.js
function addPairToJSMap(ctx, map2, { key, value }) {
  if (isNode(key) && key.addToJSMap)
    key.addToJSMap(ctx, map2, value);
  else if (isMergeKey(ctx, key))
    addMergeToJSMap(ctx, map2, value);
  else {
    const jsKey = toJS(key, "", ctx);
    if (map2 instanceof Map) {
      map2.set(jsKey, toJS(value, jsKey, ctx));
    } else if (map2 instanceof Set) {
      map2.add(jsKey);
    } else {
      const stringKey = stringifyKey(key, jsKey, ctx);
      const jsValue = toJS(value, stringKey, ctx);
      if (stringKey in map2)
        Object.defineProperty(map2, stringKey, {
          value: jsValue,
          writable: true,
          enumerable: true,
          configurable: true
        });
      else
        map2[stringKey] = jsValue;
    }
  }
  return map2;
}
function stringifyKey(key, jsKey, ctx) {
  if (jsKey === null)
    return "";
  if (typeof jsKey !== "object")
    return String(jsKey);
  if (isNode(key) && (ctx == null ? void 0 : ctx.doc)) {
    const strCtx = createStringifyContext(ctx.doc, {});
    strCtx.anchors = /* @__PURE__ */ new Set();
    for (const node of ctx.anchors.keys())
      strCtx.anchors.add(node.anchor);
    strCtx.inFlow = true;
    strCtx.inStringifyKey = true;
    const strKey = key.toString(strCtx);
    if (!ctx.mapKeyWarned) {
      let jsonStr = JSON.stringify(strKey);
      if (jsonStr.length > 40)
        jsonStr = jsonStr.substring(0, 36) + '..."';
      warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
      ctx.mapKeyWarned = true;
    }
    return strKey;
  }
  return JSON.stringify(jsKey);
}

// node_modules/yaml/browser/dist/nodes/Pair.js
function createPair(key, value, ctx) {
  const k = createNode(key, void 0, ctx);
  const v = createNode(value, void 0, ctx);
  return new Pair(k, v);
}
var Pair = class _Pair {
  constructor(key, value = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR });
    this.key = key;
    this.value = value;
  }
  clone(schema4) {
    let { key, value } = this;
    if (isNode(key))
      key = key.clone(schema4);
    if (isNode(value))
      value = value.clone(schema4);
    return new _Pair(key, value);
  }
  toJSON(_, ctx) {
    const pair = (ctx == null ? void 0 : ctx.mapAsMap) ? /* @__PURE__ */ new Map() : {};
    return addPairToJSMap(ctx, pair, this);
  }
  toString(ctx, onComment, onChompKeep) {
    return (ctx == null ? void 0 : ctx.doc) ? stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyCollection.js
function stringifyCollection(collection, ctx, options) {
  var _a;
  const flow = (_a = ctx.inFlow) != null ? _a : collection.flow;
  const stringify4 = flow ? stringifyFlowCollection : stringifyBlockCollection;
  return stringify4(collection, ctx, options);
}
function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
  const { indent, options: { commentString } } = ctx;
  const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
  let chompKeep = false;
  const lines = [];
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    let comment2 = null;
    if (isNode(item)) {
      if (!chompKeep && item.spaceBefore)
        lines.push("");
      addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
      if (item.comment)
        comment2 = item.comment;
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null;
      if (ik) {
        if (!chompKeep && ik.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
      }
    }
    chompKeep = false;
    let str2 = stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
    if (comment2)
      str2 += lineComment(str2, itemIndent, commentString(comment2));
    if (chompKeep && comment2)
      chompKeep = false;
    lines.push(blockItemPrefix + str2);
  }
  let str;
  if (lines.length === 0) {
    str = flowChars.start + flowChars.end;
  } else {
    str = lines[0];
    for (let i = 1; i < lines.length; ++i) {
      const line = lines[i];
      str += line ? `
${indent}${line}` : "\n";
    }
  }
  if (comment) {
    str += "\n" + indentComment(commentString(comment), indent);
    if (onComment)
      onComment();
  } else if (chompKeep && onChompKeep)
    onChompKeep();
  return str;
}
function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
  const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
  itemIndent += indentStep;
  const itemCtx = Object.assign({}, ctx, {
    indent: itemIndent,
    inFlow: true,
    type: null
  });
  let reqNewline = false;
  let linesAtValue = 0;
  const lines = [];
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    let comment = null;
    if (isNode(item)) {
      if (item.spaceBefore)
        lines.push("");
      addCommentBefore(ctx, lines, item.commentBefore, false);
      if (item.comment)
        comment = item.comment;
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null;
      if (ik) {
        if (ik.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, ik.commentBefore, false);
        if (ik.comment)
          reqNewline = true;
      }
      const iv = isNode(item.value) ? item.value : null;
      if (iv) {
        if (iv.comment)
          comment = iv.comment;
        if (iv.commentBefore)
          reqNewline = true;
      } else if (item.value == null && (ik == null ? void 0 : ik.comment)) {
        comment = ik.comment;
      }
    }
    if (comment)
      reqNewline = true;
    let str = stringify(item, itemCtx, () => comment = null);
    reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
    if (i < items.length - 1) {
      str += ",";
    } else if (ctx.options.trailingComma) {
      if (ctx.options.lineWidth > 0) {
        reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
      }
      if (reqNewline) {
        str += ",";
      }
    }
    if (comment)
      str += lineComment(str, itemIndent, commentString(comment));
    lines.push(str);
    linesAtValue = lines.length;
  }
  const { start, end } = flowChars;
  if (lines.length === 0) {
    return start + end;
  } else {
    if (!reqNewline) {
      const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
      reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
    }
    if (reqNewline) {
      let str = start;
      for (const line of lines)
        str += line ? `
${indentStep}${indent}${line}` : "\n";
      return `${str}
${indent}${end}`;
    } else {
      return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
    }
  }
}
function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
  if (comment && chompKeep)
    comment = comment.replace(/^\n+/, "");
  if (comment) {
    const ic = indentComment(commentString(comment), indent);
    lines.push(ic.trimStart());
  }
}

// node_modules/yaml/browser/dist/nodes/YAMLMap.js
function findPair(items, key) {
  const k = isScalar(key) ? key.value : key;
  for (const it of items) {
    if (isPair(it)) {
      if (it.key === key || it.key === k)
        return it;
      if (isScalar(it.key) && it.key.value === k)
        return it;
    }
  }
  return void 0;
}
var YAMLMap = class extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:map";
  }
  constructor(schema4) {
    super(MAP, schema4);
    this.items = [];
  }
  /**
   * A generic collection parsing method that can be extended
   * to other node classes that inherit from YAMLMap
   */
  static from(schema4, obj, ctx) {
    const { keepUndefined, replacer } = ctx;
    const map2 = new this(schema4);
    const add = (key, value) => {
      if (typeof replacer === "function")
        value = replacer.call(obj, key, value);
      else if (Array.isArray(replacer) && !replacer.includes(key))
        return;
      if (value !== void 0 || keepUndefined)
        map2.items.push(createPair(key, value, ctx));
    };
    if (obj instanceof Map) {
      for (const [key, value] of obj)
        add(key, value);
    } else if (obj && typeof obj === "object") {
      for (const key of Object.keys(obj))
        add(key, obj[key]);
    }
    if (typeof schema4.sortMapEntries === "function") {
      map2.items.sort(schema4.sortMapEntries);
    }
    return map2;
  }
  /**
   * Adds a value to the collection.
   *
   * @param overwrite - If not set `true`, using a key that is already in the
   *   collection will throw. Otherwise, overwrites the previous value.
   */
  add(pair, overwrite) {
    var _a;
    let _pair;
    if (isPair(pair))
      _pair = pair;
    else if (!pair || typeof pair !== "object" || !("key" in pair)) {
      _pair = new Pair(pair, pair == null ? void 0 : pair.value);
    } else
      _pair = new Pair(pair.key, pair.value);
    const prev = findPair(this.items, _pair.key);
    const sortEntries = (_a = this.schema) == null ? void 0 : _a.sortMapEntries;
    if (prev) {
      if (!overwrite)
        throw new Error(`Key ${_pair.key} already set`);
      if (isScalar(prev.value) && isScalarValue(_pair.value))
        prev.value.value = _pair.value;
      else
        prev.value = _pair.value;
    } else if (sortEntries) {
      const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
      if (i === -1)
        this.items.push(_pair);
      else
        this.items.splice(i, 0, _pair);
    } else {
      this.items.push(_pair);
    }
  }
  delete(key) {
    const it = findPair(this.items, key);
    if (!it)
      return false;
    const del = this.items.splice(this.items.indexOf(it), 1);
    return del.length > 0;
  }
  get(key, keepScalar) {
    var _a;
    const it = findPair(this.items, key);
    const node = it == null ? void 0 : it.value;
    return (_a = !keepScalar && isScalar(node) ? node.value : node) != null ? _a : void 0;
  }
  has(key) {
    return !!findPair(this.items, key);
  }
  set(key, value) {
    this.add(new Pair(key, value), true);
  }
  /**
   * @param ctx - Conversion context, originally set in Document#toJS()
   * @param {Class} Type - If set, forces the returned collection type
   * @returns Instance of Type, Map, or Object
   */
  toJSON(_, ctx, Type) {
    const map2 = Type ? new Type() : (ctx == null ? void 0 : ctx.mapAsMap) ? /* @__PURE__ */ new Map() : {};
    if (ctx == null ? void 0 : ctx.onCreate)
      ctx.onCreate(map2);
    for (const item of this.items)
      addPairToJSMap(ctx, map2, item);
    return map2;
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    for (const item of this.items) {
      if (!isPair(item))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
    }
    if (!ctx.allNullValues && this.hasAllNullValues(false))
      ctx = Object.assign({}, ctx, { allNullValues: true });
    return stringifyCollection(this, ctx, {
      blockItemPrefix: "",
      flowChars: { start: "{", end: "}" },
      itemIndent: ctx.indent || "",
      onChompKeep,
      onComment
    });
  }
};

// node_modules/yaml/browser/dist/schema/common/map.js
var map = {
  collection: "map",
  default: true,
  nodeClass: YAMLMap,
  tag: "tag:yaml.org,2002:map",
  resolve(map2, onError) {
    if (!isMap(map2))
      onError("Expected a mapping for this tag");
    return map2;
  },
  createNode: (schema4, obj, ctx) => YAMLMap.from(schema4, obj, ctx)
};

// node_modules/yaml/browser/dist/nodes/YAMLSeq.js
var YAMLSeq = class extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:seq";
  }
  constructor(schema4) {
    super(SEQ, schema4);
    this.items = [];
  }
  add(value) {
    this.items.push(value);
  }
  /**
   * Removes a value from the collection.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   *
   * @returns `true` if the item was found and removed.
   */
  delete(key) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      return false;
    const del = this.items.splice(idx, 1);
    return del.length > 0;
  }
  get(key, keepScalar) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      return void 0;
    const it = this.items[idx];
    return !keepScalar && isScalar(it) ? it.value : it;
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   */
  has(key) {
    const idx = asItemIndex(key);
    return typeof idx === "number" && idx < this.items.length;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   *
   * If `key` does not contain a representation of an integer, this will throw.
   * It may be wrapped in a `Scalar`.
   */
  set(key, value) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      throw new Error(`Expected a valid index, not ${key}.`);
    const prev = this.items[idx];
    if (isScalar(prev) && isScalarValue(value))
      prev.value = value;
    else
      this.items[idx] = value;
  }
  toJSON(_, ctx) {
    const seq2 = [];
    if (ctx == null ? void 0 : ctx.onCreate)
      ctx.onCreate(seq2);
    let i = 0;
    for (const item of this.items)
      seq2.push(toJS(item, String(i++), ctx));
    return seq2;
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    return stringifyCollection(this, ctx, {
      blockItemPrefix: "- ",
      flowChars: { start: "[", end: "]" },
      itemIndent: (ctx.indent || "") + "  ",
      onChompKeep,
      onComment
    });
  }
  static from(schema4, obj, ctx) {
    const { replacer } = ctx;
    const seq2 = new this(schema4);
    if (obj && Symbol.iterator in Object(obj)) {
      let i = 0;
      for (let it of obj) {
        if (typeof replacer === "function") {
          const key = obj instanceof Set ? it : String(i++);
          it = replacer.call(obj, key, it);
        }
        seq2.items.push(createNode(it, void 0, ctx));
      }
    }
    return seq2;
  }
};
function asItemIndex(key) {
  let idx = isScalar(key) ? key.value : key;
  if (idx && typeof idx === "string")
    idx = Number(idx);
  return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
}

// node_modules/yaml/browser/dist/schema/common/seq.js
var seq = {
  collection: "seq",
  default: true,
  nodeClass: YAMLSeq,
  tag: "tag:yaml.org,2002:seq",
  resolve(seq2, onError) {
    if (!isSeq(seq2))
      onError("Expected a sequence for this tag");
    return seq2;
  },
  createNode: (schema4, obj, ctx) => YAMLSeq.from(schema4, obj, ctx)
};

// node_modules/yaml/browser/dist/schema/common/string.js
var string = {
  identify: (value) => typeof value === "string",
  default: true,
  tag: "tag:yaml.org,2002:str",
  resolve: (str) => str,
  stringify(item, ctx, onComment, onChompKeep) {
    ctx = Object.assign({ actualString: true }, ctx);
    return stringifyString(item, ctx, onComment, onChompKeep);
  }
};

// node_modules/yaml/browser/dist/schema/common/null.js
var nullTag = {
  identify: (value) => value == null,
  createNode: () => new Scalar(null),
  default: true,
  tag: "tag:yaml.org,2002:null",
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => new Scalar(null),
  stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
};

// node_modules/yaml/browser/dist/schema/core/bool.js
var boolTag = {
  identify: (value) => typeof value === "boolean",
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: (str) => new Scalar(str[0] === "t" || str[0] === "T"),
  stringify({ source, value }, ctx) {
    if (source && boolTag.test.test(source)) {
      const sv = source[0] === "t" || source[0] === "T";
      if (value === sv)
        return source;
    }
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyNumber.js
function stringifyNumber({ format, minFractionDigits, tag, value }) {
  if (typeof value === "bigint")
    return String(value);
  const num = typeof value === "number" ? value : Number(value);
  if (!isFinite(num))
    return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
  let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
  if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
    let i = n.indexOf(".");
    if (i < 0) {
      i = n.length;
      n += ".";
    }
    let d = minFractionDigits - (n.length - i - 1);
    while (d-- > 0)
      n += "0";
  }
  return n;
}

// node_modules/yaml/browser/dist/schema/core/float.js
var floatNaN = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
};
var floatExp = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
  resolve: (str) => parseFloat(str),
  stringify(node) {
    const num = Number(node.value);
    return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  }
};
var float = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
  resolve(str) {
    const node = new Scalar(parseFloat(str));
    const dot = str.indexOf(".");
    if (dot !== -1 && str[str.length - 1] === "0")
      node.minFractionDigits = str.length - dot - 1;
    return node;
  },
  stringify: stringifyNumber
};

// node_modules/yaml/browser/dist/schema/core/int.js
var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
function intStringify(node, radix, prefix) {
  const { value } = node;
  if (intIdentify(value) && value >= 0)
    return prefix + value.toString(radix);
  return stringifyNumber(node);
}
var intOct = {
  identify: (value) => intIdentify(value) && value >= 0,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^0o[0-7]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
  stringify: (node) => intStringify(node, 8, "0o")
};
var int = {
  identify: intIdentify,
  default: true,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
  stringify: stringifyNumber
};
var intHex = {
  identify: (value) => intIdentify(value) && value >= 0,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^0x[0-9a-fA-F]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
  stringify: (node) => intStringify(node, 16, "0x")
};

// node_modules/yaml/browser/dist/schema/core/schema.js
var schema = [
  map,
  seq,
  string,
  nullTag,
  boolTag,
  intOct,
  int,
  intHex,
  floatNaN,
  floatExp,
  float
];

// node_modules/yaml/browser/dist/schema/json/schema.js
function intIdentify2(value) {
  return typeof value === "bigint" || Number.isInteger(value);
}
var stringifyJSON = ({ value }) => JSON.stringify(value);
var jsonScalars = [
  {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify: stringifyJSON
  },
  {
    identify: (value) => value == null,
    createNode: () => new Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^null$/,
    resolve: () => null,
    stringify: stringifyJSON
  },
  {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^true$|^false$/,
    resolve: (str) => str === "true",
    stringify: stringifyJSON
  },
  {
    identify: intIdentify2,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
    stringify: ({ value }) => intIdentify2(value) ? value.toString() : JSON.stringify(value)
  },
  {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: (str) => parseFloat(str),
    stringify: stringifyJSON
  }
];
var jsonError = {
  default: true,
  tag: "",
  test: /^/,
  resolve(str, onError) {
    onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
    return str;
  }
};
var schema2 = [map, seq].concat(jsonScalars, jsonError);

// node_modules/yaml/browser/dist/schema/yaml-1.1/binary.js
var binary = {
  identify: (value) => value instanceof Uint8Array,
  // Buffer inherits from Uint8Array
  default: false,
  tag: "tag:yaml.org,2002:binary",
  /**
   * Returns a Buffer in node and an Uint8Array in browsers
   *
   * To use the resulting buffer as an image, you'll want to do something like:
   *
   *   const blob = new Blob([buffer], { type: 'image/jpeg' })
   *   document.querySelector('#photo').src = URL.createObjectURL(blob)
   */
  resolve(src, onError) {
    if (typeof atob === "function") {
      const str = atob(src.replace(/[\n\r]/g, ""));
      const buffer = new Uint8Array(str.length);
      for (let i = 0; i < str.length; ++i)
        buffer[i] = str.charCodeAt(i);
      return buffer;
    } else {
      onError("This environment does not support reading binary tags; either Buffer or atob is required");
      return src;
    }
  },
  stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
    if (!value)
      return "";
    const buf = value;
    let str;
    if (typeof btoa === "function") {
      let s = "";
      for (let i = 0; i < buf.length; ++i)
        s += String.fromCharCode(buf[i]);
      str = btoa(s);
    } else {
      throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
    }
    type != null ? type : type = Scalar.BLOCK_LITERAL;
    if (type !== Scalar.QUOTE_DOUBLE) {
      const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
      const n = Math.ceil(str.length / lineWidth);
      const lines = new Array(n);
      for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
        lines[i] = str.substr(o, lineWidth);
      }
      str = lines.join(type === Scalar.BLOCK_LITERAL ? "\n" : " ");
    }
    return stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
  }
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/pairs.js
function resolvePairs(seq2, onError) {
  var _a;
  if (isSeq(seq2)) {
    for (let i = 0; i < seq2.items.length; ++i) {
      let item = seq2.items[i];
      if (isPair(item))
        continue;
      else if (isMap(item)) {
        if (item.items.length > 1)
          onError("Each pair must have its own sequence indicator");
        const pair = item.items[0] || new Pair(new Scalar(null));
        if (item.commentBefore)
          pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
        if (item.comment) {
          const cn = (_a = pair.value) != null ? _a : pair.key;
          cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
        }
        item = pair;
      }
      seq2.items[i] = isPair(item) ? item : new Pair(item);
    }
  } else
    onError("Expected a sequence for this tag");
  return seq2;
}
function createPairs(schema4, iterable, ctx) {
  const { replacer } = ctx;
  const pairs2 = new YAMLSeq(schema4);
  pairs2.tag = "tag:yaml.org,2002:pairs";
  let i = 0;
  if (iterable && Symbol.iterator in Object(iterable))
    for (let it of iterable) {
      if (typeof replacer === "function")
        it = replacer.call(iterable, String(i++), it);
      let key, value;
      if (Array.isArray(it)) {
        if (it.length === 2) {
          key = it[0];
          value = it[1];
        } else
          throw new TypeError(`Expected [key, value] tuple: ${it}`);
      } else if (it && it instanceof Object) {
        const keys = Object.keys(it);
        if (keys.length === 1) {
          key = keys[0];
          value = it[key];
        } else {
          throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
        }
      } else {
        key = it;
      }
      pairs2.items.push(createPair(key, value, ctx));
    }
  return pairs2;
}
var pairs = {
  collection: "seq",
  default: false,
  tag: "tag:yaml.org,2002:pairs",
  resolve: resolvePairs,
  createNode: createPairs
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/omap.js
var YAMLOMap = class _YAMLOMap extends YAMLSeq {
  constructor() {
    super();
    this.add = YAMLMap.prototype.add.bind(this);
    this.delete = YAMLMap.prototype.delete.bind(this);
    this.get = YAMLMap.prototype.get.bind(this);
    this.has = YAMLMap.prototype.has.bind(this);
    this.set = YAMLMap.prototype.set.bind(this);
    this.tag = _YAMLOMap.tag;
  }
  /**
   * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJSON(_, ctx) {
    if (!ctx)
      return super.toJSON(_);
    const map2 = /* @__PURE__ */ new Map();
    if (ctx == null ? void 0 : ctx.onCreate)
      ctx.onCreate(map2);
    for (const pair of this.items) {
      let key, value;
      if (isPair(pair)) {
        key = toJS(pair.key, "", ctx);
        value = toJS(pair.value, key, ctx);
      } else {
        key = toJS(pair, "", ctx);
      }
      if (map2.has(key))
        throw new Error("Ordered maps must not include duplicate keys");
      map2.set(key, value);
    }
    return map2;
  }
  static from(schema4, iterable, ctx) {
    const pairs2 = createPairs(schema4, iterable, ctx);
    const omap2 = new this();
    omap2.items = pairs2.items;
    return omap2;
  }
};
YAMLOMap.tag = "tag:yaml.org,2002:omap";
var omap = {
  collection: "seq",
  identify: (value) => value instanceof Map,
  nodeClass: YAMLOMap,
  default: false,
  tag: "tag:yaml.org,2002:omap",
  resolve(seq2, onError) {
    const pairs2 = resolvePairs(seq2, onError);
    const seenKeys = [];
    for (const { key } of pairs2.items) {
      if (isScalar(key)) {
        if (seenKeys.includes(key.value)) {
          onError(`Ordered maps must not include duplicate keys: ${key.value}`);
        } else {
          seenKeys.push(key.value);
        }
      }
    }
    return Object.assign(new YAMLOMap(), pairs2);
  },
  createNode: (schema4, iterable, ctx) => YAMLOMap.from(schema4, iterable, ctx)
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/bool.js
function boolStringify({ value, source }, ctx) {
  const boolObj = value ? trueTag : falseTag;
  if (source && boolObj.test.test(source))
    return source;
  return value ? ctx.options.trueStr : ctx.options.falseStr;
}
var trueTag = {
  identify: (value) => value === true,
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  resolve: () => new Scalar(true),
  stringify: boolStringify
};
var falseTag = {
  identify: (value) => value === false,
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
  resolve: () => new Scalar(false),
  stringify: boolStringify
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/float.js
var floatNaN2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
};
var floatExp2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
  resolve: (str) => parseFloat(str.replace(/_/g, "")),
  stringify(node) {
    const num = Number(node.value);
    return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  }
};
var float2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
  resolve(str) {
    const node = new Scalar(parseFloat(str.replace(/_/g, "")));
    const dot = str.indexOf(".");
    if (dot !== -1) {
      const f = str.substring(dot + 1).replace(/_/g, "");
      if (f[f.length - 1] === "0")
        node.minFractionDigits = f.length;
    }
    return node;
  },
  stringify: stringifyNumber
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/int.js
var intIdentify3 = (value) => typeof value === "bigint" || Number.isInteger(value);
function intResolve2(str, offset, radix, { intAsBigInt }) {
  const sign = str[0];
  if (sign === "-" || sign === "+")
    offset += 1;
  str = str.substring(offset).replace(/_/g, "");
  if (intAsBigInt) {
    switch (radix) {
      case 2:
        str = `0b${str}`;
        break;
      case 8:
        str = `0o${str}`;
        break;
      case 16:
        str = `0x${str}`;
        break;
    }
    const n2 = BigInt(str);
    return sign === "-" ? BigInt(-1) * n2 : n2;
  }
  const n = parseInt(str, radix);
  return sign === "-" ? -1 * n : n;
}
function intStringify2(node, radix, prefix) {
  const { value } = node;
  if (intIdentify3(value)) {
    const str = value.toString(radix);
    return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
  }
  return stringifyNumber(node);
}
var intBin = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "BIN",
  test: /^[-+]?0b[0-1_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 2, 2, opt),
  stringify: (node) => intStringify2(node, 2, "0b")
};
var intOct2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^[-+]?0[0-7_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 1, 8, opt),
  stringify: (node) => intStringify2(node, 8, "0")
};
var int2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: (str, _onError, opt) => intResolve2(str, 0, 10, opt),
  stringify: stringifyNumber
};
var intHex2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^[-+]?0x[0-9a-fA-F_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 2, 16, opt),
  stringify: (node) => intStringify2(node, 16, "0x")
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/set.js
var YAMLSet = class _YAMLSet extends YAMLMap {
  constructor(schema4) {
    super(schema4);
    this.tag = _YAMLSet.tag;
  }
  add(key) {
    let pair;
    if (isPair(key))
      pair = key;
    else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
      pair = new Pair(key.key, null);
    else
      pair = new Pair(key, null);
    const prev = findPair(this.items, pair.key);
    if (!prev)
      this.items.push(pair);
  }
  /**
   * If `keepPair` is `true`, returns the Pair matching `key`.
   * Otherwise, returns the value of that Pair's key.
   */
  get(key, keepPair) {
    const pair = findPair(this.items, key);
    return !keepPair && isPair(pair) ? isScalar(pair.key) ? pair.key.value : pair.key : pair;
  }
  set(key, value) {
    if (typeof value !== "boolean")
      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
    const prev = findPair(this.items, key);
    if (prev && !value) {
      this.items.splice(this.items.indexOf(prev), 1);
    } else if (!prev && value) {
      this.items.push(new Pair(key));
    }
  }
  toJSON(_, ctx) {
    return super.toJSON(_, ctx, Set);
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    if (this.hasAllNullValues(true))
      return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
    else
      throw new Error("Set items must all have null values");
  }
  static from(schema4, iterable, ctx) {
    const { replacer } = ctx;
    const set2 = new this(schema4);
    if (iterable && Symbol.iterator in Object(iterable))
      for (let value of iterable) {
        if (typeof replacer === "function")
          value = replacer.call(iterable, value, value);
        set2.items.push(createPair(value, null, ctx));
      }
    return set2;
  }
};
YAMLSet.tag = "tag:yaml.org,2002:set";
var set = {
  collection: "map",
  identify: (value) => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: "tag:yaml.org,2002:set",
  createNode: (schema4, iterable, ctx) => YAMLSet.from(schema4, iterable, ctx),
  resolve(map2, onError) {
    if (isMap(map2)) {
      if (map2.hasAllNullValues(true))
        return Object.assign(new YAMLSet(), map2);
      else
        onError("Set items must all have null values");
    } else
      onError("Expected a mapping for this tag");
    return map2;
  }
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/timestamp.js
function parseSexagesimal(str, asBigInt) {
  const sign = str[0];
  const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
  const num = (n) => asBigInt ? BigInt(n) : Number(n);
  const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
  return sign === "-" ? num(-1) * res : res;
}
function stringifySexagesimal(node) {
  let { value } = node;
  let num = (n) => n;
  if (typeof value === "bigint")
    num = (n) => BigInt(n);
  else if (isNaN(value) || !isFinite(value))
    return stringifyNumber(node);
  let sign = "";
  if (value < 0) {
    sign = "-";
    value *= num(-1);
  }
  const _60 = num(60);
  const parts = [value % _60];
  if (value < 60) {
    parts.unshift(0);
  } else {
    value = (value - parts[0]) / _60;
    parts.unshift(value % _60);
    if (value >= 60) {
      value = (value - parts[0]) / _60;
      parts.unshift(value);
    }
  }
  return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
}
var intTime = {
  identify: (value) => typeof value === "bigint" || Number.isInteger(value),
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
  resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
  stringify: stringifySexagesimal
};
var floatTime = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
  resolve: (str) => parseSexagesimal(str, false),
  stringify: stringifySexagesimal
};
var timestamp = {
  identify: (value) => value instanceof Date,
  default: true,
  tag: "tag:yaml.org,2002:timestamp",
  // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
  // may be omitted altogether, resulting in a date format. In such a case, the time part is
  // assumed to be 00:00:00Z (start of day, UTC).
  test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
  resolve(str) {
    const match = str.match(timestamp.test);
    if (!match)
      throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
    const [, year, month, day, hour, minute, second] = match.map(Number);
    const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
    let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
    const tz = match[8];
    if (tz && tz !== "Z") {
      let d = parseSexagesimal(tz, false);
      if (Math.abs(d) < 30)
        d *= 60;
      date -= 6e4 * d;
    }
    return new Date(date);
  },
  stringify: ({ value }) => {
    var _a;
    return (_a = value == null ? void 0 : value.toISOString().replace(/(T00:00:00)?\.000Z$/, "")) != null ? _a : "";
  }
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/schema.js
var schema3 = [
  map,
  seq,
  string,
  nullTag,
  trueTag,
  falseTag,
  intBin,
  intOct2,
  int2,
  intHex2,
  floatNaN2,
  floatExp2,
  float2,
  binary,
  merge,
  omap,
  pairs,
  set,
  intTime,
  floatTime,
  timestamp
];

// node_modules/yaml/browser/dist/schema/tags.js
var schemas = /* @__PURE__ */ new Map([
  ["core", schema],
  ["failsafe", [map, seq, string]],
  ["json", schema2],
  ["yaml11", schema3],
  ["yaml-1.1", schema3]
]);
var tagsByName = {
  binary,
  bool: boolTag,
  float,
  floatExp,
  floatNaN,
  floatTime,
  int,
  intHex,
  intOct,
  intTime,
  map,
  merge,
  null: nullTag,
  omap,
  pairs,
  seq,
  set,
  timestamp
};
var coreKnownTags = {
  "tag:yaml.org,2002:binary": binary,
  "tag:yaml.org,2002:merge": merge,
  "tag:yaml.org,2002:omap": omap,
  "tag:yaml.org,2002:pairs": pairs,
  "tag:yaml.org,2002:set": set,
  "tag:yaml.org,2002:timestamp": timestamp
};
function getTags(customTags, schemaName, addMergeTag) {
  const schemaTags = schemas.get(schemaName);
  if (schemaTags && !customTags) {
    return addMergeTag && !schemaTags.includes(merge) ? schemaTags.concat(merge) : schemaTags.slice();
  }
  let tags = schemaTags;
  if (!tags) {
    if (Array.isArray(customTags))
      tags = [];
    else {
      const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
      throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
    }
  }
  if (Array.isArray(customTags)) {
    for (const tag of customTags)
      tags = tags.concat(tag);
  } else if (typeof customTags === "function") {
    tags = customTags(tags.slice());
  }
  if (addMergeTag)
    tags = tags.concat(merge);
  return tags.reduce((tags2, tag) => {
    const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
    if (!tagObj) {
      const tagName = JSON.stringify(tag);
      const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
      throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
    }
    if (!tags2.includes(tagObj))
      tags2.push(tagObj);
    return tags2;
  }, []);
}

// node_modules/yaml/browser/dist/schema/Schema.js
var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
var Schema = class _Schema {
  constructor({ compat, customTags, merge: merge2, resolveKnownTags, schema: schema4, sortMapEntries, toStringDefaults }) {
    this.compat = Array.isArray(compat) ? getTags(compat, "compat") : compat ? getTags(null, compat) : null;
    this.name = typeof schema4 === "string" && schema4 || "core";
    this.knownTags = resolveKnownTags ? coreKnownTags : {};
    this.tags = getTags(customTags, this.name, merge2);
    this.toStringOptions = toStringDefaults != null ? toStringDefaults : null;
    Object.defineProperty(this, MAP, { value: map });
    Object.defineProperty(this, SCALAR, { value: string });
    Object.defineProperty(this, SEQ, { value: seq });
    this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
  }
  clone() {
    const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
    copy.tags = this.tags.slice();
    return copy;
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyDocument.js
function stringifyDocument(doc, options) {
  var _a;
  const lines = [];
  let hasDirectives = options.directives === true;
  if (options.directives !== false && doc.directives) {
    const dir = doc.directives.toString(doc);
    if (dir) {
      lines.push(dir);
      hasDirectives = true;
    } else if (doc.directives.docStart)
      hasDirectives = true;
  }
  if (hasDirectives)
    lines.push("---");
  const ctx = createStringifyContext(doc, options);
  const { commentString } = ctx.options;
  if (doc.commentBefore) {
    if (lines.length !== 1)
      lines.unshift("");
    const cs = commentString(doc.commentBefore);
    lines.unshift(indentComment(cs, ""));
  }
  let chompKeep = false;
  let contentComment = null;
  if (doc.contents) {
    if (isNode(doc.contents)) {
      if (doc.contents.spaceBefore && hasDirectives)
        lines.push("");
      if (doc.contents.commentBefore) {
        const cs = commentString(doc.contents.commentBefore);
        lines.push(indentComment(cs, ""));
      }
      ctx.forceBlockIndent = !!doc.comment;
      contentComment = doc.contents.comment;
    }
    const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
    let body = stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
    if (contentComment)
      body += lineComment(body, "", commentString(contentComment));
    if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
      lines[lines.length - 1] = `--- ${body}`;
    } else
      lines.push(body);
  } else {
    lines.push(stringify(doc.contents, ctx));
  }
  if ((_a = doc.directives) == null ? void 0 : _a.docEnd) {
    if (doc.comment) {
      const cs = commentString(doc.comment);
      if (cs.includes("\n")) {
        lines.push("...");
        lines.push(indentComment(cs, ""));
      } else {
        lines.push(`... ${cs}`);
      }
    } else {
      lines.push("...");
    }
  } else {
    let dc = doc.comment;
    if (dc && chompKeep)
      dc = dc.replace(/^\n+/, "");
    if (dc) {
      if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
        lines.push("");
      lines.push(indentComment(commentString(dc), ""));
    }
  }
  return lines.join("\n") + "\n";
}

// node_modules/yaml/browser/dist/doc/Document.js
var Document = class _Document {
  constructor(value, replacer, options) {
    this.commentBefore = null;
    this.comment = null;
    this.errors = [];
    this.warnings = [];
    Object.defineProperty(this, NODE_TYPE, { value: DOC });
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === void 0 && replacer) {
      options = replacer;
      replacer = void 0;
    }
    const opt = Object.assign({
      intAsBigInt: false,
      keepSourceTokens: false,
      logLevel: "warn",
      prettyErrors: true,
      strict: true,
      stringKeys: false,
      uniqueKeys: true,
      version: "1.2"
    }, options);
    this.options = opt;
    let { version } = opt;
    if (options == null ? void 0 : options._directives) {
      this.directives = options._directives.atDocument();
      if (this.directives.yaml.explicit)
        version = this.directives.yaml.version;
    } else
      this.directives = new Directives({ version });
    this.setSchema(version, options);
    this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
  }
  /**
   * Create a deep copy of this Document and its contents.
   *
   * Custom Node values that inherit from `Object` still refer to their original instances.
   */
  clone() {
    const copy = Object.create(_Document.prototype, {
      [NODE_TYPE]: { value: DOC }
    });
    copy.commentBefore = this.commentBefore;
    copy.comment = this.comment;
    copy.errors = this.errors.slice();
    copy.warnings = this.warnings.slice();
    copy.options = Object.assign({}, this.options);
    if (this.directives)
      copy.directives = this.directives.clone();
    copy.schema = this.schema.clone();
    copy.contents = isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  /** Adds a value to the document. */
  add(value) {
    if (assertCollection(this.contents))
      this.contents.add(value);
  }
  /** Adds a value to the document. */
  addIn(path, value) {
    if (assertCollection(this.contents))
      this.contents.addIn(path, value);
  }
  /**
   * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
   *
   * If `node` already has an anchor, `name` is ignored.
   * Otherwise, the `node.anchor` value will be set to `name`,
   * or if an anchor with that name is already present in the document,
   * `name` will be used as a prefix for a new unique anchor.
   * If `name` is undefined, the generated anchor will use 'a' as a prefix.
   */
  createAlias(node, name) {
    if (!node.anchor) {
      const prev = anchorNames(this);
      node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      !name || prev.has(name) ? findNewAnchor(name || "a", prev) : name;
    }
    return new Alias(node.anchor);
  }
  createNode(value, replacer, options) {
    let _replacer = void 0;
    if (typeof replacer === "function") {
      value = replacer.call({ "": value }, "", value);
      _replacer = replacer;
    } else if (Array.isArray(replacer)) {
      const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
      const asStr = replacer.filter(keyToStr).map(String);
      if (asStr.length > 0)
        replacer = replacer.concat(asStr);
      _replacer = replacer;
    } else if (options === void 0 && replacer) {
      options = replacer;
      replacer = void 0;
    }
    const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options != null ? options : {};
    const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(
      this,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      anchorPrefix || "a"
    );
    const ctx = {
      aliasDuplicateObjects: aliasDuplicateObjects != null ? aliasDuplicateObjects : true,
      keepUndefined: keepUndefined != null ? keepUndefined : false,
      onAnchor,
      onTagObj,
      replacer: _replacer,
      schema: this.schema,
      sourceObjects
    };
    const node = createNode(value, tag, ctx);
    if (flow && isCollection(node))
      node.flow = true;
    setAnchors();
    return node;
  }
  /**
   * Convert a key and a value into a `Pair` using the current schema,
   * recursively wrapping all values as `Scalar` or `Collection` nodes.
   */
  createPair(key, value, options = {}) {
    const k = this.createNode(key, null, options);
    const v = this.createNode(value, null, options);
    return new Pair(k, v);
  }
  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  delete(key) {
    return assertCollection(this.contents) ? this.contents.delete(key) : false;
  }
  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(path) {
    if (isEmptyPath(path)) {
      if (this.contents == null)
        return false;
      this.contents = null;
      return true;
    }
    return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  get(key, keepScalar) {
    return isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
  }
  /**
   * Returns item at `path`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(path, keepScalar) {
    if (isEmptyPath(path))
      return !keepScalar && isScalar(this.contents) ? this.contents.value : this.contents;
    return isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
  }
  /**
   * Checks if the document includes a value with the key `key`.
   */
  has(key) {
    return isCollection(this.contents) ? this.contents.has(key) : false;
  }
  /**
   * Checks if the document includes a value at `path`.
   */
  hasIn(path) {
    if (isEmptyPath(path))
      return this.contents !== void 0;
    return isCollection(this.contents) ? this.contents.hasIn(path) : false;
  }
  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  set(key, value) {
    if (this.contents == null) {
      this.contents = collectionFromPath(this.schema, [key], value);
    } else if (assertCollection(this.contents)) {
      this.contents.set(key, value);
    }
  }
  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path, value) {
    if (isEmptyPath(path)) {
      this.contents = value;
    } else if (this.contents == null) {
      this.contents = collectionFromPath(this.schema, Array.from(path), value);
    } else if (assertCollection(this.contents)) {
      this.contents.setIn(path, value);
    }
  }
  /**
   * Change the YAML version and schema used by the document.
   * A `null` version disables support for directives, explicit tags, anchors, and aliases.
   * It also requires the `schema` option to be given as a `Schema` instance value.
   *
   * Overrides all previously set schema options.
   */
  setSchema(version, options = {}) {
    if (typeof version === "number")
      version = String(version);
    let opt;
    switch (version) {
      case "1.1":
        if (this.directives)
          this.directives.yaml.version = "1.1";
        else
          this.directives = new Directives({ version: "1.1" });
        opt = { resolveKnownTags: false, schema: "yaml-1.1" };
        break;
      case "1.2":
      case "next":
        if (this.directives)
          this.directives.yaml.version = version;
        else
          this.directives = new Directives({ version });
        opt = { resolveKnownTags: true, schema: "core" };
        break;
      case null:
        if (this.directives)
          delete this.directives;
        opt = null;
        break;
      default: {
        const sv = JSON.stringify(version);
        throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
      }
    }
    if (options.schema instanceof Object)
      this.schema = options.schema;
    else if (opt)
      this.schema = new Schema(Object.assign(opt, options));
    else
      throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
  }
  // json & jsonArg are only used from toJSON()
  toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
    const ctx = {
      anchors: /* @__PURE__ */ new Map(),
      doc: this,
      keep: !json,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
    };
    const res = toJS(this.contents, jsonArg != null ? jsonArg : "", ctx);
    if (typeof onAnchor === "function")
      for (const { count, res: res2 } of ctx.anchors.values())
        onAnchor(res2, count);
    return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  }
  /**
   * A JSON representation of the document `contents`.
   *
   * @param jsonArg Used by `JSON.stringify` to indicate the array index or
   *   property name.
   */
  toJSON(jsonArg, onAnchor) {
    return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
  }
  /** A YAML representation of the document. */
  toString(options = {}) {
    if (this.errors.length > 0)
      throw new Error("Document with errors cannot be stringified");
    if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
      const s = JSON.stringify(options.indent);
      throw new Error(`"indent" option must be a positive integer, not ${s}`);
    }
    return stringifyDocument(this, options);
  }
};
function assertCollection(contents) {
  if (isCollection(contents))
    return true;
  throw new Error("Expected a YAML collection as document contents");
}

// node_modules/yaml/browser/dist/errors.js
var YAMLError = class extends Error {
  constructor(name, pos, code, message) {
    super();
    this.name = name;
    this.code = code;
    this.message = message;
    this.pos = pos;
  }
};
var YAMLParseError = class extends YAMLError {
  constructor(pos, code, message) {
    super("YAMLParseError", pos, code, message);
  }
};
var YAMLWarning = class extends YAMLError {
  constructor(pos, code, message) {
    super("YAMLWarning", pos, code, message);
  }
};
var prettifyError = (src, lc) => (error) => {
  if (error.pos[0] === -1)
    return;
  error.linePos = error.pos.map((pos) => lc.linePos(pos));
  const { line, col } = error.linePos[0];
  error.message += ` at line ${line}, column ${col}`;
  let ci = col - 1;
  let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
  if (ci >= 60 && lineStr.length > 80) {
    const trimStart = Math.min(ci - 39, lineStr.length - 79);
    lineStr = "\u2026" + lineStr.substring(trimStart);
    ci -= trimStart - 1;
  }
  if (lineStr.length > 80)
    lineStr = lineStr.substring(0, 79) + "\u2026";
  if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
    let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
    if (prev.length > 80)
      prev = prev.substring(0, 79) + "\u2026\n";
    lineStr = prev + lineStr;
  }
  if (/[^ ]/.test(lineStr)) {
    let count = 1;
    const end = error.linePos[1];
    if ((end == null ? void 0 : end.line) === line && end.col > col) {
      count = Math.max(1, Math.min(end.col - col, 80 - ci));
    }
    const pointer = " ".repeat(ci) + "^".repeat(count);
    error.message += `:

${lineStr}
${pointer}
`;
  }
};

// node_modules/yaml/browser/dist/compose/resolve-props.js
function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
  let spaceBefore = false;
  let atNewline = startOnNewline;
  let hasSpace = startOnNewline;
  let comment = "";
  let commentSep = "";
  let hasNewline = false;
  let reqSpace = false;
  let tab = null;
  let anchor = null;
  let tag = null;
  let newlineAfterProp = null;
  let comma = null;
  let found = null;
  let start = null;
  for (const token of tokens) {
    if (reqSpace) {
      if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
        onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      reqSpace = false;
    }
    if (tab) {
      if (atNewline && token.type !== "comment" && token.type !== "newline") {
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      }
      tab = null;
    }
    switch (token.type) {
      case "space":
        if (!flow && (indicator !== "doc-start" || (next == null ? void 0 : next.type) !== "flow-collection") && token.source.includes("	")) {
          tab = token;
        }
        hasSpace = true;
        break;
      case "comment": {
        if (!hasSpace)
          onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
        const cb = token.source.substring(1) || " ";
        if (!comment)
          comment = cb;
        else
          comment += commentSep + cb;
        commentSep = "";
        atNewline = false;
        break;
      }
      case "newline":
        if (atNewline) {
          if (comment)
            comment += token.source;
          else if (!found || indicator !== "seq-item-ind")
            spaceBefore = true;
        } else
          commentSep += token.source;
        atNewline = true;
        hasNewline = true;
        if (anchor || tag)
          newlineAfterProp = token;
        hasSpace = true;
        break;
      case "anchor":
        if (anchor)
          onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
        if (token.source.endsWith(":"))
          onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
        anchor = token;
        start != null ? start : start = token.offset;
        atNewline = false;
        hasSpace = false;
        reqSpace = true;
        break;
      case "tag": {
        if (tag)
          onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
        tag = token;
        start != null ? start : start = token.offset;
        atNewline = false;
        hasSpace = false;
        reqSpace = true;
        break;
      }
      case indicator:
        if (anchor || tag)
          onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
        if (found)
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow != null ? flow : "collection"}`);
        found = token;
        atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
        hasSpace = false;
        break;
      case "comma":
        if (flow) {
          if (comma)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
          comma = token;
          atNewline = false;
          hasSpace = false;
          break;
        }
      // else fallthrough
      default:
        onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
        atNewline = false;
        hasSpace = false;
    }
  }
  const last = tokens[tokens.length - 1];
  const end = last ? last.offset + last.source.length : offset;
  if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
    onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
  }
  if (tab && (atNewline && tab.indent <= parentIndent || (next == null ? void 0 : next.type) === "block-map" || (next == null ? void 0 : next.type) === "block-seq"))
    onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
  return {
    comma,
    found,
    spaceBefore,
    comment,
    hasNewline,
    anchor,
    tag,
    newlineAfterProp,
    end,
    start: start != null ? start : end
  };
}

// node_modules/yaml/browser/dist/compose/util-contains-newline.js
function containsNewline(key) {
  if (!key)
    return null;
  switch (key.type) {
    case "alias":
    case "scalar":
    case "double-quoted-scalar":
    case "single-quoted-scalar":
      if (key.source.includes("\n"))
        return true;
      if (key.end) {
        for (const st of key.end)
          if (st.type === "newline")
            return true;
      }
      return false;
    case "flow-collection":
      for (const it of key.items) {
        for (const st of it.start)
          if (st.type === "newline")
            return true;
        if (it.sep) {
          for (const st of it.sep)
            if (st.type === "newline")
              return true;
        }
        if (containsNewline(it.key) || containsNewline(it.value))
          return true;
      }
      return false;
    default:
      return true;
  }
}

// node_modules/yaml/browser/dist/compose/util-flow-indent-check.js
function flowIndentCheck(indent, fc, onError) {
  if ((fc == null ? void 0 : fc.type) === "flow-collection") {
    const end = fc.end[0];
    if (end.indent === indent && (end.source === "]" || end.source === "}") && containsNewline(fc)) {
      const msg = "Flow end indicator should be more indented than parent";
      onError(end, "BAD_INDENT", msg, true);
    }
  }
}

// node_modules/yaml/browser/dist/compose/util-map-includes.js
function mapIncludes(ctx, items, search) {
  const { uniqueKeys } = ctx.options;
  if (uniqueKeys === false)
    return false;
  const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || isScalar(a) && isScalar(b) && a.value === b.value;
  return items.some((pair) => isEqual(pair.key, search));
}

// node_modules/yaml/browser/dist/compose/resolve-block-map.js
var startColMsg = "All mapping items must start at the same column";
function resolveBlockMap({ composeNode: composeNode2, composeEmptyNode: composeEmptyNode2 }, ctx, bm, onError, tag) {
  var _a, _b;
  const NodeClass = (_a = tag == null ? void 0 : tag.nodeClass) != null ? _a : YAMLMap;
  const map2 = new NodeClass(ctx.schema);
  if (ctx.atRoot)
    ctx.atRoot = false;
  let offset = bm.offset;
  let commentEnd = null;
  for (const collItem of bm.items) {
    const { start, key, sep, value } = collItem;
    const keyProps = resolveProps(start, {
      indicator: "explicit-key-ind",
      next: key != null ? key : sep == null ? void 0 : sep[0],
      offset,
      onError,
      parentIndent: bm.indent,
      startOnNewline: true
    });
    const implicitKey = !keyProps.found;
    if (implicitKey) {
      if (key) {
        if (key.type === "block-seq")
          onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
        else if ("indent" in key && key.indent !== bm.indent)
          onError(offset, "BAD_INDENT", startColMsg);
      }
      if (!keyProps.anchor && !keyProps.tag && !sep) {
        commentEnd = keyProps.end;
        if (keyProps.comment) {
          if (map2.comment)
            map2.comment += "\n" + keyProps.comment;
          else
            map2.comment = keyProps.comment;
        }
        continue;
      }
      if (keyProps.newlineAfterProp || containsNewline(key)) {
        onError(key != null ? key : start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
      }
    } else if (((_b = keyProps.found) == null ? void 0 : _b.indent) !== bm.indent) {
      onError(offset, "BAD_INDENT", startColMsg);
    }
    ctx.atKey = true;
    const keyStart = keyProps.end;
    const keyNode = key ? composeNode2(ctx, key, keyProps, onError) : composeEmptyNode2(ctx, keyStart, start, null, keyProps, onError);
    if (ctx.schema.compat)
      flowIndentCheck(bm.indent, key, onError);
    ctx.atKey = false;
    if (mapIncludes(ctx, map2.items, keyNode))
      onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
    const valueProps = resolveProps(sep != null ? sep : [], {
      indicator: "map-value-ind",
      next: value,
      offset: keyNode.range[2],
      onError,
      parentIndent: bm.indent,
      startOnNewline: !key || key.type === "block-scalar"
    });
    offset = valueProps.end;
    if (valueProps.found) {
      if (implicitKey) {
        if ((value == null ? void 0 : value.type) === "block-map" && !valueProps.hasNewline)
          onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
        if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
          onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
      }
      const valueNode = value ? composeNode2(ctx, value, valueProps, onError) : composeEmptyNode2(ctx, offset, sep, null, valueProps, onError);
      if (ctx.schema.compat)
        flowIndentCheck(bm.indent, value, onError);
      offset = valueNode.range[2];
      const pair = new Pair(keyNode, valueNode);
      if (ctx.options.keepSourceTokens)
        pair.srcToken = collItem;
      map2.items.push(pair);
    } else {
      if (implicitKey)
        onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
      if (valueProps.comment) {
        if (keyNode.comment)
          keyNode.comment += "\n" + valueProps.comment;
        else
          keyNode.comment = valueProps.comment;
      }
      const pair = new Pair(keyNode);
      if (ctx.options.keepSourceTokens)
        pair.srcToken = collItem;
      map2.items.push(pair);
    }
  }
  if (commentEnd && commentEnd < offset)
    onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
  map2.range = [bm.offset, offset, commentEnd != null ? commentEnd : offset];
  return map2;
}

// node_modules/yaml/browser/dist/compose/resolve-block-seq.js
function resolveBlockSeq({ composeNode: composeNode2, composeEmptyNode: composeEmptyNode2 }, ctx, bs, onError, tag) {
  var _a;
  const NodeClass = (_a = tag == null ? void 0 : tag.nodeClass) != null ? _a : YAMLSeq;
  const seq2 = new NodeClass(ctx.schema);
  if (ctx.atRoot)
    ctx.atRoot = false;
  if (ctx.atKey)
    ctx.atKey = false;
  let offset = bs.offset;
  let commentEnd = null;
  for (const { start, value } of bs.items) {
    const props = resolveProps(start, {
      indicator: "seq-item-ind",
      next: value,
      offset,
      onError,
      parentIndent: bs.indent,
      startOnNewline: true
    });
    if (!props.found) {
      if (props.anchor || props.tag || value) {
        if ((value == null ? void 0 : value.type) === "block-seq")
          onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
        else
          onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
      } else {
        commentEnd = props.end;
        if (props.comment)
          seq2.comment = props.comment;
        continue;
      }
    }
    const node = value ? composeNode2(ctx, value, props, onError) : composeEmptyNode2(ctx, props.end, start, null, props, onError);
    if (ctx.schema.compat)
      flowIndentCheck(bs.indent, value, onError);
    offset = node.range[2];
    seq2.items.push(node);
  }
  seq2.range = [bs.offset, offset, commentEnd != null ? commentEnd : offset];
  return seq2;
}

// node_modules/yaml/browser/dist/compose/resolve-end.js
function resolveEnd(end, offset, reqSpace, onError) {
  let comment = "";
  if (end) {
    let hasSpace = false;
    let sep = "";
    for (const token of end) {
      const { source, type } = token;
      switch (type) {
        case "space":
          hasSpace = true;
          break;
        case "comment": {
          if (reqSpace && !hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += sep + cb;
          sep = "";
          break;
        }
        case "newline":
          if (comment)
            sep += source;
          hasSpace = true;
          break;
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
      }
      offset += source.length;
    }
  }
  return { comment, offset };
}

// node_modules/yaml/browser/dist/compose/resolve-flow-collection.js
var blockMsg = "Block collections are not allowed within flow collections";
var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
function resolveFlowCollection({ composeNode: composeNode2, composeEmptyNode: composeEmptyNode2 }, ctx, fc, onError, tag) {
  var _a, _b, _c;
  const isMap2 = fc.start.source === "{";
  const fcName = isMap2 ? "flow map" : "flow sequence";
  const NodeClass = (_a = tag == null ? void 0 : tag.nodeClass) != null ? _a : isMap2 ? YAMLMap : YAMLSeq;
  const coll = new NodeClass(ctx.schema);
  coll.flow = true;
  const atRoot = ctx.atRoot;
  if (atRoot)
    ctx.atRoot = false;
  if (ctx.atKey)
    ctx.atKey = false;
  let offset = fc.offset + fc.start.source.length;
  for (let i = 0; i < fc.items.length; ++i) {
    const collItem = fc.items[i];
    const { start, key, sep, value } = collItem;
    const props = resolveProps(start, {
      flow: fcName,
      indicator: "explicit-key-ind",
      next: key != null ? key : sep == null ? void 0 : sep[0],
      offset,
      onError,
      parentIndent: fc.indent,
      startOnNewline: false
    });
    if (!props.found) {
      if (!props.anchor && !props.tag && !sep && !value) {
        if (i === 0 && props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        else if (i < fc.items.length - 1)
          onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
        if (props.comment) {
          if (coll.comment)
            coll.comment += "\n" + props.comment;
          else
            coll.comment = props.comment;
        }
        offset = props.end;
        continue;
      }
      if (!isMap2 && ctx.options.strict && containsNewline(key))
        onError(
          key,
          // checked by containsNewline()
          "MULTILINE_IMPLICIT_KEY",
          "Implicit keys of flow sequence pairs need to be on a single line"
        );
    }
    if (i === 0) {
      if (props.comma)
        onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
    } else {
      if (!props.comma)
        onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
      if (props.comment) {
        let prevItemComment = "";
        loop: for (const st of start) {
          switch (st.type) {
            case "comma":
            case "space":
              break;
            case "comment":
              prevItemComment = st.source.substring(1);
              break loop;
            default:
              break loop;
          }
        }
        if (prevItemComment) {
          let prev = coll.items[coll.items.length - 1];
          if (isPair(prev))
            prev = (_b = prev.value) != null ? _b : prev.key;
          if (prev.comment)
            prev.comment += "\n" + prevItemComment;
          else
            prev.comment = prevItemComment;
          props.comment = props.comment.substring(prevItemComment.length + 1);
        }
      }
    }
    if (!isMap2 && !sep && !props.found) {
      const valueNode = value ? composeNode2(ctx, value, props, onError) : composeEmptyNode2(ctx, props.end, sep, null, props, onError);
      coll.items.push(valueNode);
      offset = valueNode.range[2];
      if (isBlock(value))
        onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
    } else {
      ctx.atKey = true;
      const keyStart = props.end;
      const keyNode = key ? composeNode2(ctx, key, props, onError) : composeEmptyNode2(ctx, keyStart, start, null, props, onError);
      if (isBlock(key))
        onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
      ctx.atKey = false;
      const valueProps = resolveProps(sep != null ? sep : [], {
        flow: fcName,
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (valueProps.found) {
        if (!isMap2 && !props.found && ctx.options.strict) {
          if (sep)
            for (const st of sep) {
              if (st === valueProps.found)
                break;
              if (st.type === "newline") {
                onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                break;
              }
            }
          if (props.start < valueProps.found.offset - 1024)
            onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
        }
      } else if (value) {
        if ("source" in value && ((_c = value.source) == null ? void 0 : _c[0]) === ":")
          onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
        else
          onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
      }
      const valueNode = value ? composeNode2(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode2(ctx, valueProps.end, sep, null, valueProps, onError) : null;
      if (valueNode) {
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else if (valueProps.comment) {
        if (keyNode.comment)
          keyNode.comment += "\n" + valueProps.comment;
        else
          keyNode.comment = valueProps.comment;
      }
      const pair = new Pair(keyNode, valueNode);
      if (ctx.options.keepSourceTokens)
        pair.srcToken = collItem;
      if (isMap2) {
        const map2 = coll;
        if (mapIncludes(ctx, map2.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        map2.items.push(pair);
      } else {
        const map2 = new YAMLMap(ctx.schema);
        map2.flow = true;
        map2.items.push(pair);
        const endRange = (valueNode != null ? valueNode : keyNode).range;
        map2.range = [keyNode.range[0], endRange[1], endRange[2]];
        coll.items.push(map2);
      }
      offset = valueNode ? valueNode.range[2] : valueProps.end;
    }
  }
  const expectedEnd = isMap2 ? "}" : "]";
  const [ce, ...ee] = fc.end;
  let cePos = offset;
  if ((ce == null ? void 0 : ce.source) === expectedEnd)
    cePos = ce.offset + ce.source.length;
  else {
    const name = fcName[0].toUpperCase() + fcName.substring(1);
    const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
    onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
    if (ce && ce.source.length !== 1)
      ee.unshift(ce);
  }
  if (ee.length > 0) {
    const end = resolveEnd(ee, cePos, ctx.options.strict, onError);
    if (end.comment) {
      if (coll.comment)
        coll.comment += "\n" + end.comment;
      else
        coll.comment = end.comment;
    }
    coll.range = [fc.offset, cePos, end.offset];
  } else {
    coll.range = [fc.offset, cePos, cePos];
  }
  return coll;
}

// node_modules/yaml/browser/dist/compose/compose-collection.js
function resolveCollection(CN2, ctx, token, onError, tagName, tag) {
  const coll = token.type === "block-map" ? resolveBlockMap(CN2, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq(CN2, ctx, token, onError, tag) : resolveFlowCollection(CN2, ctx, token, onError, tag);
  const Coll = coll.constructor;
  if (tagName === "!" || tagName === Coll.tagName) {
    coll.tag = Coll.tagName;
    return coll;
  }
  if (tagName)
    coll.tag = tagName;
  return coll;
}
function composeCollection(CN2, ctx, token, props, onError) {
  var _a, _b, _c;
  const tagToken = props.tag;
  const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
  if (token.type === "block-seq") {
    const { anchor, newlineAfterProp: nl } = props;
    const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor != null ? anchor : tagToken;
    if (lastProp && (!nl || nl.offset < lastProp.offset)) {
      const message = "Missing newline after block sequence props";
      onError(lastProp, "MISSING_CHAR", message);
    }
  }
  const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
  if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.tagName && expType === "seq") {
    return resolveCollection(CN2, ctx, token, onError, tagName);
  }
  let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
  if (!tag) {
    const kt = ctx.schema.knownTags[tagName];
    if ((kt == null ? void 0 : kt.collection) === expType) {
      ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
      tag = kt;
    } else {
      if (kt) {
        onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${(_a = kt.collection) != null ? _a : "scalar"}`, true);
      } else {
        onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
      }
      return resolveCollection(CN2, ctx, token, onError, tagName);
    }
  }
  const coll = resolveCollection(CN2, ctx, token, onError, tagName, tag);
  const res = (_c = (_b = tag.resolve) == null ? void 0 : _b.call(tag, coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options)) != null ? _c : coll;
  const node = isNode(res) ? res : new Scalar(res);
  node.range = coll.range;
  node.tag = tagName;
  if (tag == null ? void 0 : tag.format)
    node.format = tag.format;
  return node;
}

// node_modules/yaml/browser/dist/compose/resolve-block-scalar.js
function resolveBlockScalar(ctx, scalar, onError) {
  const start = scalar.offset;
  const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
  if (!header)
    return { value: "", type: null, comment: "", range: [start, start, start] };
  const type = header.mode === ">" ? Scalar.BLOCK_FOLDED : Scalar.BLOCK_LITERAL;
  const lines = scalar.source ? splitLines(scalar.source) : [];
  let chompStart = lines.length;
  for (let i = lines.length - 1; i >= 0; --i) {
    const content = lines[i][1];
    if (content === "" || content === "\r")
      chompStart = i;
    else
      break;
  }
  if (chompStart === 0) {
    const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
    let end2 = start + header.length;
    if (scalar.source)
      end2 += scalar.source.length;
    return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
  }
  let trimIndent = scalar.indent + header.indent;
  let offset = scalar.offset + header.length;
  let contentStart = 0;
  for (let i = 0; i < chompStart; ++i) {
    const [indent, content] = lines[i];
    if (content === "" || content === "\r") {
      if (header.indent === 0 && indent.length > trimIndent)
        trimIndent = indent.length;
    } else {
      if (indent.length < trimIndent) {
        const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
        onError(offset + indent.length, "MISSING_CHAR", message);
      }
      if (header.indent === 0)
        trimIndent = indent.length;
      contentStart = i;
      if (trimIndent === 0 && !ctx.atRoot) {
        const message = "Block scalar values in collections must be indented";
        onError(offset, "BAD_INDENT", message);
      }
      break;
    }
    offset += indent.length + content.length + 1;
  }
  for (let i = lines.length - 1; i >= chompStart; --i) {
    if (lines[i][0].length > trimIndent)
      chompStart = i + 1;
  }
  let value = "";
  let sep = "";
  let prevMoreIndented = false;
  for (let i = 0; i < contentStart; ++i)
    value += lines[i][0].slice(trimIndent) + "\n";
  for (let i = contentStart; i < chompStart; ++i) {
    let [indent, content] = lines[i];
    offset += indent.length + content.length + 1;
    const crlf = content[content.length - 1] === "\r";
    if (crlf)
      content = content.slice(0, -1);
    if (content && indent.length < trimIndent) {
      const src = header.indent ? "explicit indentation indicator" : "first line";
      const message = `Block scalar lines must not be less indented than their ${src}`;
      onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
      indent = "";
    }
    if (type === Scalar.BLOCK_LITERAL) {
      value += sep + indent.slice(trimIndent) + content;
      sep = "\n";
    } else if (indent.length > trimIndent || content[0] === "	") {
      if (sep === " ")
        sep = "\n";
      else if (!prevMoreIndented && sep === "\n")
        sep = "\n\n";
      value += sep + indent.slice(trimIndent) + content;
      sep = "\n";
      prevMoreIndented = true;
    } else if (content === "") {
      if (sep === "\n")
        value += "\n";
      else
        sep = "\n";
    } else {
      value += sep + content;
      sep = " ";
      prevMoreIndented = false;
    }
  }
  switch (header.chomp) {
    case "-":
      break;
    case "+":
      for (let i = chompStart; i < lines.length; ++i)
        value += "\n" + lines[i][0].slice(trimIndent);
      if (value[value.length - 1] !== "\n")
        value += "\n";
      break;
    default:
      value += "\n";
  }
  const end = start + header.length + scalar.source.length;
  return { value, type, comment: header.comment, range: [start, end, end] };
}
function parseBlockScalarHeader({ offset, props }, strict, onError) {
  if (props[0].type !== "block-scalar-header") {
    onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
    return null;
  }
  const { source } = props[0];
  const mode = source[0];
  let indent = 0;
  let chomp = "";
  let error = -1;
  for (let i = 1; i < source.length; ++i) {
    const ch = source[i];
    if (!chomp && (ch === "-" || ch === "+"))
      chomp = ch;
    else {
      const n = Number(ch);
      if (!indent && n)
        indent = n;
      else if (error === -1)
        error = offset + i;
    }
  }
  if (error !== -1)
    onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
  let hasSpace = false;
  let comment = "";
  let length = source.length;
  for (let i = 1; i < props.length; ++i) {
    const token = props[i];
    switch (token.type) {
      case "space":
        hasSpace = true;
      // fallthrough
      case "newline":
        length += token.source.length;
        break;
      case "comment":
        if (strict && !hasSpace) {
          const message = "Comments must be separated from other tokens by white space characters";
          onError(token, "MISSING_CHAR", message);
        }
        length += token.source.length;
        comment = token.source.substring(1);
        break;
      case "error":
        onError(token, "UNEXPECTED_TOKEN", token.message);
        length += token.source.length;
        break;
      /* istanbul ignore next should not happen */
      default: {
        const message = `Unexpected token in block scalar header: ${token.type}`;
        onError(token, "UNEXPECTED_TOKEN", message);
        const ts = token.source;
        if (ts && typeof ts === "string")
          length += ts.length;
      }
    }
  }
  return { mode, indent, chomp, comment, length };
}
function splitLines(source) {
  const split = source.split(/\n( *)/);
  const first = split[0];
  const m = first.match(/^( *)/);
  const line0 = (m == null ? void 0 : m[1]) ? [m[1], first.slice(m[1].length)] : ["", first];
  const lines = [line0];
  for (let i = 1; i < split.length; i += 2)
    lines.push([split[i], split[i + 1]]);
  return lines;
}

// node_modules/yaml/browser/dist/compose/resolve-flow-scalar.js
function resolveFlowScalar(scalar, strict, onError) {
  const { offset, type, source, end } = scalar;
  let _type;
  let value;
  const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
  switch (type) {
    case "scalar":
      _type = Scalar.PLAIN;
      value = plainValue(source, _onError);
      break;
    case "single-quoted-scalar":
      _type = Scalar.QUOTE_SINGLE;
      value = singleQuotedValue(source, _onError);
      break;
    case "double-quoted-scalar":
      _type = Scalar.QUOTE_DOUBLE;
      value = doubleQuotedValue(source, _onError);
      break;
    /* istanbul ignore next should not happen */
    default:
      onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
      return {
        value: "",
        type: null,
        comment: "",
        range: [offset, offset + source.length, offset + source.length]
      };
  }
  const valueEnd = offset + source.length;
  const re = resolveEnd(end, valueEnd, strict, onError);
  return {
    value,
    type: _type,
    comment: re.comment,
    range: [offset, valueEnd, re.offset]
  };
}
function plainValue(source, onError) {
  let badChar = "";
  switch (source[0]) {
    /* istanbul ignore next should not happen */
    case "	":
      badChar = "a tab character";
      break;
    case ",":
      badChar = "flow indicator character ,";
      break;
    case "%":
      badChar = "directive indicator character %";
      break;
    case "|":
    case ">": {
      badChar = `block scalar indicator ${source[0]}`;
      break;
    }
    case "@":
    case "`": {
      badChar = `reserved character ${source[0]}`;
      break;
    }
  }
  if (badChar)
    onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
  return foldLines(source);
}
function singleQuotedValue(source, onError) {
  if (source[source.length - 1] !== "'" || source.length === 1)
    onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
  return foldLines(source.slice(1, -1)).replace(/''/g, "'");
}
function foldLines(source) {
  var _a;
  let first, line;
  try {
    first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
    line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
  } catch (e) {
    first = /(.*?)[ \t]*\r?\n/sy;
    line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
  }
  let match = first.exec(source);
  if (!match)
    return source;
  let res = match[1];
  let sep = " ";
  let pos = first.lastIndex;
  line.lastIndex = pos;
  while (match = line.exec(source)) {
    if (match[1] === "") {
      if (sep === "\n")
        res += sep;
      else
        sep = "\n";
    } else {
      res += sep + match[1];
      sep = " ";
    }
    pos = line.lastIndex;
  }
  const last = /[ \t]*(.*)/sy;
  last.lastIndex = pos;
  match = last.exec(source);
  return res + sep + ((_a = match == null ? void 0 : match[1]) != null ? _a : "");
}
function doubleQuotedValue(source, onError) {
  let res = "";
  for (let i = 1; i < source.length - 1; ++i) {
    const ch = source[i];
    if (ch === "\r" && source[i + 1] === "\n")
      continue;
    if (ch === "\n") {
      const { fold, offset } = foldNewline(source, i);
      res += fold;
      i = offset;
    } else if (ch === "\\") {
      let next = source[++i];
      const cc = escapeCodes[next];
      if (cc)
        res += cc;
      else if (next === "\n") {
        next = source[i + 1];
        while (next === " " || next === "	")
          next = source[++i + 1];
      } else if (next === "\r" && source[i + 1] === "\n") {
        next = source[++i + 1];
        while (next === " " || next === "	")
          next = source[++i + 1];
      } else if (next === "x" || next === "u" || next === "U") {
        const length = next === "x" ? 2 : next === "u" ? 4 : 8;
        res += parseCharCode(source, i + 1, length, onError);
        i += length;
      } else {
        const raw = source.substr(i - 1, 2);
        onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        res += raw;
      }
    } else if (ch === " " || ch === "	") {
      const wsStart = i;
      let next = source[i + 1];
      while (next === " " || next === "	")
        next = source[++i + 1];
      if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
        res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
    } else {
      res += ch;
    }
  }
  if (source[source.length - 1] !== '"' || source.length === 1)
    onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
  return res;
}
function foldNewline(source, offset) {
  let fold = "";
  let ch = source[offset + 1];
  while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
    if (ch === "\r" && source[offset + 2] !== "\n")
      break;
    if (ch === "\n")
      fold += "\n";
    offset += 1;
    ch = source[offset + 1];
  }
  if (!fold)
    fold = " ";
  return { fold, offset };
}
var escapeCodes = {
  "0": "\0",
  // null character
  a: "\x07",
  // bell character
  b: "\b",
  // backspace
  e: "\x1B",
  // escape character
  f: "\f",
  // form feed
  n: "\n",
  // line feed
  r: "\r",
  // carriage return
  t: "	",
  // horizontal tab
  v: "\v",
  // vertical tab
  N: "\x85",
  // Unicode next line
  _: "\xA0",
  // Unicode non-breaking space
  L: "\u2028",
  // Unicode line separator
  P: "\u2029",
  // Unicode paragraph separator
  " ": " ",
  '"': '"',
  "/": "/",
  "\\": "\\",
  "	": "	"
};
function parseCharCode(source, offset, length, onError) {
  const cc = source.substr(offset, length);
  const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
  const code = ok ? parseInt(cc, 16) : NaN;
  try {
    return String.fromCodePoint(code);
  } catch (e) {
    const raw = source.substr(offset - 2, length + 2);
    onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
    return raw;
  }
}

// node_modules/yaml/browser/dist/compose/compose-scalar.js
function composeScalar(ctx, token, tagToken, onError) {
  const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar(ctx, token, onError) : resolveFlowScalar(token, ctx.options.strict, onError);
  const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
  let tag;
  if (ctx.options.stringKeys && ctx.atKey) {
    tag = ctx.schema[SCALAR];
  } else if (tagName)
    tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
  else if (token.type === "scalar")
    tag = findScalarTagByTest(ctx, value, token, onError);
  else
    tag = ctx.schema[SCALAR];
  let scalar;
  try {
    const res = tag.resolve(value, (msg) => onError(tagToken != null ? tagToken : token, "TAG_RESOLVE_FAILED", msg), ctx.options);
    scalar = isScalar(res) ? res : new Scalar(res);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    onError(tagToken != null ? tagToken : token, "TAG_RESOLVE_FAILED", msg);
    scalar = new Scalar(value);
  }
  scalar.range = range;
  scalar.source = value;
  if (type)
    scalar.type = type;
  if (tagName)
    scalar.tag = tagName;
  if (tag.format)
    scalar.format = tag.format;
  if (comment)
    scalar.comment = comment;
  return scalar;
}
function findScalarTagByName(schema4, value, tagName, tagToken, onError) {
  var _a;
  if (tagName === "!")
    return schema4[SCALAR];
  const matchWithTest = [];
  for (const tag of schema4.tags) {
    if (!tag.collection && tag.tag === tagName) {
      if (tag.default && tag.test)
        matchWithTest.push(tag);
      else
        return tag;
    }
  }
  for (const tag of matchWithTest)
    if ((_a = tag.test) == null ? void 0 : _a.test(value))
      return tag;
  const kt = schema4.knownTags[tagName];
  if (kt && !kt.collection) {
    schema4.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
    return kt;
  }
  onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
  return schema4[SCALAR];
}
function findScalarTagByTest({ atKey, directives, schema: schema4 }, value, token, onError) {
  var _a;
  const tag = schema4.tags.find((tag2) => {
    var _a2;
    return (tag2.default === true || atKey && tag2.default === "key") && ((_a2 = tag2.test) == null ? void 0 : _a2.test(value));
  }) || schema4[SCALAR];
  if (schema4.compat) {
    const compat = (_a = schema4.compat.find((tag2) => {
      var _a2;
      return tag2.default && ((_a2 = tag2.test) == null ? void 0 : _a2.test(value));
    })) != null ? _a : schema4[SCALAR];
    if (tag.tag !== compat.tag) {
      const ts = directives.tagString(tag.tag);
      const cs = directives.tagString(compat.tag);
      const msg = `Value may be parsed as either ${ts} or ${cs}`;
      onError(token, "TAG_RESOLVE_FAILED", msg, true);
    }
  }
  return tag;
}

// node_modules/yaml/browser/dist/compose/util-empty-scalar-position.js
function emptyScalarPosition(offset, before, pos) {
  if (before) {
    pos != null ? pos : pos = before.length;
    for (let i = pos - 1; i >= 0; --i) {
      let st = before[i];
      switch (st.type) {
        case "space":
        case "comment":
        case "newline":
          offset -= st.source.length;
          continue;
      }
      st = before[++i];
      while ((st == null ? void 0 : st.type) === "space") {
        offset += st.source.length;
        st = before[++i];
      }
      break;
    }
  }
  return offset;
}

// node_modules/yaml/browser/dist/compose/compose-node.js
var CN = { composeNode, composeEmptyNode };
function composeNode(ctx, token, props, onError) {
  const atKey = ctx.atKey;
  const { spaceBefore, comment, anchor, tag } = props;
  let node;
  let isSrcToken = true;
  switch (token.type) {
    case "alias":
      node = composeAlias(ctx, token, onError);
      if (anchor || tag)
        onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
      break;
    case "scalar":
    case "single-quoted-scalar":
    case "double-quoted-scalar":
    case "block-scalar":
      node = composeScalar(ctx, token, tag, onError);
      if (anchor)
        node.anchor = anchor.source.substring(1);
      break;
    case "block-map":
    case "block-seq":
    case "flow-collection":
      try {
        node = composeCollection(CN, ctx, token, props, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(token, "RESOURCE_EXHAUSTION", message);
      }
      break;
    default: {
      const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
      onError(token, "UNEXPECTED_TOKEN", message);
      isSrcToken = false;
    }
  }
  node != null ? node : node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError);
  if (anchor && node.anchor === "")
    onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
  if (atKey && ctx.options.stringKeys && (!isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
    const msg = "With stringKeys, all keys must be strings";
    onError(tag != null ? tag : token, "NON_STRING_KEY", msg);
  }
  if (spaceBefore)
    node.spaceBefore = true;
  if (comment) {
    if (token.type === "scalar" && token.source === "")
      node.comment = comment;
    else
      node.commentBefore = comment;
  }
  if (ctx.options.keepSourceTokens && isSrcToken)
    node.srcToken = token;
  return node;
}
function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
  const token = {
    type: "scalar",
    offset: emptyScalarPosition(offset, before, pos),
    indent: -1,
    source: ""
  };
  const node = composeScalar(ctx, token, tag, onError);
  if (anchor) {
    node.anchor = anchor.source.substring(1);
    if (node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
  }
  if (spaceBefore)
    node.spaceBefore = true;
  if (comment) {
    node.comment = comment;
    node.range[2] = end;
  }
  return node;
}
function composeAlias({ options }, { offset, source, end }, onError) {
  const alias = new Alias(source.substring(1));
  if (alias.source === "")
    onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
  if (alias.source.endsWith(":"))
    onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
  const valueEnd = offset + source.length;
  const re = resolveEnd(end, valueEnd, options.strict, onError);
  alias.range = [offset, valueEnd, re.offset];
  if (re.comment)
    alias.comment = re.comment;
  return alias;
}

// node_modules/yaml/browser/dist/compose/compose-doc.js
function composeDoc(options, directives, { offset, start, value, end }, onError) {
  const opts = Object.assign({ _directives: directives }, options);
  const doc = new Document(void 0, opts);
  const ctx = {
    atKey: false,
    atRoot: true,
    directives: doc.directives,
    options: doc.options,
    schema: doc.schema
  };
  const props = resolveProps(start, {
    indicator: "doc-start",
    next: value != null ? value : end == null ? void 0 : end[0],
    offset,
    onError,
    parentIndent: 0,
    startOnNewline: true
  });
  if (props.found) {
    doc.directives.docStart = true;
    if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
      onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
  }
  doc.contents = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
  const contentEnd = doc.contents.range[2];
  const re = resolveEnd(end, contentEnd, false, onError);
  if (re.comment)
    doc.comment = re.comment;
  doc.range = [offset, contentEnd, re.offset];
  return doc;
}

// node_modules/yaml/browser/dist/compose/composer.js
function getErrorPos(src) {
  if (typeof src === "number")
    return [src, src + 1];
  if (Array.isArray(src))
    return src.length === 2 ? src : [src[0], src[1]];
  const { offset, source } = src;
  return [offset, offset + (typeof source === "string" ? source.length : 1)];
}
function parsePrelude(prelude) {
  var _a;
  let comment = "";
  let atComment = false;
  let afterEmptyLine = false;
  for (let i = 0; i < prelude.length; ++i) {
    const source = prelude[i];
    switch (source[0]) {
      case "#":
        comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
        atComment = true;
        afterEmptyLine = false;
        break;
      case "%":
        if (((_a = prelude[i + 1]) == null ? void 0 : _a[0]) !== "#")
          i += 1;
        atComment = false;
        break;
      default:
        if (!atComment)
          afterEmptyLine = true;
        atComment = false;
    }
  }
  return { comment, afterEmptyLine };
}
var Composer = class {
  constructor(options = {}) {
    this.doc = null;
    this.atDirectives = false;
    this.prelude = [];
    this.errors = [];
    this.warnings = [];
    this.onError = (source, code, message, warning) => {
      const pos = getErrorPos(source);
      if (warning)
        this.warnings.push(new YAMLWarning(pos, code, message));
      else
        this.errors.push(new YAMLParseError(pos, code, message));
    };
    this.directives = new Directives({ version: options.version || "1.2" });
    this.options = options;
  }
  decorate(doc, afterDoc) {
    const { comment, afterEmptyLine } = parsePrelude(this.prelude);
    if (comment) {
      const dc = doc.contents;
      if (afterDoc) {
        doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
      } else if (afterEmptyLine || doc.directives.docStart || !dc) {
        doc.commentBefore = comment;
      } else if (isCollection(dc) && !dc.flow && dc.items.length > 0) {
        let it = dc.items[0];
        if (isPair(it))
          it = it.key;
        const cb = it.commentBefore;
        it.commentBefore = cb ? `${comment}
${cb}` : comment;
      } else {
        const cb = dc.commentBefore;
        dc.commentBefore = cb ? `${comment}
${cb}` : comment;
      }
    }
    if (afterDoc) {
      for (let i = 0; i < this.errors.length; ++i)
        doc.errors.push(this.errors[i]);
      for (let i = 0; i < this.warnings.length; ++i)
        doc.warnings.push(this.warnings[i]);
    } else {
      doc.errors = this.errors;
      doc.warnings = this.warnings;
    }
    this.prelude = [];
    this.errors = [];
    this.warnings = [];
  }
  /**
   * Current stream status information.
   *
   * Mostly useful at the end of input for an empty stream.
   */
  streamInfo() {
    return {
      comment: parsePrelude(this.prelude).comment,
      directives: this.directives,
      errors: this.errors,
      warnings: this.warnings
    };
  }
  /**
   * Compose tokens into documents.
   *
   * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
   * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
   */
  *compose(tokens, forceDoc = false, endOffset = -1) {
    for (const token of tokens)
      yield* this.next(token);
    yield* this.end(forceDoc, endOffset);
  }
  /** Advance the composer by one CST token. */
  *next(token) {
    switch (token.type) {
      case "directive":
        this.directives.add(token.source, (offset, message, warning) => {
          const pos = getErrorPos(token);
          pos[0] += offset;
          this.onError(pos, "BAD_DIRECTIVE", message, warning);
        });
        this.prelude.push(token.source);
        this.atDirectives = true;
        break;
      case "document": {
        const doc = composeDoc(this.options, this.directives, token, this.onError);
        if (this.atDirectives && !doc.directives.docStart)
          this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
        this.decorate(doc, false);
        if (this.doc)
          yield this.doc;
        this.doc = doc;
        this.atDirectives = false;
        break;
      }
      case "byte-order-mark":
      case "space":
        break;
      case "comment":
      case "newline":
        this.prelude.push(token.source);
        break;
      case "error": {
        const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
        const error = new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
        if (this.atDirectives || !this.doc)
          this.errors.push(error);
        else
          this.doc.errors.push(error);
        break;
      }
      case "doc-end": {
        if (!this.doc) {
          const msg = "Unexpected doc-end without preceding document";
          this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
          break;
        }
        this.doc.directives.docEnd = true;
        const end = resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
        this.decorate(this.doc, true);
        if (end.comment) {
          const dc = this.doc.comment;
          this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
        }
        this.doc.range[2] = end.offset;
        break;
      }
      default:
        this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
    }
  }
  /**
   * Call at end of input to yield any remaining document.
   *
   * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
   * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
   */
  *end(forceDoc = false, endOffset = -1) {
    if (this.doc) {
      this.decorate(this.doc, true);
      yield this.doc;
      this.doc = null;
    } else if (forceDoc) {
      const opts = Object.assign({ _directives: this.directives }, this.options);
      const doc = new Document(void 0, opts);
      if (this.atDirectives)
        this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
      doc.range = [0, endOffset, endOffset];
      this.decorate(doc, false);
      yield doc;
    }
  }
};

// node_modules/yaml/browser/dist/parse/cst.js
var cst_exports = {};
__export(cst_exports, {
  BOM: () => BOM,
  DOCUMENT: () => DOCUMENT,
  FLOW_END: () => FLOW_END,
  SCALAR: () => SCALAR2,
  createScalarToken: () => createScalarToken,
  isCollection: () => isCollection2,
  isScalar: () => isScalar2,
  prettyToken: () => prettyToken,
  resolveAsScalar: () => resolveAsScalar,
  setScalarValue: () => setScalarValue,
  stringify: () => stringify2,
  tokenType: () => tokenType,
  visit: () => visit2
});

// node_modules/yaml/browser/dist/parse/cst-scalar.js
function resolveAsScalar(token, strict = true, onError) {
  if (token) {
    const _onError = (pos, code, message) => {
      const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
      if (onError)
        onError(offset, code, message);
      else
        throw new YAMLParseError([offset, offset + 1], code, message);
    };
    switch (token.type) {
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
        return resolveFlowScalar(token, strict, _onError);
      case "block-scalar":
        return resolveBlockScalar({ options: { strict } }, token, _onError);
    }
  }
  return null;
}
function createScalarToken(value, context) {
  var _a;
  const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
  const source = stringifyString({ type, value }, {
    implicitKey,
    indent: indent > 0 ? " ".repeat(indent) : "",
    inFlow,
    options: { blockQuote: true, lineWidth: -1 }
  });
  const end = (_a = context.end) != null ? _a : [
    { type: "newline", offset: -1, indent, source: "\n" }
  ];
  switch (source[0]) {
    case "|":
    case ">": {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      const props = [
        { type: "block-scalar-header", offset, indent, source: head }
      ];
      if (!addEndtoBlockProps(props, end))
        props.push({ type: "newline", offset: -1, indent, source: "\n" });
      return { type: "block-scalar", offset, indent, props, source: body };
    }
    case '"':
      return { type: "double-quoted-scalar", offset, indent, source, end };
    case "'":
      return { type: "single-quoted-scalar", offset, indent, source, end };
    default:
      return { type: "scalar", offset, indent, source, end };
  }
}
function setScalarValue(token, value, context = {}) {
  let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
  let indent = "indent" in token ? token.indent : null;
  if (afterKey && typeof indent === "number")
    indent += 2;
  if (!type)
    switch (token.type) {
      case "single-quoted-scalar":
        type = "QUOTE_SINGLE";
        break;
      case "double-quoted-scalar":
        type = "QUOTE_DOUBLE";
        break;
      case "block-scalar": {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
        break;
      }
      default:
        type = "PLAIN";
    }
  const source = stringifyString({ type, value }, {
    implicitKey: implicitKey || indent === null,
    indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
    inFlow,
    options: { blockQuote: true, lineWidth: -1 }
  });
  switch (source[0]) {
    case "|":
    case ">":
      setBlockScalarValue(token, source);
      break;
    case '"':
      setFlowScalarValue(token, source, "double-quoted-scalar");
      break;
    case "'":
      setFlowScalarValue(token, source, "single-quoted-scalar");
      break;
    default:
      setFlowScalarValue(token, source, "scalar");
  }
}
function setBlockScalarValue(token, source) {
  const he = source.indexOf("\n");
  const head = source.substring(0, he);
  const body = source.substring(he + 1) + "\n";
  if (token.type === "block-scalar") {
    const header = token.props[0];
    if (header.type !== "block-scalar-header")
      throw new Error("Invalid block scalar header");
    header.source = head;
    token.source = body;
  } else {
    const { offset } = token;
    const indent = "indent" in token ? token.indent : -1;
    const props = [
      { type: "block-scalar-header", offset, indent, source: head }
    ];
    if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
      props.push({ type: "newline", offset: -1, indent, source: "\n" });
    for (const key of Object.keys(token))
      if (key !== "type" && key !== "offset")
        delete token[key];
    Object.assign(token, { type: "block-scalar", indent, props, source: body });
  }
}
function addEndtoBlockProps(props, end) {
  if (end)
    for (const st of end)
      switch (st.type) {
        case "space":
        case "comment":
          props.push(st);
          break;
        case "newline":
          props.push(st);
          return true;
      }
  return false;
}
function setFlowScalarValue(token, source, type) {
  switch (token.type) {
    case "scalar":
    case "double-quoted-scalar":
    case "single-quoted-scalar":
      token.type = type;
      token.source = source;
      break;
    case "block-scalar": {
      const end = token.props.slice(1);
      let oa = source.length;
      if (token.props[0].type === "block-scalar-header")
        oa -= token.props[0].source.length;
      for (const tok of end)
        tok.offset += oa;
      delete token.props;
      Object.assign(token, { type, source, end });
      break;
    }
    case "block-map":
    case "block-seq": {
      const offset = token.offset + source.length;
      const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
      delete token.items;
      Object.assign(token, { type, source, end: [nl] });
      break;
    }
    default: {
      const indent = "indent" in token ? token.indent : -1;
      const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
      for (const key of Object.keys(token))
        if (key !== "type" && key !== "offset")
          delete token[key];
      Object.assign(token, { type, indent, source, end });
    }
  }
}

// node_modules/yaml/browser/dist/parse/cst-stringify.js
var stringify2 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
function stringifyToken(token) {
  switch (token.type) {
    case "block-scalar": {
      let res = "";
      for (const tok of token.props)
        res += stringifyToken(tok);
      return res + token.source;
    }
    case "block-map":
    case "block-seq": {
      let res = "";
      for (const item of token.items)
        res += stringifyItem(item);
      return res;
    }
    case "flow-collection": {
      let res = token.start.source;
      for (const item of token.items)
        res += stringifyItem(item);
      for (const st of token.end)
        res += st.source;
      return res;
    }
    case "document": {
      let res = stringifyItem(token);
      if (token.end)
        for (const st of token.end)
          res += st.source;
      return res;
    }
    default: {
      let res = token.source;
      if ("end" in token && token.end)
        for (const st of token.end)
          res += st.source;
      return res;
    }
  }
}
function stringifyItem({ start, key, sep, value }) {
  let res = "";
  for (const st of start)
    res += st.source;
  if (key)
    res += stringifyToken(key);
  if (sep)
    for (const st of sep)
      res += st.source;
  if (value)
    res += stringifyToken(value);
  return res;
}

// node_modules/yaml/browser/dist/parse/cst-visit.js
var BREAK2 = Symbol("break visit");
var SKIP2 = Symbol("skip children");
var REMOVE2 = Symbol("remove item");
function visit2(cst, visitor) {
  if ("type" in cst && cst.type === "document")
    cst = { start: cst.start, value: cst.value };
  _visit(Object.freeze([]), cst, visitor);
}
visit2.BREAK = BREAK2;
visit2.SKIP = SKIP2;
visit2.REMOVE = REMOVE2;
visit2.itemAtPath = (cst, path) => {
  let item = cst;
  for (const [field, index] of path) {
    const tok = item == null ? void 0 : item[field];
    if (tok && "items" in tok) {
      item = tok.items[index];
    } else
      return void 0;
  }
  return item;
};
visit2.parentCollection = (cst, path) => {
  const parent = visit2.itemAtPath(cst, path.slice(0, -1));
  const field = path[path.length - 1][0];
  const coll = parent == null ? void 0 : parent[field];
  if (coll && "items" in coll)
    return coll;
  throw new Error("Parent collection not found");
};
function _visit(path, item, visitor) {
  let ctrl = visitor(item, path);
  if (typeof ctrl === "symbol")
    return ctrl;
  for (const field of ["key", "value"]) {
    const token = item[field];
    if (token && "items" in token) {
      for (let i = 0; i < token.items.length; ++i) {
        const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK2)
          return BREAK2;
        else if (ci === REMOVE2) {
          token.items.splice(i, 1);
          i -= 1;
        }
      }
      if (typeof ctrl === "function" && field === "key")
        ctrl = ctrl(item, path);
    }
  }
  return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
}

// node_modules/yaml/browser/dist/parse/cst.js
var BOM = "\uFEFF";
var DOCUMENT = "";
var FLOW_END = "";
var SCALAR2 = "";
var isCollection2 = (token) => !!token && "items" in token;
var isScalar2 = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
function prettyToken(token) {
  switch (token) {
    case BOM:
      return "<BOM>";
    case DOCUMENT:
      return "<DOC>";
    case FLOW_END:
      return "<FLOW_END>";
    case SCALAR2:
      return "<SCALAR>";
    default:
      return JSON.stringify(token);
  }
}
function tokenType(source) {
  switch (source) {
    case BOM:
      return "byte-order-mark";
    case DOCUMENT:
      return "doc-mode";
    case FLOW_END:
      return "flow-error-end";
    case SCALAR2:
      return "scalar";
    case "---":
      return "doc-start";
    case "...":
      return "doc-end";
    case "":
    case "\n":
    case "\r\n":
      return "newline";
    case "-":
      return "seq-item-ind";
    case "?":
      return "explicit-key-ind";
    case ":":
      return "map-value-ind";
    case "{":
      return "flow-map-start";
    case "}":
      return "flow-map-end";
    case "[":
      return "flow-seq-start";
    case "]":
      return "flow-seq-end";
    case ",":
      return "comma";
  }
  switch (source[0]) {
    case " ":
    case "	":
      return "space";
    case "#":
      return "comment";
    case "%":
      return "directive-line";
    case "*":
      return "alias";
    case "&":
      return "anchor";
    case "!":
      return "tag";
    case "'":
      return "single-quoted-scalar";
    case '"':
      return "double-quoted-scalar";
    case "|":
    case ">":
      return "block-scalar-header";
  }
  return null;
}

// node_modules/yaml/browser/dist/parse/lexer.js
function isEmpty(ch) {
  switch (ch) {
    case void 0:
    case " ":
    case "\n":
    case "\r":
    case "	":
      return true;
    default:
      return false;
  }
}
var hexDigits = new Set("0123456789ABCDEFabcdef");
var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
var flowIndicatorChars = new Set(",[]{}");
var invalidAnchorChars = new Set(" ,[]{}\n\r	");
var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
var Lexer = class {
  constructor() {
    this.atEnd = false;
    this.blockScalarIndent = -1;
    this.blockScalarKeep = false;
    this.buffer = "";
    this.flowKey = false;
    this.flowLevel = 0;
    this.indentNext = 0;
    this.indentValue = 0;
    this.lineEndPos = null;
    this.next = null;
    this.pos = 0;
  }
  /**
   * Generate YAML tokens from the `source` string. If `incomplete`,
   * a part of the last line may be left as a buffer for the next call.
   *
   * @returns A generator of lexical tokens
   */
  *lex(source, incomplete = false) {
    var _a;
    if (source) {
      if (typeof source !== "string")
        throw TypeError("source is not a string");
      this.buffer = this.buffer ? this.buffer + source : source;
      this.lineEndPos = null;
    }
    this.atEnd = !incomplete;
    let next = (_a = this.next) != null ? _a : "stream";
    while (next && (incomplete || this.hasChars(1)))
      next = yield* this.parseNext(next);
  }
  atLineEnd() {
    let i = this.pos;
    let ch = this.buffer[i];
    while (ch === " " || ch === "	")
      ch = this.buffer[++i];
    if (!ch || ch === "#" || ch === "\n")
      return true;
    if (ch === "\r")
      return this.buffer[i + 1] === "\n";
    return false;
  }
  charAt(n) {
    return this.buffer[this.pos + n];
  }
  continueScalar(offset) {
    let ch = this.buffer[offset];
    if (this.indentNext > 0) {
      let indent = 0;
      while (ch === " ")
        ch = this.buffer[++indent + offset];
      if (ch === "\r") {
        const next = this.buffer[indent + offset + 1];
        if (next === "\n" || !next && !this.atEnd)
          return offset + indent + 1;
      }
      return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
    }
    if (ch === "-" || ch === ".") {
      const dt = this.buffer.substr(offset, 3);
      if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
        return -1;
    }
    return offset;
  }
  getLine() {
    let end = this.lineEndPos;
    if (typeof end !== "number" || end !== -1 && end < this.pos) {
      end = this.buffer.indexOf("\n", this.pos);
      this.lineEndPos = end;
    }
    if (end === -1)
      return this.atEnd ? this.buffer.substring(this.pos) : null;
    if (this.buffer[end - 1] === "\r")
      end -= 1;
    return this.buffer.substring(this.pos, end);
  }
  hasChars(n) {
    return this.pos + n <= this.buffer.length;
  }
  setNext(state) {
    this.buffer = this.buffer.substring(this.pos);
    this.pos = 0;
    this.lineEndPos = null;
    this.next = state;
    return null;
  }
  peek(n) {
    return this.buffer.substr(this.pos, n);
  }
  *parseNext(next) {
    switch (next) {
      case "stream":
        return yield* this.parseStream();
      case "line-start":
        return yield* this.parseLineStart();
      case "block-start":
        return yield* this.parseBlockStart();
      case "doc":
        return yield* this.parseDocument();
      case "flow":
        return yield* this.parseFlowCollection();
      case "quoted-scalar":
        return yield* this.parseQuotedScalar();
      case "block-scalar":
        return yield* this.parseBlockScalar();
      case "plain-scalar":
        return yield* this.parsePlainScalar();
    }
  }
  *parseStream() {
    let line = this.getLine();
    if (line === null)
      return this.setNext("stream");
    if (line[0] === BOM) {
      yield* this.pushCount(1);
      line = line.substring(1);
    }
    if (line[0] === "%") {
      let dirEnd = line.length;
      let cs = line.indexOf("#");
      while (cs !== -1) {
        const ch = line[cs - 1];
        if (ch === " " || ch === "	") {
          dirEnd = cs - 1;
          break;
        } else {
          cs = line.indexOf("#", cs + 1);
        }
      }
      while (true) {
        const ch = line[dirEnd - 1];
        if (ch === " " || ch === "	")
          dirEnd -= 1;
        else
          break;
      }
      const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
      yield* this.pushCount(line.length - n);
      this.pushNewline();
      return "stream";
    }
    if (this.atLineEnd()) {
      const sp = yield* this.pushSpaces(true);
      yield* this.pushCount(line.length - sp);
      yield* this.pushNewline();
      return "stream";
    }
    yield DOCUMENT;
    return yield* this.parseLineStart();
  }
  *parseLineStart() {
    const ch = this.charAt(0);
    if (!ch && !this.atEnd)
      return this.setNext("line-start");
    if (ch === "-" || ch === ".") {
      if (!this.atEnd && !this.hasChars(4))
        return this.setNext("line-start");
      const s = this.peek(3);
      if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
        yield* this.pushCount(3);
        this.indentValue = 0;
        this.indentNext = 0;
        return s === "---" ? "doc" : "stream";
      }
    }
    this.indentValue = yield* this.pushSpaces(false);
    if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
      this.indentNext = this.indentValue;
    return yield* this.parseBlockStart();
  }
  *parseBlockStart() {
    const [ch0, ch1] = this.peek(2);
    if (!ch1 && !this.atEnd)
      return this.setNext("block-start");
    if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
      const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
      this.indentNext = this.indentValue + 1;
      this.indentValue += n;
      return "block-start";
    }
    return "doc";
  }
  *parseDocument() {
    yield* this.pushSpaces(true);
    const line = this.getLine();
    if (line === null)
      return this.setNext("doc");
    let n = yield* this.pushIndicators();
    switch (line[n]) {
      case "#":
        yield* this.pushCount(line.length - n);
      // fallthrough
      case void 0:
        yield* this.pushNewline();
        return yield* this.parseLineStart();
      case "{":
      case "[":
        yield* this.pushCount(1);
        this.flowKey = false;
        this.flowLevel = 1;
        return "flow";
      case "}":
      case "]":
        yield* this.pushCount(1);
        return "doc";
      case "*":
        yield* this.pushUntil(isNotAnchorChar);
        return "doc";
      case '"':
      case "'":
        return yield* this.parseQuotedScalar();
      case "|":
      case ">":
        n += yield* this.parseBlockScalarHeader();
        n += yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - n);
        yield* this.pushNewline();
        return yield* this.parseBlockScalar();
      default:
        return yield* this.parsePlainScalar();
    }
  }
  *parseFlowCollection() {
    let nl, sp;
    let indent = -1;
    do {
      nl = yield* this.pushNewline();
      if (nl > 0) {
        sp = yield* this.pushSpaces(false);
        this.indentValue = indent = sp;
      } else {
        sp = 0;
      }
      sp += yield* this.pushSpaces(true);
    } while (nl + sp > 0);
    const line = this.getLine();
    if (line === null)
      return this.setNext("flow");
    if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
      const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
      if (!atFlowEndMarker) {
        this.flowLevel = 0;
        yield FLOW_END;
        return yield* this.parseLineStart();
      }
    }
    let n = 0;
    while (line[n] === ",") {
      n += yield* this.pushCount(1);
      n += yield* this.pushSpaces(true);
      this.flowKey = false;
    }
    n += yield* this.pushIndicators();
    switch (line[n]) {
      case void 0:
        return "flow";
      case "#":
        yield* this.pushCount(line.length - n);
        return "flow";
      case "{":
      case "[":
        yield* this.pushCount(1);
        this.flowKey = false;
        this.flowLevel += 1;
        return "flow";
      case "}":
      case "]":
        yield* this.pushCount(1);
        this.flowKey = true;
        this.flowLevel -= 1;
        return this.flowLevel ? "flow" : "doc";
      case "*":
        yield* this.pushUntil(isNotAnchorChar);
        return "flow";
      case '"':
      case "'":
        this.flowKey = true;
        return yield* this.parseQuotedScalar();
      case ":": {
        const next = this.charAt(1);
        if (this.flowKey || isEmpty(next) || next === ",") {
          this.flowKey = false;
          yield* this.pushCount(1);
          yield* this.pushSpaces(true);
          return "flow";
        }
      }
      // fallthrough
      default:
        this.flowKey = false;
        return yield* this.parsePlainScalar();
    }
  }
  *parseQuotedScalar() {
    const quote = this.charAt(0);
    let end = this.buffer.indexOf(quote, this.pos + 1);
    if (quote === "'") {
      while (end !== -1 && this.buffer[end + 1] === "'")
        end = this.buffer.indexOf("'", end + 2);
    } else {
      while (end !== -1) {
        let n = 0;
        while (this.buffer[end - 1 - n] === "\\")
          n += 1;
        if (n % 2 === 0)
          break;
        end = this.buffer.indexOf('"', end + 1);
      }
    }
    const qb = this.buffer.substring(0, end);
    let nl = qb.indexOf("\n", this.pos);
    if (nl !== -1) {
      while (nl !== -1) {
        const cs = this.continueScalar(nl + 1);
        if (cs === -1)
          break;
        nl = qb.indexOf("\n", cs);
      }
      if (nl !== -1) {
        end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
      }
    }
    if (end === -1) {
      if (!this.atEnd)
        return this.setNext("quoted-scalar");
      end = this.buffer.length;
    }
    yield* this.pushToIndex(end + 1, false);
    return this.flowLevel ? "flow" : "doc";
  }
  *parseBlockScalarHeader() {
    this.blockScalarIndent = -1;
    this.blockScalarKeep = false;
    let i = this.pos;
    while (true) {
      const ch = this.buffer[++i];
      if (ch === "+")
        this.blockScalarKeep = true;
      else if (ch > "0" && ch <= "9")
        this.blockScalarIndent = Number(ch) - 1;
      else if (ch !== "-")
        break;
    }
    return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
  }
  *parseBlockScalar() {
    let nl = this.pos - 1;
    let indent = 0;
    let ch;
    loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
      switch (ch) {
        case " ":
          indent += 1;
          break;
        case "\n":
          nl = i2;
          indent = 0;
          break;
        case "\r": {
          const next = this.buffer[i2 + 1];
          if (!next && !this.atEnd)
            return this.setNext("block-scalar");
          if (next === "\n")
            break;
        }
        // fallthrough
        default:
          break loop;
      }
    }
    if (!ch && !this.atEnd)
      return this.setNext("block-scalar");
    if (indent >= this.indentNext) {
      if (this.blockScalarIndent === -1)
        this.indentNext = indent;
      else {
        this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
      }
      do {
        const cs = this.continueScalar(nl + 1);
        if (cs === -1)
          break;
        nl = this.buffer.indexOf("\n", cs);
      } while (nl !== -1);
      if (nl === -1) {
        if (!this.atEnd)
          return this.setNext("block-scalar");
        nl = this.buffer.length;
      }
    }
    let i = nl + 1;
    ch = this.buffer[i];
    while (ch === " ")
      ch = this.buffer[++i];
    if (ch === "	") {
      while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
        ch = this.buffer[++i];
      nl = i - 1;
    } else if (!this.blockScalarKeep) {
      do {
        let i2 = nl - 1;
        let ch2 = this.buffer[i2];
        if (ch2 === "\r")
          ch2 = this.buffer[--i2];
        const lastChar = i2;
        while (ch2 === " ")
          ch2 = this.buffer[--i2];
        if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
          nl = i2;
        else
          break;
      } while (true);
    }
    yield SCALAR2;
    yield* this.pushToIndex(nl + 1, true);
    return yield* this.parseLineStart();
  }
  *parsePlainScalar() {
    const inFlow = this.flowLevel > 0;
    let end = this.pos - 1;
    let i = this.pos - 1;
    let ch;
    while (ch = this.buffer[++i]) {
      if (ch === ":") {
        const next = this.buffer[i + 1];
        if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
          break;
        end = i;
      } else if (isEmpty(ch)) {
        let next = this.buffer[i + 1];
        if (ch === "\r") {
          if (next === "\n") {
            i += 1;
            ch = "\n";
            next = this.buffer[i + 1];
          } else
            end = i;
        }
        if (next === "#" || inFlow && flowIndicatorChars.has(next))
          break;
        if (ch === "\n") {
          const cs = this.continueScalar(i + 1);
          if (cs === -1)
            break;
          i = Math.max(i, cs - 2);
        }
      } else {
        if (inFlow && flowIndicatorChars.has(ch))
          break;
        end = i;
      }
    }
    if (!ch && !this.atEnd)
      return this.setNext("plain-scalar");
    yield SCALAR2;
    yield* this.pushToIndex(end + 1, true);
    return inFlow ? "flow" : "doc";
  }
  *pushCount(n) {
    if (n > 0) {
      yield this.buffer.substr(this.pos, n);
      this.pos += n;
      return n;
    }
    return 0;
  }
  *pushToIndex(i, allowEmpty) {
    const s = this.buffer.slice(this.pos, i);
    if (s) {
      yield s;
      this.pos += s.length;
      return s.length;
    } else if (allowEmpty)
      yield "";
    return 0;
  }
  *pushIndicators() {
    let n = 0;
    loop: while (true) {
      switch (this.charAt(0)) {
        case "!":
          n += yield* this.pushTag();
          n += yield* this.pushSpaces(true);
          continue loop;
        case "&":
          n += yield* this.pushUntil(isNotAnchorChar);
          n += yield* this.pushSpaces(true);
          continue loop;
        case "-":
        // this is an error
        case "?":
        // this is an error outside flow collections
        case ":": {
          const inFlow = this.flowLevel > 0;
          const ch1 = this.charAt(1);
          if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
            if (!inFlow)
              this.indentNext = this.indentValue + 1;
            else if (this.flowKey)
              this.flowKey = false;
            n += yield* this.pushCount(1);
            n += yield* this.pushSpaces(true);
            continue loop;
          }
        }
      }
      break loop;
    }
    return n;
  }
  *pushTag() {
    if (this.charAt(1) === "<") {
      let i = this.pos + 2;
      let ch = this.buffer[i];
      while (!isEmpty(ch) && ch !== ">")
        ch = this.buffer[++i];
      return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
    } else {
      let i = this.pos + 1;
      let ch = this.buffer[i];
      while (ch) {
        if (tagChars.has(ch))
          ch = this.buffer[++i];
        else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
          ch = this.buffer[i += 3];
        } else
          break;
      }
      return yield* this.pushToIndex(i, false);
    }
  }
  *pushNewline() {
    const ch = this.buffer[this.pos];
    if (ch === "\n")
      return yield* this.pushCount(1);
    else if (ch === "\r" && this.charAt(1) === "\n")
      return yield* this.pushCount(2);
    else
      return 0;
  }
  *pushSpaces(allowTabs) {
    let i = this.pos - 1;
    let ch;
    do {
      ch = this.buffer[++i];
    } while (ch === " " || allowTabs && ch === "	");
    const n = i - this.pos;
    if (n > 0) {
      yield this.buffer.substr(this.pos, n);
      this.pos = i;
    }
    return n;
  }
  *pushUntil(test) {
    let i = this.pos;
    let ch = this.buffer[i];
    while (!test(ch))
      ch = this.buffer[++i];
    return yield* this.pushToIndex(i, false);
  }
};

// node_modules/yaml/browser/dist/parse/line-counter.js
var LineCounter = class {
  constructor() {
    this.lineStarts = [];
    this.addNewLine = (offset) => this.lineStarts.push(offset);
    this.linePos = (offset) => {
      let low = 0;
      let high = this.lineStarts.length;
      while (low < high) {
        const mid = low + high >> 1;
        if (this.lineStarts[mid] < offset)
          low = mid + 1;
        else
          high = mid;
      }
      if (this.lineStarts[low] === offset)
        return { line: low + 1, col: 1 };
      if (low === 0)
        return { line: 0, col: offset };
      const start = this.lineStarts[low - 1];
      return { line: low, col: offset - start + 1 };
    };
  }
};

// node_modules/yaml/browser/dist/parse/parser.js
function includesToken(list, type) {
  for (let i = 0; i < list.length; ++i)
    if (list[i].type === type)
      return true;
  return false;
}
function findNonEmptyIndex(list) {
  for (let i = 0; i < list.length; ++i) {
    switch (list[i].type) {
      case "space":
      case "comment":
      case "newline":
        break;
      default:
        return i;
    }
  }
  return -1;
}
function isFlowToken(token) {
  switch (token == null ? void 0 : token.type) {
    case "alias":
    case "scalar":
    case "single-quoted-scalar":
    case "double-quoted-scalar":
    case "flow-collection":
      return true;
    default:
      return false;
  }
}
function getPrevProps(parent) {
  var _a;
  switch (parent.type) {
    case "document":
      return parent.start;
    case "block-map": {
      const it = parent.items[parent.items.length - 1];
      return (_a = it.sep) != null ? _a : it.start;
    }
    case "block-seq":
      return parent.items[parent.items.length - 1].start;
    /* istanbul ignore next should not happen */
    default:
      return [];
  }
}
function getFirstKeyStartProps(prev) {
  var _a;
  if (prev.length === 0)
    return [];
  let i = prev.length;
  loop: while (--i >= 0) {
    switch (prev[i].type) {
      case "doc-start":
      case "explicit-key-ind":
      case "map-value-ind":
      case "seq-item-ind":
      case "newline":
        break loop;
    }
  }
  while (((_a = prev[++i]) == null ? void 0 : _a.type) === "space") {
  }
  return prev.splice(i, prev.length);
}
function arrayPushArray(target, source) {
  if (source.length < 1e5)
    Array.prototype.push.apply(target, source);
  else
    for (let i = 0; i < source.length; ++i)
      target.push(source[i]);
}
function fixFlowSeqItems(fc) {
  if (fc.start.type === "flow-seq-start") {
    for (const it of fc.items) {
      if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
        if (it.key)
          it.value = it.key;
        delete it.key;
        if (isFlowToken(it.value)) {
          if (it.value.end)
            arrayPushArray(it.value.end, it.sep);
          else
            it.value.end = it.sep;
        } else
          arrayPushArray(it.start, it.sep);
        delete it.sep;
      }
    }
  }
}
var Parser = class {
  /**
   * @param onNewLine - If defined, called separately with the start position of
   *   each new line (in `parse()`, including the start of input).
   */
  constructor(onNewLine) {
    this.atNewLine = true;
    this.atScalar = false;
    this.indent = 0;
    this.offset = 0;
    this.onKeyLine = false;
    this.stack = [];
    this.source = "";
    this.type = "";
    this.lexer = new Lexer();
    this.onNewLine = onNewLine;
  }
  /**
   * Parse `source` as a YAML stream.
   * If `incomplete`, a part of the last line may be left as a buffer for the next call.
   *
   * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
   *
   * @returns A generator of tokens representing each directive, document, and other structure.
   */
  *parse(source, incomplete = false) {
    if (this.onNewLine && this.offset === 0)
      this.onNewLine(0);
    for (const lexeme of this.lexer.lex(source, incomplete))
      yield* this.next(lexeme);
    if (!incomplete)
      yield* this.end();
  }
  /**
   * Advance the parser by the `source` of one lexical token.
   */
  *next(source) {
    this.source = source;
    if (this.atScalar) {
      this.atScalar = false;
      yield* this.step();
      this.offset += source.length;
      return;
    }
    const type = tokenType(source);
    if (!type) {
      const message = `Not a YAML token: ${source}`;
      yield* this.pop({ type: "error", offset: this.offset, message, source });
      this.offset += source.length;
    } else if (type === "scalar") {
      this.atNewLine = false;
      this.atScalar = true;
      this.type = "scalar";
    } else {
      this.type = type;
      yield* this.step();
      switch (type) {
        case "newline":
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine)
            this.onNewLine(this.offset + source.length);
          break;
        case "space":
          if (this.atNewLine && source[0] === " ")
            this.indent += source.length;
          break;
        case "explicit-key-ind":
        case "map-value-ind":
        case "seq-item-ind":
          if (this.atNewLine)
            this.indent += source.length;
          break;
        case "doc-mode":
        case "flow-error-end":
          return;
        default:
          this.atNewLine = false;
      }
      this.offset += source.length;
    }
  }
  /** Call at end of input to push out any remaining constructions */
  *end() {
    while (this.stack.length > 0)
      yield* this.pop();
  }
  get sourceToken() {
    const st = {
      type: this.type,
      offset: this.offset,
      indent: this.indent,
      source: this.source
    };
    return st;
  }
  *step() {
    const top = this.peek(1);
    if (this.type === "doc-end" && (top == null ? void 0 : top.type) !== "doc-end") {
      while (this.stack.length > 0)
        yield* this.pop();
      this.stack.push({
        type: "doc-end",
        offset: this.offset,
        source: this.source
      });
      return;
    }
    if (!top)
      return yield* this.stream();
    switch (top.type) {
      case "document":
        return yield* this.document(top);
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
        return yield* this.scalar(top);
      case "block-scalar":
        return yield* this.blockScalar(top);
      case "block-map":
        return yield* this.blockMap(top);
      case "block-seq":
        return yield* this.blockSequence(top);
      case "flow-collection":
        return yield* this.flowCollection(top);
      case "doc-end":
        return yield* this.documentEnd(top);
    }
    yield* this.pop();
  }
  peek(n) {
    return this.stack[this.stack.length - n];
  }
  *pop(error) {
    const token = error != null ? error : this.stack.pop();
    if (!token) {
      const message = "Tried to pop an empty stack";
      yield { type: "error", offset: this.offset, source: "", message };
    } else if (this.stack.length === 0) {
      yield token;
    } else {
      const top = this.peek(1);
      if (token.type === "block-scalar") {
        token.indent = "indent" in top ? top.indent : 0;
      } else if (token.type === "flow-collection" && top.type === "document") {
        token.indent = 0;
      }
      if (token.type === "flow-collection")
        fixFlowSeqItems(token);
      switch (top.type) {
        case "document":
          top.value = token;
          break;
        case "block-scalar":
          top.props.push(token);
          break;
        case "block-map": {
          const it = top.items[top.items.length - 1];
          if (it.value) {
            top.items.push({ start: [], key: token, sep: [] });
            this.onKeyLine = true;
            return;
          } else if (it.sep) {
            it.value = token;
          } else {
            Object.assign(it, { key: token, sep: [] });
            this.onKeyLine = !it.explicitKey;
            return;
          }
          break;
        }
        case "block-seq": {
          const it = top.items[top.items.length - 1];
          if (it.value)
            top.items.push({ start: [], value: token });
          else
            it.value = token;
          break;
        }
        case "flow-collection": {
          const it = top.items[top.items.length - 1];
          if (!it || it.value)
            top.items.push({ start: [], key: token, sep: [] });
          else if (it.sep)
            it.value = token;
          else
            Object.assign(it, { key: token, sep: [] });
          return;
        }
        /* istanbul ignore next should not happen */
        default:
          yield* this.pop();
          yield* this.pop(token);
      }
      if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
        const last = token.items[token.items.length - 1];
        if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
          if (top.type === "document")
            top.end = last.start;
          else
            top.items.push({ start: last.start });
          token.items.splice(-1, 1);
        }
      }
    }
  }
  *stream() {
    switch (this.type) {
      case "directive-line":
        yield { type: "directive", offset: this.offset, source: this.source };
        return;
      case "byte-order-mark":
      case "space":
      case "comment":
      case "newline":
        yield this.sourceToken;
        return;
      case "doc-mode":
      case "doc-start": {
        const doc = {
          type: "document",
          offset: this.offset,
          start: []
        };
        if (this.type === "doc-start")
          doc.start.push(this.sourceToken);
        this.stack.push(doc);
        return;
      }
    }
    yield {
      type: "error",
      offset: this.offset,
      message: `Unexpected ${this.type} token in YAML stream`,
      source: this.source
    };
  }
  *document(doc) {
    if (doc.value)
      return yield* this.lineEnd(doc);
    switch (this.type) {
      case "doc-start": {
        if (findNonEmptyIndex(doc.start) !== -1) {
          yield* this.pop();
          yield* this.step();
        } else
          doc.start.push(this.sourceToken);
        return;
      }
      case "anchor":
      case "tag":
      case "space":
      case "comment":
      case "newline":
        doc.start.push(this.sourceToken);
        return;
    }
    const bv = this.startBlockValue(doc);
    if (bv)
      this.stack.push(bv);
    else {
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML document`,
        source: this.source
      };
    }
  }
  *scalar(scalar) {
    if (this.type === "map-value-ind") {
      const prev = getPrevProps(this.peek(2));
      const start = getFirstKeyStartProps(prev);
      let sep;
      if (scalar.end) {
        sep = scalar.end;
        sep.push(this.sourceToken);
        delete scalar.end;
      } else
        sep = [this.sourceToken];
      const map2 = {
        type: "block-map",
        offset: scalar.offset,
        indent: scalar.indent,
        items: [{ start, key: scalar, sep }]
      };
      this.onKeyLine = true;
      this.stack[this.stack.length - 1] = map2;
    } else
      yield* this.lineEnd(scalar);
  }
  *blockScalar(scalar) {
    switch (this.type) {
      case "space":
      case "comment":
      case "newline":
        scalar.props.push(this.sourceToken);
        return;
      case "scalar":
        scalar.source = this.source;
        this.atNewLine = true;
        this.indent = 0;
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        yield* this.pop();
        break;
      /* istanbul ignore next should not happen */
      default:
        yield* this.pop();
        yield* this.step();
    }
  }
  *blockMap(map2) {
    var _a;
    const it = map2.items[map2.items.length - 1];
    switch (this.type) {
      case "newline":
        this.onKeyLine = false;
        if (it.value) {
          const end = "end" in it.value ? it.value.end : void 0;
          const last = Array.isArray(end) ? end[end.length - 1] : void 0;
          if ((last == null ? void 0 : last.type) === "comment")
            end == null ? void 0 : end.push(this.sourceToken);
          else
            map2.items.push({ start: [this.sourceToken] });
        } else if (it.sep) {
          it.sep.push(this.sourceToken);
        } else {
          it.start.push(this.sourceToken);
        }
        return;
      case "space":
      case "comment":
        if (it.value) {
          map2.items.push({ start: [this.sourceToken] });
        } else if (it.sep) {
          it.sep.push(this.sourceToken);
        } else {
          if (this.atIndentedComment(it.start, map2.indent)) {
            const prev = map2.items[map2.items.length - 2];
            const end = (_a = prev == null ? void 0 : prev.value) == null ? void 0 : _a.end;
            if (Array.isArray(end)) {
              arrayPushArray(end, it.start);
              end.push(this.sourceToken);
              map2.items.pop();
              return;
            }
          }
          it.start.push(this.sourceToken);
        }
        return;
    }
    if (this.indent >= map2.indent) {
      const atMapIndent = !this.onKeyLine && this.indent === map2.indent;
      const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
      let start = [];
      if (atNextItem && it.sep && !it.value) {
        const nl = [];
        for (let i = 0; i < it.sep.length; ++i) {
          const st = it.sep[i];
          switch (st.type) {
            case "newline":
              nl.push(i);
              break;
            case "space":
              break;
            case "comment":
              if (st.indent > map2.indent)
                nl.length = 0;
              break;
            default:
              nl.length = 0;
          }
        }
        if (nl.length >= 2)
          start = it.sep.splice(nl[1]);
      }
      switch (this.type) {
        case "anchor":
        case "tag":
          if (atNextItem || it.value) {
            start.push(this.sourceToken);
            map2.items.push({ start });
            this.onKeyLine = true;
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "explicit-key-ind":
          if (!it.sep && !it.explicitKey) {
            it.start.push(this.sourceToken);
            it.explicitKey = true;
          } else if (atNextItem || it.value) {
            start.push(this.sourceToken);
            map2.items.push({ start, explicitKey: true });
          } else {
            this.stack.push({
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken], explicitKey: true }]
            });
          }
          this.onKeyLine = true;
          return;
        case "map-value-ind":
          if (it.explicitKey) {
            if (!it.sep) {
              if (includesToken(it.start, "newline")) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else {
                const start2 = getFirstKeyStartProps(it.start);
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                });
              }
            } else if (it.value) {
              map2.items.push({ start: [], key: null, sep: [this.sourceToken] });
            } else if (includesToken(it.sep, "map-value-ind")) {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start, key: null, sep: [this.sourceToken] }]
              });
            } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
              const start2 = getFirstKeyStartProps(it.start);
              const key = it.key;
              const sep = it.sep;
              sep.push(this.sourceToken);
              delete it.key;
              delete it.sep;
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: start2, key, sep }]
              });
            } else if (start.length > 0) {
              it.sep = it.sep.concat(start, this.sourceToken);
            } else {
              it.sep.push(this.sourceToken);
            }
          } else {
            if (!it.sep) {
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            } else if (it.value || atNextItem) {
              map2.items.push({ start, key: null, sep: [this.sourceToken] });
            } else if (includesToken(it.sep, "map-value-ind")) {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [], key: null, sep: [this.sourceToken] }]
              });
            } else {
              it.sep.push(this.sourceToken);
            }
          }
          this.onKeyLine = true;
          return;
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar": {
          const fs = this.flowScalar(this.type);
          if (atNextItem || it.value) {
            map2.items.push({ start, key: fs, sep: [] });
            this.onKeyLine = true;
          } else if (it.sep) {
            this.stack.push(fs);
          } else {
            Object.assign(it, { key: fs, sep: [] });
            this.onKeyLine = true;
          }
          return;
        }
        default: {
          const bv = this.startBlockValue(map2);
          if (bv) {
            if (bv.type === "block-seq") {
              if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                yield* this.pop({
                  type: "error",
                  offset: this.offset,
                  message: "Unexpected block-seq-ind on same line with key",
                  source: this.source
                });
                return;
              }
            } else if (atMapIndent) {
              map2.items.push({ start });
            }
            this.stack.push(bv);
            return;
          }
        }
      }
    }
    yield* this.pop();
    yield* this.step();
  }
  *blockSequence(seq2) {
    var _a;
    const it = seq2.items[seq2.items.length - 1];
    switch (this.type) {
      case "newline":
        if (it.value) {
          const end = "end" in it.value ? it.value.end : void 0;
          const last = Array.isArray(end) ? end[end.length - 1] : void 0;
          if ((last == null ? void 0 : last.type) === "comment")
            end == null ? void 0 : end.push(this.sourceToken);
          else
            seq2.items.push({ start: [this.sourceToken] });
        } else
          it.start.push(this.sourceToken);
        return;
      case "space":
      case "comment":
        if (it.value)
          seq2.items.push({ start: [this.sourceToken] });
        else {
          if (this.atIndentedComment(it.start, seq2.indent)) {
            const prev = seq2.items[seq2.items.length - 2];
            const end = (_a = prev == null ? void 0 : prev.value) == null ? void 0 : _a.end;
            if (Array.isArray(end)) {
              arrayPushArray(end, it.start);
              end.push(this.sourceToken);
              seq2.items.pop();
              return;
            }
          }
          it.start.push(this.sourceToken);
        }
        return;
      case "anchor":
      case "tag":
        if (it.value || this.indent <= seq2.indent)
          break;
        it.start.push(this.sourceToken);
        return;
      case "seq-item-ind":
        if (this.indent !== seq2.indent)
          break;
        if (it.value || includesToken(it.start, "seq-item-ind"))
          seq2.items.push({ start: [this.sourceToken] });
        else
          it.start.push(this.sourceToken);
        return;
    }
    if (this.indent > seq2.indent) {
      const bv = this.startBlockValue(seq2);
      if (bv) {
        this.stack.push(bv);
        return;
      }
    }
    yield* this.pop();
    yield* this.step();
  }
  *flowCollection(fc) {
    const it = fc.items[fc.items.length - 1];
    if (this.type === "flow-error-end") {
      let top;
      do {
        yield* this.pop();
        top = this.peek(1);
      } while ((top == null ? void 0 : top.type) === "flow-collection");
    } else if (fc.end.length === 0) {
      switch (this.type) {
        case "comma":
        case "explicit-key-ind":
          if (!it || it.sep)
            fc.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
        case "map-value-ind":
          if (!it || it.value)
            fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
          else if (it.sep)
            it.sep.push(this.sourceToken);
          else
            Object.assign(it, { key: null, sep: [this.sourceToken] });
          return;
        case "space":
        case "comment":
        case "newline":
        case "anchor":
        case "tag":
          if (!it || it.value)
            fc.items.push({ start: [this.sourceToken] });
          else if (it.sep)
            it.sep.push(this.sourceToken);
          else
            it.start.push(this.sourceToken);
          return;
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar": {
          const fs = this.flowScalar(this.type);
          if (!it || it.value)
            fc.items.push({ start: [], key: fs, sep: [] });
          else if (it.sep)
            this.stack.push(fs);
          else
            Object.assign(it, { key: fs, sep: [] });
          return;
        }
        case "flow-map-end":
        case "flow-seq-end":
          fc.end.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(fc);
      if (bv)
        this.stack.push(bv);
      else {
        yield* this.pop();
        yield* this.step();
      }
    } else {
      const parent = this.peek(2);
      if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
        yield* this.pop();
        yield* this.step();
      } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
        const prev = getPrevProps(parent);
        const start = getFirstKeyStartProps(prev);
        fixFlowSeqItems(fc);
        const sep = fc.end.splice(1, fc.end.length);
        sep.push(this.sourceToken);
        const map2 = {
          type: "block-map",
          offset: fc.offset,
          indent: fc.indent,
          items: [{ start, key: fc, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map2;
      } else {
        yield* this.lineEnd(fc);
      }
    }
  }
  flowScalar(type) {
    if (this.onNewLine) {
      let nl = this.source.indexOf("\n") + 1;
      while (nl !== 0) {
        this.onNewLine(this.offset + nl);
        nl = this.source.indexOf("\n", nl) + 1;
      }
    }
    return {
      type,
      offset: this.offset,
      indent: this.indent,
      source: this.source
    };
  }
  startBlockValue(parent) {
    switch (this.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
        return this.flowScalar(this.type);
      case "block-scalar-header":
        return {
          type: "block-scalar",
          offset: this.offset,
          indent: this.indent,
          props: [this.sourceToken],
          source: ""
        };
      case "flow-map-start":
      case "flow-seq-start":
        return {
          type: "flow-collection",
          offset: this.offset,
          indent: this.indent,
          start: this.sourceToken,
          items: [],
          end: []
        };
      case "seq-item-ind":
        return {
          type: "block-seq",
          offset: this.offset,
          indent: this.indent,
          items: [{ start: [this.sourceToken] }]
        };
      case "explicit-key-ind": {
        this.onKeyLine = true;
        const prev = getPrevProps(parent);
        const start = getFirstKeyStartProps(prev);
        start.push(this.sourceToken);
        return {
          type: "block-map",
          offset: this.offset,
          indent: this.indent,
          items: [{ start, explicitKey: true }]
        };
      }
      case "map-value-ind": {
        this.onKeyLine = true;
        const prev = getPrevProps(parent);
        const start = getFirstKeyStartProps(prev);
        return {
          type: "block-map",
          offset: this.offset,
          indent: this.indent,
          items: [{ start, key: null, sep: [this.sourceToken] }]
        };
      }
    }
    return null;
  }
  atIndentedComment(start, indent) {
    if (this.type !== "comment")
      return false;
    if (this.indent <= indent)
      return false;
    return start.every((st) => st.type === "newline" || st.type === "space");
  }
  *documentEnd(docEnd) {
    if (this.type !== "doc-mode") {
      if (docEnd.end)
        docEnd.end.push(this.sourceToken);
      else
        docEnd.end = [this.sourceToken];
      if (this.type === "newline")
        yield* this.pop();
    }
  }
  *lineEnd(token) {
    switch (this.type) {
      case "comma":
      case "doc-start":
      case "doc-end":
      case "flow-seq-end":
      case "flow-map-end":
      case "map-value-ind":
        yield* this.pop();
        yield* this.step();
        break;
      case "newline":
        this.onKeyLine = false;
      // fallthrough
      case "space":
      case "comment":
      default:
        if (token.end)
          token.end.push(this.sourceToken);
        else
          token.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
    }
  }
};

// node_modules/yaml/browser/dist/public-api.js
function parseOptions(options) {
  const prettyErrors = options.prettyErrors !== false;
  const lineCounter = options.lineCounter || prettyErrors && new LineCounter() || null;
  return { lineCounter, prettyErrors };
}
function parseAllDocuments(source, options = {}) {
  const { lineCounter, prettyErrors } = parseOptions(options);
  const parser = new Parser(lineCounter == null ? void 0 : lineCounter.addNewLine);
  const composer = new Composer(options);
  const docs = Array.from(composer.compose(parser.parse(source)));
  if (prettyErrors && lineCounter)
    for (const doc of docs) {
      doc.errors.forEach(prettifyError(source, lineCounter));
      doc.warnings.forEach(prettifyError(source, lineCounter));
    }
  if (docs.length > 0)
    return docs;
  return Object.assign([], { empty: true }, composer.streamInfo());
}
function parseDocument(source, options = {}) {
  const { lineCounter, prettyErrors } = parseOptions(options);
  const parser = new Parser(lineCounter == null ? void 0 : lineCounter.addNewLine);
  const composer = new Composer(options);
  let doc = null;
  for (const _doc of composer.compose(parser.parse(source), true, source.length)) {
    if (!doc)
      doc = _doc;
    else if (doc.options.logLevel !== "silent") {
      doc.errors.push(new YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
      break;
    }
  }
  if (prettyErrors && lineCounter) {
    doc.errors.forEach(prettifyError(source, lineCounter));
    doc.warnings.forEach(prettifyError(source, lineCounter));
  }
  return doc;
}
function parse(src, reviver, options) {
  let _reviver = void 0;
  if (typeof reviver === "function") {
    _reviver = reviver;
  } else if (options === void 0 && reviver && typeof reviver === "object") {
    options = reviver;
  }
  const doc = parseDocument(src, options);
  if (!doc)
    return null;
  doc.warnings.forEach((warning) => warn(doc.options.logLevel, warning));
  if (doc.errors.length > 0) {
    if (doc.options.logLevel !== "silent")
      throw doc.errors[0];
    else
      doc.errors = [];
  }
  return doc.toJS(Object.assign({ reviver: _reviver }, options));
}
function stringify3(value, replacer, options) {
  var _a;
  let _replacer = null;
  if (typeof replacer === "function" || Array.isArray(replacer)) {
    _replacer = replacer;
  } else if (options === void 0 && replacer) {
    options = replacer;
  }
  if (typeof options === "string")
    options = options.length;
  if (typeof options === "number") {
    const indent = Math.round(options);
    options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
  }
  if (value === void 0) {
    const { keepUndefined } = (_a = options != null ? options : replacer) != null ? _a : {};
    if (!keepUndefined)
      return void 0;
  }
  if (isDocument(value) && !_replacer)
    return value.toString(options);
  return new Document(value, _replacer, options).toString(options);
}

// node_modules/yaml/browser/index.js
var browser_default = dist_exports;

// src/lib/linksFrontmatter.ts
var FRONTMATTER_RE3 = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
function normalizeLinkItem(raw) {
  return {
    url: String(raw.url || raw.link || ""),
    avatar: String(raw.avatar || ""),
    name: String(raw.name || ""),
    blog: raw.blog ? String(raw.blog) : void 0,
    desc: raw.desc ? String(raw.desc) : raw.descr ? String(raw.descr) : void 0,
    color: raw.color ? String(raw.color) : void 0,
    siteshot: raw.siteshot ? String(raw.siteshot) : void 0
  };
}
function normalizeLinkGroup(raw) {
  const linksRaw = Array.isArray(raw.links) ? raw.links : [];
  return {
    name: raw.name ? String(raw.name) : "",
    desc: raw.desc ? String(raw.desc) : "",
    links: linksRaw.filter((item) => item && typeof item === "object").map((item) => normalizeLinkItem(item)).filter((link) => link.url && link.avatar && link.name)
  };
}
function extractLinkGroups(frontmatter) {
  if (Array.isArray(frontmatter.linkGroups) && frontmatter.linkGroups.length > 0)
    return frontmatter.linkGroups;
  if (Array.isArray(frontmatter.links) && frontmatter.links.length > 0) {
    return [{
      name: "",
      desc: "",
      links: frontmatter.links
    }];
  }
  return [];
}
function splitLinksMarkdown(source) {
  const match = source.match(FRONTMATTER_RE3);
  if (!match) {
    return {
      frontmatter: {},
      content: source
    };
  }
  const parsed = browser_default.parse(match[1]);
  const frontmatter = parsed && typeof parsed === "object" ? parsed : {};
  if (Array.isArray(frontmatter.linkGroups)) {
    frontmatter.linkGroups = frontmatter.linkGroups.map(
      (group) => normalizeLinkGroup(group)
    );
  }
  return {
    frontmatter,
    content: match[2]
  };
}
function serializeLinkItem(link) {
  const item = {
    url: link.url.trim(),
    avatar: link.avatar.trim(),
    name: link.name.trim()
  };
  const blog = (link.blog || "").trim();
  if (blog && blog !== item.name)
    item.blog = blog;
  const desc = (link.desc || link.descr || "").trim();
  if (desc)
    item.desc = desc;
  const color = (link.color || "").trim();
  if (color)
    item.color = color;
  const siteshot = (link.siteshot || "").trim();
  if (siteshot)
    item.siteshot = siteshot;
  return item;
}
function serializeLinksFrontmatter(frontmatter, content = "") {
  var _a, _b;
  const payload = {
    layout: "links",
    title: frontmatter.title || "\u53CB\u94FE",
    icon: frontmatter.icon || "i-ri-links-line"
  };
  if ((_a = frontmatter.cover) == null ? void 0 : _a.trim())
    payload.cover = frontmatter.cover.trim();
  if (frontmatter.comment === true)
    payload.comment = true;
  if (frontmatter.random === true)
    payload.random = true;
  if ((_b = frontmatter.errorImg) == null ? void 0 : _b.trim())
    payload.errorImg = frontmatter.errorImg.trim();
  const groups = extractLinkGroups(frontmatter);
  payload.linkGroups = groups.map((group) => {
    var _a2, _b2;
    const entry = {};
    if ((_a2 = group.name) == null ? void 0 : _a2.trim())
      entry.name = group.name.trim();
    if ((_b2 = group.desc) == null ? void 0 : _b2.trim())
      entry.desc = group.desc.trim();
    entry.links = (group.links || []).map((link) => {
      var _a3, _b3, _c;
      return {
        url: link.url.trim(),
        avatar: link.avatar.trim(),
        name: link.name.trim(),
        blog: ((_a3 = link.blog) == null ? void 0 : _a3.trim()) || void 0,
        desc: (link.desc || link.descr || "").trim() || void 0,
        color: ((_b3 = link.color) == null ? void 0 : _b3.trim()) || void 0,
        siteshot: ((_c = link.siteshot) == null ? void 0 : _c.trim()) || void 0
      };
    }).filter((link) => link.url && link.avatar && link.name).map(serializeLinkItem);
    return entry;
  }).filter((group) => Array.isArray(group.links) && group.links.length > 0);
  const yaml = browser_default.stringify(payload, {
    lineWidth: 0,
    defaultKeyType: "PLAIN",
    defaultStringType: "QUOTE_DOUBLE"
  }).trimEnd();
  return `---
${yaml}
---
${content}`;
}
function cloneLinkGroups(groups) {
  return groups.map((group) => ({
    name: group.name || "",
    desc: group.desc || "",
    links: (group.links || []).map((link) => ({ ...link }))
  }));
}
function createEmptyLink() {
  return {
    url: "",
    avatar: "",
    name: "",
    blog: "",
    desc: "",
    color: "#0078e7",
    siteshot: ""
  };
}
function createEmptyGroup() {
  return {
    name: "\u65B0\u5206\u7EC4",
    desc: "",
    links: []
  };
}
function readLinksPageSettings(frontmatter, source) {
  const parsed = source ? splitLinksMarkdown(source).frontmatter : {};
  const merged = { ...parsed, ...frontmatter || {} };
  return {
    title: String(merged.title || "\u6765\u52A0\u5165\u6211\u4EEC\u53ED"),
    cover: String(merged.cover || ""),
    icon: String(merged.icon || "i-ri-links-line"),
    comment: merged.comment !== false,
    random: merged.random === true,
    errorImg: String(merged.errorImg || "")
  };
}
function buildLinksSource(page, groups, existingSource = "") {
  const content = existingSource ? splitLinksMarkdown(existingSource).content : "";
  return serializeLinksFrontmatter({
    layout: "links",
    title: page.title.trim(),
    icon: page.icon.trim() || "i-ri-links-line",
    cover: page.cover.trim() || void 0,
    comment: page.comment,
    random: page.random || void 0,
    errorImg: page.errorImg.trim() || void 0,
    linkGroups: groups
  }, content);
}
function normalizeLinkDraft(link) {
  var _a, _b, _c, _d;
  return {
    url: link.url.trim(),
    avatar: link.avatar.trim(),
    name: link.name.trim(),
    blog: ((_a = link.blog) == null ? void 0 : _a.trim()) || void 0,
    desc: ((_b = link.desc) == null ? void 0 : _b.trim()) || void 0,
    color: ((_c = link.color) == null ? void 0 : _c.trim()) || void 0,
    siteshot: ((_d = link.siteshot) == null ? void 0 : _d.trim()) || void 0
  };
}

// src/modals/LinksEditorModals.ts
function showError(container, message) {
  var _a;
  (_a = container.querySelector(".vax-error")) == null ? void 0 : _a.remove();
  container.createDiv({ text: message, cls: "vax-error" });
}
var LinkItemEditorModal = class extends import_obsidian9.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    const source = options.initial || createEmptyLink();
    this.draft = {
      url: source.url || "",
      avatar: source.avatar || "",
      name: source.name || "",
      blog: source.blog || "",
      desc: source.desc || source.descr || "",
      color: source.color || "#0078e7",
      siteshot: source.siteshot || ""
    };
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText(this.options.title);
    const form = contentEl.createDiv({ cls: "vax-links-form" });
    new import_obsidian9.Setting(form).setName("\u7AD9\u70B9 URL *").addText((t) => t.setPlaceholder("https://example.com").setValue(this.draft.url).onChange((v) => {
      this.draft.url = v;
    }));
    new import_obsidian9.Setting(form).setName("\u5934\u50CF URL *").addText((t) => t.setPlaceholder("https://...").setValue(this.draft.avatar).onChange((v) => {
      this.draft.avatar = v;
    }));
    new import_obsidian9.Setting(form).setName("\u540D\u79F0 *").addText((t) => t.setPlaceholder("\u7AD9\u70B9\u540D\u79F0").setValue(this.draft.name).onChange((v) => {
      this.draft.name = v;
    }));
    new import_obsidian9.Setting(form).setName("\u663E\u793A\u540D\u79F0").setDesc("\u9ED8\u8BA4\u540C\u540D\u79F0").addText((t) => t.setPlaceholder("\u9ED8\u8BA4\u540C\u540D\u79F0").setValue(this.draft.blog || "").onChange((v) => {
      this.draft.blog = v;
    }));
    new import_obsidian9.Setting(form).setName("\u63CF\u8FF0").addText((t) => t.setPlaceholder("\u4E00\u53E5\u8BDD\u4ECB\u7ECD").setValue(this.draft.desc || "").onChange((v) => {
      this.draft.desc = v;
    }));
    new import_obsidian9.Setting(form).setName("\u4E3B\u9898\u8272").addText((t) => t.setPlaceholder("#0078e7").setValue(this.draft.color || "").onChange((v) => {
      this.draft.color = v;
    }));
    new import_obsidian9.Setting(form).setName("\u7AD9\u70B9\u622A\u56FE URL").setDesc("\u7559\u7A7A\u5219\u81EA\u52A8\u751F\u6210\u9884\u89C8\u56FE").addText((t) => t.setPlaceholder("https://...").setValue(this.draft.siteshot || "").onChange((v) => {
      this.draft.siteshot = v;
    }));
    const actions = [];
    if (!this.options.isNew && this.options.onDelete) {
      actions.push({
        label: "\u5220\u9664",
        warning: true,
        onClick: async () => {
          const deleted = await this.options.onDelete();
          if (deleted !== false)
            this.close();
        }
      });
    }
    actions.push(
      {
        label: "\u53D6\u6D88",
        onClick: () => this.close()
      },
      {
        label: "\u786E\u5B9A",
        cta: true,
        onClick: async () => {
          if (!this.draft.url.trim() || !this.draft.avatar.trim() || !this.draft.name.trim()) {
            showError(contentEl, "\u8BF7\u586B\u5199 URL\u3001\u5934\u50CF\u548C\u540D\u79F0");
            return;
          }
          try {
            await this.options.onSave(normalizeLinkDraft(this.draft));
            this.close();
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            showError(contentEl, msg);
          }
        }
      }
    );
    appendModalActions(contentEl, actions);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var LinkGroupEditorModal = class extends import_obsidian9.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.name = options.initial.name || "";
    this.desc = options.initial.desc || "";
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText("\u7F16\u8F91\u5206\u7EC4");
    const form = contentEl.createDiv({ cls: "vax-links-form" });
    new import_obsidian9.Setting(form).setName("\u5206\u7EC4\u540D\u79F0 *").addText((t) => t.setPlaceholder("\u4F8B\u5982\uFF1A\u7D27\u5BC6\u76F8\u8FDE").setValue(this.name).onChange((v) => {
      this.name = v;
    }));
    new import_obsidian9.Setting(form).setName("\u5206\u7EC4\u63CF\u8FF0").addText((t) => t.setPlaceholder("\u53EF\u9009\u63CF\u8FF0").setValue(this.desc).onChange((v) => {
      this.desc = v;
    }));
    const moveRow = form.createDiv({ cls: "vax-links-form__move" });
    if (!this.options.isNew && this.options.onMove) {
      const moveUp = moveRow.createEl("button", { text: "\u4E0A\u79FB\u5206\u7EC4", cls: "vax-links-form__move-btn" });
      moveUp.disabled = this.options.groupIndex <= 0;
      moveUp.onclick = async () => {
        await this.options.onMove(-1);
        this.close();
      };
      const moveDown = moveRow.createEl("button", { text: "\u4E0B\u79FB\u5206\u7EC4", cls: "vax-links-form__move-btn" });
      moveDown.disabled = this.options.groupIndex >= this.options.groupCount - 1;
      moveDown.onclick = async () => {
        await this.options.onMove(1);
        this.close();
      };
    }
    const actions = [];
    if (!this.options.isNew && this.options.onDelete) {
      actions.push({
        label: "\u5220\u9664\u5206\u7EC4",
        warning: true,
        onClick: async () => {
          const deleted = await this.options.onDelete();
          if (deleted !== false)
            this.close();
        }
      });
    }
    actions.push(
      {
        label: "\u53D6\u6D88",
        onClick: () => this.close()
      },
      {
        label: "\u786E\u5B9A",
        cta: true,
        onClick: async () => {
          if (!this.name.trim()) {
            showError(contentEl, "\u8BF7\u586B\u5199\u5206\u7EC4\u540D\u79F0");
            return;
          }
          try {
            await this.options.onSave({
              name: this.name.trim(),
              desc: this.desc.trim(),
              links: this.options.initial.links || []
            });
            this.close();
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            showError(contentEl, msg);
          }
        }
      }
    );
    appendModalActions(contentEl, actions);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var LinksPageSettingsModal = class extends import_obsidian9.Modal {
  constructor(app, initial, onSave) {
    super(app);
    this.onSave = onSave;
    this.page = { ...initial };
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText("\u9875\u9762\u8BBE\u7F6E");
    const form = contentEl.createDiv({ cls: "vax-links-form" });
    new import_obsidian9.Setting(form).setName("\u9875\u9762\u6807\u9898").addText((t) => t.setPlaceholder("\u6765\u52A0\u5165\u6211\u4EEC\u53ED").setValue(this.page.title).onChange((v) => {
      this.page.title = v;
    }));
    new import_obsidian9.Setting(form).setName("\u5934\u56FE URL").addText((t) => t.setPlaceholder("https://...").setValue(this.page.cover).onChange((v) => {
      this.page.cover = v;
    }));
    new import_obsidian9.Setting(form).setName("\u56FE\u6807 class").addText((t) => t.setPlaceholder("i-ri-links-line").setValue(this.page.icon).onChange((v) => {
      this.page.icon = v;
    }));
    new import_obsidian9.Setting(form).setName("\u622A\u56FE\u5931\u8D25\u5360\u4F4D\u56FE").addText((t) => t.setPlaceholder("\u53EF\u9009").setValue(this.page.errorImg).onChange((v) => {
      this.page.errorImg = v;
    }));
    new import_obsidian9.Setting(form).setName("\u5F00\u542F\u8BC4\u8BBA").addToggle((t) => t.setValue(this.page.comment).onChange((v) => {
      this.page.comment = v;
    }));
    new import_obsidian9.Setting(form).setName("\u968F\u673A\u6392\u5E8F\u53CB\u94FE").addToggle((t) => t.setValue(this.page.random).onChange((v) => {
      this.page.random = v;
    }));
    appendModalActions(contentEl, [
      {
        label: "\u53D6\u6D88",
        onClick: () => this.close()
      },
      {
        label: "\u4FDD\u5B58\u5E76\u5173\u95ED",
        cta: true,
        onClick: async () => {
          if (!this.page.title.trim()) {
            showError(contentEl, "\u8BF7\u586B\u5199\u9875\u9762\u6807\u9898");
            return;
          }
          try {
            await this.onSave({ ...this.page, title: this.page.title.trim() });
            this.close();
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            showError(contentEl, msg);
          }
        }
      }
    ]);
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/modals/GalleryEditorModals.ts
var import_obsidian10 = require("obsidian");

// src/lib/galleryFrontmatter.ts
var FRONTMATTER_RE4 = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
var GALLERY_SLUG_RE = /^[a-z0-9][a-z0-9-]*$/i;
function isValidGallerySlug(slug) {
  return GALLERY_SLUG_RE.test(slug);
}
function normalizePhoto(raw) {
  const type = raw.type === "video" || raw.type === "image" ? raw.type : void 0;
  return {
    url: String(raw.url || ""),
    date: raw.date ? String(raw.date) : void 0,
    type,
    poster: raw.poster ? String(raw.poster) : void 0
  };
}
function splitGalleryMarkdown(source) {
  const match = source.match(FRONTMATTER_RE4);
  if (!match) {
    return {
      frontmatter: {},
      content: source
    };
  }
  const parsed = browser_default.parse(match[1]);
  return {
    frontmatter: parsed && typeof parsed === "object" ? parsed : {},
    content: match[2]
  };
}
function normalizeAlbumSlugs(value) {
  if (!Array.isArray(value))
    return [];
  return value.map((item) => {
    if (typeof item === "string")
      return item.trim();
    if (item && typeof item === "object" && "slug" in item)
      return String(item.slug || "").trim();
    return "";
  }).filter(Boolean);
}
function normalizeAlbumFrontmatter(raw) {
  const source = raw.source === "webdav" ? "webdav" : "local";
  const photosRaw = Array.isArray(raw.photos) ? raw.photos : [];
  const photos = source === "local" ? photosRaw.filter((item) => item && typeof item === "object").map((item) => normalizePhoto(item)).filter((photo) => photo.url) : void 0;
  let webdav;
  if (source === "webdav" && raw.webdav && typeof raw.webdav === "object") {
    const block = raw.webdav;
    const url = String(block.url || "").trim();
    if (url) {
      webdav = {
        url,
        username: block.username ? String(block.username) : void 0
      };
    }
  }
  return {
    title: raw.title ? String(raw.title) : void 0,
    cover: raw.cover ? String(raw.cover) : void 0,
    desc: raw.desc ? String(raw.desc) : void 0,
    date: raw.date ? String(raw.date) : void 0,
    location: raw.location ? String(raw.location) : void 0,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : void 0,
    comment: raw.comment === true ? true : void 0,
    encrypted: raw.encrypted === true,
    password: raw.password ? String(raw.password) : void 0,
    source,
    webdav,
    photos
  };
}
function buildAlbumPayload(frontmatter) {
  var _a, _b, _c, _d, _e, _f, _g;
  const payload = {
    layout: "gallery-album",
    title: frontmatter.title || "",
    source: frontmatter.source || "local"
  };
  if ((_a = frontmatter.date) == null ? void 0 : _a.trim())
    payload.date = frontmatter.date.trim();
  if ((_b = frontmatter.cover) == null ? void 0 : _b.trim())
    payload.cover = frontmatter.cover.trim();
  if ((_c = frontmatter.desc) == null ? void 0 : _c.trim())
    payload.desc = frontmatter.desc.trim();
  if ((_d = frontmatter.location) == null ? void 0 : _d.trim())
    payload.location = frontmatter.location.trim();
  if (Array.isArray(frontmatter.tags) && frontmatter.tags.length)
    payload.tags = frontmatter.tags.map(String);
  if (frontmatter.comment === true)
    payload.comment = true;
  if (frontmatter.encrypted === true) {
    payload.encrypted = true;
    if ((_e = frontmatter.password) == null ? void 0 : _e.trim())
      payload.password = frontmatter.password.trim();
  } else {
    payload.encrypted = false;
  }
  if (frontmatter.source === "webdav" && ((_f = frontmatter.webdav) == null ? void 0 : _f.url)) {
    payload.webdav = {
      url: frontmatter.webdav.url.trim(),
      ...((_g = frontmatter.webdav.username) == null ? void 0 : _g.trim()) ? { username: frontmatter.webdav.username.trim() } : {}
    };
  } else if (frontmatter.source !== "webdav") {
    payload.photos = Array.isArray(frontmatter.photos) ? frontmatter.photos.map((photo) => {
      var _a2, _b2;
      const item = { url: photo.url.trim() };
      if ((_a2 = photo.date) == null ? void 0 : _a2.trim())
        item.date = photo.date.trim();
      if (photo.type)
        item.type = photo.type;
      if ((_b2 = photo.poster) == null ? void 0 : _b2.trim())
        item.poster = photo.poster.trim();
      return item;
    }) : [];
  }
  return payload;
}
function serializeHubMarkdown(frontmatter, content = "") {
  var _a;
  const payload = {
    layout: "gallery",
    title: frontmatter.title || "\u76F8\u518C",
    icon: frontmatter.icon || "i-ri-gallery-line"
  };
  if ((_a = frontmatter.cover) == null ? void 0 : _a.trim())
    payload.cover = frontmatter.cover.trim();
  if (frontmatter.comment === true)
    payload.comment = true;
  const slugs = normalizeAlbumSlugs(frontmatter.albums);
  if (slugs.length)
    payload.albums = slugs;
  const yaml = browser_default.stringify(payload, {
    lineWidth: 0,
    defaultKeyType: "PLAIN",
    defaultStringType: "QUOTE_DOUBLE"
  }).trimEnd();
  return `---
${yaml}
---
${content}`;
}
function serializeAlbumMarkdown(frontmatter, content = "") {
  const payload = buildAlbumPayload(frontmatter);
  const yaml = browser_default.stringify(payload, {
    lineWidth: 0,
    defaultKeyType: "PLAIN",
    defaultStringType: "QUOTE_DOUBLE"
  }).trimEnd();
  return `---
${yaml}
---
${content}`;
}
function parseAlbumSource(source) {
  const { frontmatter, content } = splitGalleryMarkdown(source);
  return {
    frontmatter: normalizeAlbumFrontmatter(frontmatter),
    content
  };
}
function readGalleryPageSettings(frontmatter, source) {
  const parsed = source ? splitGalleryMarkdown(source).frontmatter : {};
  const merged = { ...parsed, ...frontmatter || {} };
  return {
    title: String(merged.title || "\u76F8\u518C"),
    cover: String(merged.cover || ""),
    icon: String(merged.icon || "i-ri-gallery-line"),
    comment: merged.comment === true
  };
}
function buildHubSource(page, albumSlugs, existingSource = "") {
  const content = existingSource ? splitGalleryMarkdown(existingSource).content : "";
  return serializeHubMarkdown({
    layout: "gallery",
    title: page.title.trim() || "\u76F8\u518C",
    icon: page.icon.trim() || "i-ri-gallery-line",
    cover: page.cover.trim() || void 0,
    comment: page.comment ? true : void 0,
    albums: albumSlugs
  }, content);
}
function createEmptyAlbumDraft() {
  return {
    slug: "",
    title: "",
    date: "",
    cover: "",
    desc: "",
    location: "",
    tags: "",
    comment: false,
    encrypted: false,
    password: "",
    source: "local",
    webdavUrl: "",
    webdavUsername: ""
  };
}
function albumDraftFromFrontmatter(slug, fm) {
  var _a, _b;
  return {
    slug,
    title: fm.title || slug,
    date: fm.date || "",
    cover: fm.cover || "",
    desc: fm.desc || "",
    location: fm.location || "",
    tags: Array.isArray(fm.tags) ? fm.tags.join(", ") : "",
    comment: fm.comment === true,
    encrypted: !!fm.encrypted,
    password: fm.password || "",
    source: fm.source === "webdav" ? "webdav" : "local",
    webdavUrl: ((_a = fm.webdav) == null ? void 0 : _a.url) || "",
    webdavUsername: ((_b = fm.webdav) == null ? void 0 : _b.username) || ""
  };
}
function buildAlbumFrontmatterFromDraft(draft, photos = []) {
  const tags = draft.tags.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
  const frontmatter = {
    title: draft.title.trim() || draft.slug.trim(),
    date: draft.date.trim() || void 0,
    cover: draft.cover.trim() || void 0,
    desc: draft.desc.trim() || void 0,
    location: draft.location.trim() || void 0,
    tags: tags.length ? tags : void 0,
    comment: draft.comment ? true : void 0,
    encrypted: draft.encrypted,
    password: draft.encrypted ? draft.password.trim() || void 0 : void 0,
    source: draft.source,
    photos: draft.source === "local" ? photos.length ? [...photos] : [] : void 0
  };
  if (draft.source === "webdav") {
    frontmatter.webdav = {
      url: draft.webdavUrl.trim(),
      username: draft.webdavUsername.trim() || void 0
    };
  }
  return frontmatter;
}
function buildAlbumSourceWithPhotos(frontmatter, photos, existingSource = "") {
  const content = existingSource ? splitGalleryMarkdown(existingSource).content : "";
  return serializeAlbumMarkdown({ ...frontmatter, photos }, content);
}
function cloneAlbumSummaries(albums) {
  return albums.map((album) => ({ ...album }));
}

// src/modals/GalleryEditorModals.ts
function showError2(container, message) {
  var _a;
  (_a = container.querySelector(".vax-error")) == null ? void 0 : _a.remove();
  container.createDiv({ text: message, cls: "vax-error" });
}
var AddPhotoModal = class extends import_obsidian10.Modal {
  constructor(app, onAdd) {
    super(app);
    this.onAdd = onAdd;
    this.url = "";
    this.date = "";
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText("\u65B0\u589E\u7167\u7247");
    const form = contentEl.createDiv({ cls: "vax-links-form" });
    new import_obsidian10.Setting(form).setName("\u56FE\u7247\u6216\u89C6\u9891\u94FE\u63A5 *").addText((t) => t.setPlaceholder("https://...").onChange((v) => {
      this.url = v;
    }));
    new import_obsidian10.Setting(form).setName("\u65E5\u671F").setDesc("\u4F8B\u5982 2026-6-1").addText((t) => t.setPlaceholder("2026-6-1").onChange((v) => {
      this.date = v;
    }));
    appendModalActions(contentEl, [
      {
        label: "\u53D6\u6D88",
        onClick: () => this.close()
      },
      {
        label: "\u6DFB\u52A0",
        cta: true,
        onClick: async () => {
          if (!this.url.trim()) {
            showError2(contentEl, "\u8BF7\u586B\u5199\u56FE\u7247\u6216\u89C6\u9891\u94FE\u63A5");
            return;
          }
          try {
            await this.onAdd({
              url: this.url.trim(),
              date: this.date.trim() || void 0
            });
            this.close();
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            showError2(contentEl, msg);
          }
        }
      }
    ]);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var GalleryPageSettingsModal = class extends import_obsidian10.Modal {
  constructor(app, initial, onSave) {
    super(app);
    this.onSave = onSave;
    this.page = { ...initial };
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText("\u9875\u9762\u8BBE\u7F6E");
    const form = contentEl.createDiv({ cls: "vax-links-form" });
    new import_obsidian10.Setting(form).setName("\u9875\u9762\u6807\u9898").addText((t) => t.setPlaceholder("\u76F8\u518C").setValue(this.page.title).onChange((v) => {
      this.page.title = v;
    }));
    new import_obsidian10.Setting(form).setName("\u5934\u56FE URL").addText((t) => t.setPlaceholder("https://...").setValue(this.page.cover).onChange((v) => {
      this.page.cover = v;
    }));
    new import_obsidian10.Setting(form).setName("\u56FE\u6807 class").addText((t) => t.setPlaceholder("i-ri-gallery-line").setValue(this.page.icon).onChange((v) => {
      this.page.icon = v;
    }));
    new import_obsidian10.Setting(form).setName("\u5F00\u542F\u8BC4\u8BBA").addToggle((t) => t.setValue(this.page.comment).onChange((v) => {
      this.page.comment = v;
    }));
    appendModalActions(contentEl, [
      {
        label: "\u53D6\u6D88",
        onClick: () => this.close()
      },
      {
        label: "\u4FDD\u5B58\u5E76\u5173\u95ED",
        cta: true,
        onClick: async () => {
          if (!this.page.title.trim()) {
            showError2(contentEl, "\u8BF7\u586B\u5199\u9875\u9762\u6807\u9898");
            return;
          }
          try {
            await this.onSave({ ...this.page, title: this.page.title.trim() });
            this.close();
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            showError2(contentEl, msg);
          }
        }
      }
    ]);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var AlbumEditorModal = class extends import_obsidian10.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    const base = options.initial || createEmptyAlbumDraft();
    this.draft = { ...base };
  }
  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText(this.options.isNew ? "\u65B0\u5EFA\u76F8\u518C" : "\u7F16\u8F91\u76F8\u518C");
    const form = contentEl.createDiv({ cls: "vax-links-form" });
    new import_obsidian10.Setting(form).setName("slug *").setDesc(this.options.isNew ? "\u4F8B\u5982\uFF1Abizhi" : "\u521B\u5EFA\u540E\u4E0D\u53EF\u4FEE\u6539").addText((t) => t.setPlaceholder("bizhi").setValue(this.draft.slug).setDisabled(!this.options.isNew).onChange((v) => {
      this.draft.slug = v;
    }));
    new import_obsidian10.Setting(form).setName("\u6807\u9898 *").addText((t) => t.setPlaceholder("\u76F8\u518C\u6807\u9898").setValue(this.draft.title).onChange((v) => {
      this.draft.title = v;
    }));
    new import_obsidian10.Setting(form).setName("\u65E5\u671F").addText((t) => t.setPlaceholder("2025-08-18").setValue(this.draft.date).onChange((v) => {
      this.draft.date = v;
    }));
    new import_obsidian10.Setting(form).setName("\u5C01\u9762 URL").addText((t) => t.setPlaceholder("https://...").setValue(this.draft.cover).onChange((v) => {
      this.draft.cover = v;
    }));
    new import_obsidian10.Setting(form).setName("\u63CF\u8FF0").addText((t) => t.setPlaceholder("\u76F8\u518C\u7B80\u4ECB").setValue(this.draft.desc).onChange((v) => {
      this.draft.desc = v;
    }));
    new import_obsidian10.Setting(form).setName("\u5730\u70B9").addText((t) => t.setPlaceholder("\u91CD\u5E86").setValue(this.draft.location).onChange((v) => {
      this.draft.location = v;
    }));
    new import_obsidian10.Setting(form).setName("\u6807\u7B7E").setDesc("\u591A\u4E2A\u6807\u7B7E\u7528\u9017\u53F7\u5206\u9694").addText((t) => t.setPlaceholder("\u58C1\u7EB8, \u4E91\u7AEF").setValue(this.draft.tags).onChange((v) => {
      this.draft.tags = v;
    }));
    new import_obsidian10.Setting(form).setName("\u6570\u636E\u6765\u6E90").addDropdown((drop) => drop.addOption("local", "\u672C\u5730 URL \u5217\u8868").addOption("webdav", "WebDAV").setValue(this.draft.source).onChange((value) => {
      this.draft.source = value;
      this.syncConditionalFields();
    }));
    new import_obsidian10.Setting(form).setName("\u5F00\u542F\u8BC4\u8BBA").addToggle((t) => t.setValue(this.draft.comment).onChange((v) => {
      this.draft.comment = v;
    }));
    new import_obsidian10.Setting(form).setName("\u52A0\u5BC6\u76F8\u518C").addToggle((t) => t.setValue(this.draft.encrypted).onChange((value) => {
      this.draft.encrypted = value;
      this.syncConditionalFields();
    }));
    this.passwordWrap = form.createDiv({ cls: "vax-gallery-form__section" });
    new import_obsidian10.Setting(this.passwordWrap).setName("\u8BBF\u95EE\u5BC6\u7801").addText((t) => t.setPlaceholder("\u76F8\u518C\u5BC6\u7801").setValue(this.draft.password).onChange((v) => {
      this.draft.password = v;
    }));
    this.webdavWrap = form.createDiv({ cls: "vax-gallery-form__section" });
    new import_obsidian10.Setting(this.webdavWrap).setName("WebDAV \u5730\u5740 *").addText((t) => t.setPlaceholder("https://.../dav/\u76F8\u518C").setValue(this.draft.webdavUrl).onChange((v) => {
      this.draft.webdavUrl = v;
    }));
    new import_obsidian10.Setting(this.webdavWrap).setName("WebDAV \u7528\u6237\u540D").addText((t) => t.setPlaceholder("\u53EF\u9009").setValue(this.draft.webdavUsername).onChange((v) => {
      this.draft.webdavUsername = v;
    }));
    this.webdavWrap.createEl("p", {
      cls: "vax-modal-hint",
      text: "WebDAV \u7167\u7247\u4ECD\u4ECE\u4E91\u7AEF\u8BFB\u53D6\uFF0C\u6B64\u5904\u4EC5\u7F16\u8F91\u5143\u6570\u636E\uFF1B\u5BC6\u7801\u4F7F\u7528\u73AF\u5883\u53D8\u91CF WEBDAV_PASSWORD\u3002"
    });
    this.localHint = form.createEl("p", {
      cls: "vax-modal-hint",
      text: "\u70B9\u51FB\u76F8\u518C\u5361\u7247\u53EF\u7BA1\u7406\u7167\u7247\uFF1B\u6B64\u5904\u7F16\u8F91\u76F8\u518C\u5143\u6570\u636E\u3002"
    });
    this.syncConditionalFields();
    const actions = [];
    if (!this.options.isNew && this.options.onDelete) {
      actions.push({
        label: "\u5220\u9664\u76F8\u518C",
        warning: true,
        onClick: async () => {
          const deleted = await this.options.onDelete();
          if (deleted !== false)
            this.close();
        }
      });
    }
    actions.push(
      {
        label: "\u53D6\u6D88",
        onClick: () => this.close()
      },
      {
        label: "\u786E\u5B9A",
        cta: true,
        onClick: async () => {
          var _a;
          const slug = this.draft.slug.trim();
          if (!slug) {
            showError2(contentEl, "\u8BF7\u586B\u5199\u76F8\u518C slug");
            return;
          }
          if (!isValidGallerySlug(slug)) {
            showError2(contentEl, "slug \u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u548C\u8FDE\u5B57\u7B26\uFF0C\u4E14\u4E0D\u80FD\u4EE5\u8FDE\u5B57\u7B26\u5F00\u5934");
            return;
          }
          if (!this.draft.title.trim()) {
            showError2(contentEl, "\u8BF7\u586B\u5199\u76F8\u518C\u6807\u9898");
            return;
          }
          if (this.draft.source === "webdav" && !this.draft.webdavUrl.trim()) {
            showError2(contentEl, "WebDAV \u76F8\u518C\u8BF7\u586B\u5199 WebDAV \u5730\u5740");
            return;
          }
          if (this.options.isNew && ((_a = this.options.existingSlugs) == null ? void 0 : _a.includes(slug))) {
            showError2(contentEl, "\u8BE5 slug \u5DF2\u5B58\u5728");
            return;
          }
          try {
            const photos = this.options.loadedPhotos || [];
            const frontmatter = buildAlbumFrontmatterFromDraft(this.draft, photos);
            const albumSource = serializeAlbumMarkdown(frontmatter);
            await this.options.onSave({ slug, frontmatter, albumSource });
            this.close();
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            showError2(contentEl, msg);
          }
        }
      }
    );
    appendModalActions(contentEl, actions);
  }
  syncConditionalFields() {
    if (this.passwordWrap)
      this.passwordWrap.toggleClass("is-hidden", !this.draft.encrypted);
    if (this.webdavWrap)
      this.webdavWrap.toggleClass("is-hidden", this.draft.source !== "webdav");
    if (this.localHint)
      this.localHint.toggleClass("is-hidden", this.draft.source !== "local");
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/views/adminBoard.ts
function renderSectionHeader(container, options) {
  const header = container.createDiv({ cls: "vax-admin-section__header" });
  const heading = header.createDiv({ cls: "vax-admin-section__heading" });
  heading.createEl("h1", { text: options.title });
  heading.createEl("p", { text: options.subtitle });
  const actionsEl = header.createDiv({ cls: "vax-admin-section__actions" });
  for (const action of options.actions) {
    const btn = actionsEl.createEl("button", {
      text: action.label,
      cls: action.primary ? "vax-admin-section__btn vax-admin-section__btn--primary" : "vax-admin-section__btn vax-admin-section__btn--ghost"
    });
    btn.onclick = action.onClick;
  }
}
function renderLinksBoard(container, groups, handlers) {
  const board = container.createDiv({ cls: "vax-admin-section__board vax-links-board" });
  if (!groups.length) {
    board.createEl("p", {
      text: "\u6682\u65E0\u53CB\u94FE\u5206\u7EC4\uFF0C\u70B9\u51FB\u9876\u90E8\u300C\u65B0\u589E\u5206\u7EC4\u300D\u5F00\u59CB\u6DFB\u52A0\u3002",
      cls: "vax-links-board__empty"
    });
    return;
  }
  const root = board.createDiv({ cls: "vax-links-preview" });
  groups.forEach((group, groupIndex) => {
    renderLinkGroup(root, group, groupIndex, handlers);
  });
}
function renderLinkGroup(root, group, groupIndex, handlers) {
  const section = root.createDiv({ cls: "vax-links-preview-group" });
  const header = section.createDiv({ cls: "vax-links-preview-group__header" });
  const main = header.createDiv({ cls: "vax-links-preview-group__header-main" });
  main.createEl("h2", {
    text: group.name || "\u672A\u547D\u540D\u5206\u7EC4",
    cls: "vax-links-preview-group__title"
  });
  main.createEl("p", {
    text: group.desc ? `\u5206\u7C7B\u63CF\u8FF0 \u{1F338}\uFF1A${group.desc}` : "\u5206\u7C7B\u63CF\u8FF0 \u{1F338}\uFF1A\u6682\u65E0\u63CF\u8FF0",
    cls: `vax-links-preview-group__desc${group.desc ? "" : " is-placeholder"}`
  });
  const editGroupBtn = header.createEl("button", {
    cls: "vax-links-preview-group__edit",
    attr: { type: "button", "aria-label": "\u7F16\u8F91\u5206\u7EC4", title: "\u7F16\u8F91\u5206\u7EC4" }
  });
  editGroupBtn.setText("\u270E");
  editGroupBtn.onclick = () => handlers.onEditGroup(groupIndex);
  const grid = section.createEl("ul", { cls: "vax-links-preview-grid" });
  (group.links || []).forEach((link, linkIndex) => {
    renderLinkCard(grid, link, groupIndex, linkIndex, handlers.onEditLink);
  });
  const addItem = grid.createEl("li", { cls: "vax-links-preview-item vax-links-preview-item--add" });
  const addBtn = addItem.createDiv({ cls: "vax-links-preview-card vax-links-preview-card--add" });
  addBtn.setAttr("role", "button");
  addBtn.setAttr("tabindex", "0");
  const addShot = addBtn.createDiv({ cls: "vax-links-preview-shot vax-links-preview-shot--add" });
  addShot.createSpan({ text: "+", cls: "vax-links-preview-add-icon" });
  const addMeta = addBtn.createDiv({ cls: "vax-links-preview-meta vax-links-preview-meta--add" });
  addMeta.createSpan({ text: "\u65B0\u5EFA\u53CB\u94FE", cls: "vax-links-preview-add-label" });
  addBtn.onclick = () => handlers.onAddLink(groupIndex);
  addBtn.onkeydown = (event) => {
    if (event.key === "Enter" || event.key === " ")
      handlers.onAddLink(groupIndex);
  };
}
function renderLinkCard(grid, link, groupIndex, linkIndex, onEdit) {
  const item = grid.createEl("li", { cls: "vax-links-preview-item" });
  if (link.color)
    item.style.setProperty("--link-color", link.color);
  const card = item.createDiv({ cls: "vax-links-preview-card vax-links-preview-card--admin" });
  card.setAttr("role", "button");
  card.setAttr("tabindex", "0");
  card.setAttr("title", `\u7F16\u8F91 ${link.name}`);
  card.onclick = () => onEdit(groupIndex, linkIndex);
  card.onkeydown = (event) => {
    if (event.key === "Enter" || event.key === " ")
      onEdit(groupIndex, linkIndex);
  };
  const shot = card.createDiv({ cls: "vax-links-preview-shot" });
  if (link.siteshot) {
    const img = shot.createEl("img", { attr: { alt: `${link.name} \u7AD9\u70B9\u9884\u89C8`, loading: "lazy" } });
    img.src = link.siteshot;
  } else {
    shot.createDiv({ text: "\u65E0\u9884\u89C8\u56FE", cls: "vax-links-preview-shot__placeholder" });
  }
  const meta = card.createDiv({ cls: "vax-links-preview-meta" });
  if (link.avatar) {
    const avatar = meta.createEl("img", {
      cls: "vax-links-preview-avatar",
      attr: { alt: link.name, loading: "lazy" }
    });
    avatar.src = link.avatar;
  }
  const text = meta.createDiv({ cls: "vax-links-preview-text" });
  text.createDiv({ text: link.blog || link.name, cls: "vax-links-preview-name" });
  text.createDiv({ text: link.desc || link.descr || "\u6682\u65E0\u63CF\u8FF0", cls: "vax-links-preview-desc" });
}
function renderGalleryBoard(container, albums, handlers) {
  const board = container.createDiv({ cls: "vax-admin-section__board vax-gallery-board" });
  const grid = board.createDiv({ cls: "vax-album-grid" });
  if (!albums.length) {
    grid.createEl("p", {
      text: "\u6682\u65E0\u76F8\u518C\uFF0C\u70B9\u51FB\u300C\u65B0\u5EFA\u76F8\u518C\u300D\u5F00\u59CB\u521B\u5EFA\u3002",
      cls: "vax-album-grid__empty"
    });
  }
  const list = grid.createEl("ul", { cls: "vax-album-grid__list" });
  const sorted = [...albums].sort((a, b) => {
    const ta = Date.parse(a.date || "") || 0;
    const tb = Date.parse(b.date || "") || 0;
    return tb - ta;
  });
  for (const album of sorted)
    renderAlbumCard(list, album, handlers);
  const addItem = list.createEl("li", { cls: "vax-album-grid__item vax-album-grid__item--add" });
  const addBtn = addItem.createDiv({ cls: "vax-album-grid__card vax-album-grid__card--add" });
  addBtn.setAttr("role", "button");
  addBtn.setAttr("tabindex", "0");
  addBtn.createSpan({ text: "+", cls: "vax-album-grid__add-icon" });
  addBtn.createSpan({ text: "\u65B0\u5EFA\u76F8\u518C", cls: "vax-album-grid__add-label" });
  addBtn.onclick = handlers.onCreateAlbum;
  addBtn.onkeydown = (event) => {
    if (event.key === "Enter" || event.key === " ")
      handlers.onCreateAlbum();
  };
}
function renderAlbumCard(list, album, handlers) {
  var _a;
  const item = list.createEl("li", { cls: "vax-album-grid__item" });
  const card = item.createDiv({ cls: "vax-album-grid__card vax-album-grid__card--admin" });
  card.setAttr("role", "button");
  card.setAttr("tabindex", "0");
  card.onclick = (event) => {
    if (event.target.closest(".vax-album-grid__edit"))
      return;
    handlers.onOpenAlbum(album.slug);
  };
  card.onkeydown = (event) => {
    if (event.key === "Enter" || event.key === " ")
      handlers.onOpenAlbum(album.slug);
  };
  if (album.cover) {
    const cover = card.createEl("img", {
      cls: "vax-album-grid__cover",
      attr: { alt: album.title, loading: "lazy" }
    });
    cover.src = album.cover;
  } else {
    card.createDiv({ text: "\u{1F4F7}", cls: "vax-album-grid__cover vax-album-grid__cover--placeholder" });
  }
  card.createDiv({ cls: "vax-album-grid__shade" });
  if (album.source !== "webdav" && album.count && album.count > 0) {
    card.createSpan({ text: `${album.count} \u5F20\u7167\u7247`, cls: "vax-album-grid__count" });
  }
  if (album.encrypted) {
    card.createSpan({ text: "\u{1F512}", cls: "vax-album-grid__lock", attr: { title: "\u52A0\u5BC6\u76F8\u518C" } });
  }
  const content = card.createDiv({ cls: "vax-album-grid__content" });
  content.createEl("h2", { text: album.title, cls: "vax-album-grid__title" });
  if (album.desc)
    content.createEl("p", { text: album.desc, cls: "vax-album-grid__desc" });
  if (album.location) {
    const meta = content.createDiv({ cls: "vax-album-grid__meta" });
    meta.createSpan({ text: album.location, cls: "vax-album-grid__location" });
  }
  if ((_a = album.tags) == null ? void 0 : _a.length) {
    const tags = content.createDiv({ cls: "vax-album-grid__tags" });
    for (const tag of album.tags)
      tags.createSpan({ text: tag, cls: "vax-album-grid__tag" });
  }
  const editBtn = card.createEl("button", {
    cls: "vax-album-grid__edit",
    text: "\u270E",
    attr: { type: "button", "aria-label": "\u7F16\u8F91\u76F8\u518C" }
  });
  editBtn.onclick = (event) => {
    event.stopPropagation();
    handlers.onEditAlbum(album.slug);
  };
}

// src/lib/noticeBoard.ts
function cloneNoticeSections(sections) {
  return sections.map((section) => ({
    label: section.label || "",
    lines: (section.lines || []).map((line) => ({
      text: line.text || "",
      url: line.url || ""
    }))
  }));
}
function createEmptyNoticeLine() {
  return { text: "", url: "" };
}
function createEmptyNoticeSection() {
  return {
    label: "\u65B0\u5206\u7EC4",
    lines: [createEmptyNoticeLine()]
  };
}
function buildNoticePayload(title, sections) {
  return {
    title: title.trim() || "\u516C\u544A\u680F",
    sections: sections.map((section) => {
      const label = section.label.trim();
      const lines = section.lines.map((line) => {
        var _a;
        const text = line.text.trim();
        if (!text)
          return null;
        const url = (_a = line.url) == null ? void 0 : _a.trim();
        return url ? { text, url } : { text };
      }).filter((line) => Boolean(line));
      if (!label && !lines.length)
        return null;
      return {
        label: label || "\u5206\u7EC4",
        lines
      };
    }).filter((section) => Boolean(section))
  };
}
function defaultNoticeDetail() {
  return {
    title: "\u516C\u544A\u680F",
    sections: [createEmptyNoticeSection()]
  };
}

// src/views/aboutBoard.ts
function renderAboutBoard(container, options, handlers) {
  renderSectionHeader(container, {
    title: "\u5173\u4E8E\u9875\u7BA1\u7406",
    subtitle: "\u53EF\u89C6\u5316\u7F16\u8F91\u5173\u4E8E\u9875\u6B63\u6587",
    actions: [
      { label: "\u5237\u65B0", onClick: handlers.onRefresh },
      {
        label: options.saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u5173\u4E8E\u9875",
        primary: true,
        onClick: handlers.onSave
      }
    ]
  });
  const board = container.createDiv({ cls: "vax-admin-section__board vax-about-board" });
  const meta = board.createDiv({ cls: "vax-about-board__meta" });
  addField(meta, "\u9875\u9762\u6807\u9898", "\u5173\u4E8E\u6211", options.title, handlers.onChangeTitle);
  addField(meta, "\u5934\u56FE URL", "https://...", options.cover, handlers.onChangeCover);
  addField(meta, "\u53D1\u5E03\u65E5\u671F", "YYYY-MM-DD", options.date, handlers.onChangeDate, { type: "date" });
  const editor = board.createDiv({ cls: "vax-about-board__editor" });
  editor.createEl("label", { text: "\u6B63\u6587 Markdown", cls: "vax-about-field__label" });
  const textarea = editor.createEl("textarea", {
    cls: "vax-about-board__textarea",
    attr: { placeholder: "\u5F00\u59CB\u7F16\u5199\u5173\u4E8E\u9875\u5185\u5BB9\u2026", spellcheck: "false" }
  });
  textarea.value = options.markdown;
  textarea.oninput = () => handlers.onChangeMarkdown(textarea.value);
}
function addField(parent, label, placeholder, value, onChange, options) {
  const field = parent.createDiv({ cls: "vax-about-field" });
  field.createEl("label", { text: label, cls: "vax-about-field__label" });
  const input = field.createEl("input", {
    type: (options == null ? void 0 : options.type) || "text",
    cls: "vax-about-field__input",
    attr: { placeholder }
  });
  input.value = value;
  input.oninput = () => onChange(input.value);
}

// src/lib/albumPhotos.ts
var VIDEO_EXT = /\.(mp4|webm|mov|mkv|avi|m4v|ogv|wmv)$/i;
function isAlbumVideo(photo) {
  if (photo.type === "video")
    return true;
  if (photo.type === "image")
    return false;
  const clean = photo.url.split("?")[0].split("#")[0];
  return VIDEO_EXT.test(clean);
}
function sortPhotosByDate(photos) {
  return [...photos].sort((a, b) => {
    const ta = a.date ? Date.parse(a.date) : 0;
    const tb = b.date ? Date.parse(b.date) : 0;
    return tb - ta;
  });
}
function groupPhotosByMonth(photos) {
  var _a;
  const sorted = sortPhotosByDate(photos);
  const groups = [];
  const map2 = /* @__PURE__ */ new Map();
  for (const photo of sorted) {
    const key = ((_a = photo.date) == null ? void 0 : _a.slice(0, 7)) || "unknown";
    if (!map2.has(key))
      map2.set(key, []);
    map2.get(key).push(photo);
  }
  for (const [key, items] of map2.entries()) {
    groups.push({
      key,
      label: formatMonthLabel(key),
      photos: items
    });
  }
  return groups;
}
function formatMonthLabel(key) {
  if (key === "unknown")
    return "\u672A\u6807\u6CE8\u65E5\u671F";
  const [year, month] = key.split("-");
  if (!year || !month)
    return key;
  return `${year} \u5E74 ${Number(month)} \u6708`;
}

// src/views/albumPhotosBoard.ts
function renderAlbumPhotosBoard(container, state, handlers) {
  container.empty();
  const header = container.createDiv({ cls: "vax-album-photos__header" });
  const backBtn = header.createEl("button", {
    cls: "vax-album-photos__back",
    attr: { type: "button", "aria-label": "\u8FD4\u56DE\u76F8\u518C\u5217\u8868" }
  });
  backBtn.setText("\u2190");
  backBtn.onclick = handlers.onBack;
  const heading = header.createDiv({ cls: "vax-album-photos__heading" });
  heading.createEl("h1", { text: state.title });
  heading.createEl("p", {
    text: state.saving ? "\u4FDD\u5B58\u4E2D\u2026" : state.isWebDav ? "WebDAV \u76F8\u518C \xB7 \u4EC5\u5143\u6570\u636E\u53EF\u7F16\u8F91" : `${state.photos.length} \u5F20\u7167\u7247`
  });
  const actions = header.createDiv({ cls: "vax-album-photos__actions" });
  if (!state.isWebDav) {
    const selectBtn = actions.createEl("button", {
      text: state.selectionMode ? "\u53D6\u6D88\u591A\u9009" : "\u591A\u9009",
      cls: "vax-admin-section__btn vax-admin-section__btn--ghost",
      attr: { type: "button" }
    });
    selectBtn.onclick = handlers.onToggleSelectionMode;
    if (state.selectionMode) {
      const allSelected = state.photos.length > 0 && state.photos.every((photo) => state.selectedUrls.includes(photo.url));
      const selectAllBtn = actions.createEl("button", {
        text: allSelected ? "\u53D6\u6D88\u5168\u9009" : "\u5168\u9009",
        cls: "vax-admin-section__btn vax-admin-section__btn--ghost",
        attr: { type: "button" }
      });
      selectAllBtn.onclick = handlers.onToggleSelectAll;
      if (state.selectedUrls.length) {
        const deleteBtn = actions.createEl("button", {
          text: `\u5220\u9664\u9009\u4E2D (${state.selectedUrls.length})`,
          cls: "vax-admin-section__btn vax-admin-section__btn--ghost",
          attr: { type: "button" }
        });
        deleteBtn.onclick = handlers.onDeleteSelected;
      }
    }
    const addBtn = actions.createEl("button", {
      text: "\u65B0\u589E\u7167\u7247",
      cls: "vax-admin-section__btn vax-admin-section__btn--primary",
      attr: { type: "button" }
    });
    addBtn.onclick = handlers.onAddPhoto;
  }
  const metaBtn = actions.createEl("button", {
    text: "\u7F16\u8F91\u4FE1\u606F",
    cls: "vax-admin-section__btn vax-admin-section__btn--ghost",
    attr: { type: "button" }
  });
  metaBtn.onclick = handlers.onEditMeta;
  const board = container.createDiv({ cls: "vax-admin-section__board vax-album-photos__board" });
  if (state.isWebDav) {
    board.createEl("p", {
      cls: "vax-album-photos__notice",
      text: "\u6B64\u76F8\u518C\u7167\u7247\u6765\u81EA WebDAV\uFF0C\u540E\u53F0\u4EC5\u53EF\u7F16\u8F91\u76F8\u518C\u5143\u6570\u636E\u3002\u70B9\u51FB\u300C\u7F16\u8F91\u4FE1\u606F\u300D\u4FEE\u6539\u6807\u9898\u3001\u5C01\u9762\u7B49\u3002"
    });
    return;
  }
  if (!state.photos.length) {
    board.createEl("p", {
      cls: "vax-album-photos__empty",
      text: "\u6682\u65E0\u7167\u7247\uFF0C\u70B9\u51FB\u300C\u65B0\u589E\u7167\u7247\u300D\u6DFB\u52A0 URL\u3002"
    });
    return;
  }
  const timeline = board.createDiv({ cls: "vax-album-photos__timeline" });
  for (const group of groupPhotosByMonth(state.photos)) {
    const section = timeline.createDiv({ cls: "vax-album-photos__group" });
    section.createEl("h3", { text: group.label, cls: "vax-album-photos__month" });
    const grid = section.createDiv({ cls: "vax-album-photos__grid" });
    for (const photo of group.photos)
      renderPhotoItem(grid, photo, state, handlers);
  }
}
function renderPhotoItem(grid, photo, state, handlers) {
  const item = grid.createDiv({ cls: "vax-album-photos__item" });
  const isSelected = state.selectedUrls.includes(photo.url);
  const photoBtn = item.createDiv({
    cls: `vax-album-photos__photo${state.selectionMode ? " is-selectable" : ""}${isSelected ? " is-selected" : ""}${isAlbumVideo(photo) ? " is-video" : ""}`
  });
  if (state.selectionMode) {
    photoBtn.setAttr("role", "button");
    photoBtn.setAttr("tabindex", "0");
    photoBtn.createSpan({
      text: isSelected ? "\u2713" : "",
      cls: "vax-album-photos__check"
    });
    photoBtn.onclick = () => handlers.onTogglePhoto(photo.url);
    photoBtn.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ")
        handlers.onTogglePhoto(photo.url);
    };
  }
  if (isAlbumVideo(photo)) {
    if (photo.poster) {
      const img = photoBtn.createEl("img", { attr: { alt: "\u76F8\u518C\u89C6\u9891", loading: "lazy" } });
      img.src = photo.poster;
    } else {
      photoBtn.createDiv({ text: "\u25B6", cls: "vax-album-photos__video-badge" });
    }
  } else {
    const img = photoBtn.createEl("img", { attr: { alt: "\u76F8\u518C\u7167\u7247", loading: "lazy" } });
    img.src = photo.url;
  }
  if (!state.selectionMode) {
    const deleteBtn = item.createEl("button", {
      cls: "vax-album-photos__delete",
      text: "\xD7",
      attr: { type: "button", "aria-label": "\u5220\u9664\u7167\u7247" }
    });
    deleteBtn.onclick = (event) => {
      event.stopPropagation();
      handlers.onDeletePhoto(photo);
    };
  }
}

// src/views/noticeBoard.ts
function renderNoticeBoard(container, options, handlers) {
  renderSectionHeader(container, {
    title: "\u516C\u544A\u680F\u7BA1\u7406",
    subtitle: options.updatedAt ? `\u7F16\u8F91\u9996\u9875\u5DE6\u4FA7\u516C\u544A\u680F \xB7 \u66F4\u65B0\u4E8E ${options.updatedAt}` : "\u7F16\u8F91\u9996\u9875\u5DE6\u4FA7\u516C\u544A\u680F\u5185\u5BB9",
    actions: [
      { label: "\u5237\u65B0", onClick: handlers.onRefresh },
      {
        label: options.saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u516C\u544A\u680F",
        primary: true,
        onClick: handlers.onSave
      }
    ]
  });
  const board = container.createDiv({ cls: "vax-admin-section__board vax-notice-board" });
  const meta = board.createDiv({ cls: "vax-notice-board__meta" });
  addField2(meta, "\u516C\u544A\u6807\u9898", "\u516C\u544A\u680F", options.title, handlers.onChangeTitle, { wide: true });
  const sectionsEl = board.createDiv({ cls: "vax-notice-board__sections" });
  options.sections.forEach((section, sectionIndex) => {
    renderNoticeSection(sectionsEl, section, sectionIndex, handlers);
  });
  const foot = board.createDiv({ cls: "vax-notice-board__foot" });
  const addSectionBtn = foot.createEl("button", {
    text: "+ \u6DFB\u52A0\u5206\u7EC4",
    cls: "vax-notice-board__btn vax-notice-board__btn--ghost",
    attr: { type: "button" }
  });
  addSectionBtn.onclick = handlers.onAddSection;
}
function addField2(parent, label, placeholder, value, onChange, options) {
  const field = parent.createDiv({
    cls: `vax-notice-field${(options == null ? void 0 : options.wide) ? " vax-notice-field--wide" : ""}`
  });
  field.createEl("label", { text: label, cls: "vax-notice-field__label" });
  const input = field.createEl("input", {
    type: "text",
    cls: "vax-notice-field__input",
    attr: { placeholder }
  });
  input.value = value;
  input.oninput = () => onChange(input.value);
  return input;
}
function renderNoticeSection(root, section, sectionIndex, handlers) {
  const block = root.createDiv({ cls: "vax-notice-board__section" });
  const head = block.createDiv({ cls: "vax-notice-board__section-head" });
  head.createSpan({ text: `\u5206\u7EC4 ${sectionIndex + 1}`, cls: "vax-notice-board__section-badge" });
  const headMain = head.createDiv({ cls: "vax-notice-board__section-head-main" });
  addField2(headMain, "\u5206\u7EC4\u6807\u9898", "--- \u4E3B\u57DF\u540D ---", section.label, (value) => {
    handlers.onChangeSectionLabel(sectionIndex, value);
  }, { wide: true });
  const removeSectionBtn = head.createEl("button", {
    text: "\u5220\u9664\u5206\u7EC4",
    cls: "vax-notice-board__btn vax-notice-board__btn--danger vax-notice-board__btn--compact",
    attr: { type: "button" }
  });
  removeSectionBtn.onclick = () => handlers.onRemoveSection(sectionIndex);
  const linesEl = block.createDiv({ cls: "vax-notice-board__lines" });
  if (!section.lines.length) {
    linesEl.createDiv({
      text: "\u6682\u65E0\u5185\u5BB9\uFF0C\u70B9\u51FB\u4E0B\u65B9\u300C\u6DFB\u52A0\u4E00\u884C\u300D",
      cls: "vax-notice-board__lines-empty"
    });
  }
  section.lines.forEach((line, lineIndex) => {
    const row = linesEl.createDiv({ cls: "vax-notice-board__line-row" });
    addField2(row, "\u663E\u793A\u6587\u5B57", "daily.example.com", line.text, (value) => {
      handlers.onChangeLineText(sectionIndex, lineIndex, value);
    });
    addField2(row, "\u94FE\u63A5\uFF08\u53EF\u9009\uFF09", "\u7559\u7A7A\u5219\u81EA\u52A8\u8BC6\u522B\u57DF\u540D", line.url || "", (value) => {
      handlers.onChangeLineUrl(sectionIndex, lineIndex, value);
    });
    const removeLineBtn = row.createEl("button", {
      text: "\u5220\u9664",
      cls: "vax-notice-board__btn vax-notice-board__btn--ghost vax-notice-board__btn--compact",
      attr: { type: "button" }
    });
    removeLineBtn.onclick = () => handlers.onRemoveLine(sectionIndex, lineIndex);
  });
  const sectionFoot = block.createDiv({ cls: "vax-notice-board__section-foot" });
  const addLineBtn = sectionFoot.createEl("button", {
    text: "+ \u6DFB\u52A0\u4E00\u884C",
    cls: "vax-notice-board__btn vax-notice-board__btn--ghost vax-notice-board__btn--compact",
    attr: { type: "button" }
  });
  addLineBtn.onclick = () => handlers.onAddLine(sectionIndex);
}

// src/views/AdminPanelView.ts
var ADMIN_VIEW_TYPE = "aiovtue-valaxy-admin";
var NAV = [
  { id: "posts", label: "\u6587\u7AE0\u7BA1\u7406", icon: "file-text" },
  { id: "links", label: "\u53CB\u94FE\u7BA1\u7406", icon: "link" },
  { id: "files", label: "HTML \u6587\u4EF6", icon: "file-code" },
  { id: "gallery", label: "\u76F8\u518C\u7BA1\u7406", icon: "images" },
  { id: "notice", label: "\u516C\u544A\u680F\u7BA1\u7406", icon: "megaphone" },
  { id: "about", label: "\u5173\u4E8E\u9875", icon: "info" },
  { id: "settings", label: "\u7AD9\u70B9\u8BBE\u7F6E", icon: "settings" }
];
var AdminPanelView = class extends import_obsidian11.ItemView {
  constructor(leaf, api, downloader) {
    super(leaf);
    this.api = api;
    this.downloader = downloader;
    this.section = "posts";
    this.galleryAlbumSlug = null;
    this.sidebarOpen = false;
  }
  getViewType() {
    return ADMIN_VIEW_TYPE;
  }
  getDisplayText() {
    return "Valaxy \u7BA1\u7406";
  }
  getIcon() {
    return "layout-dashboard";
  }
  async onOpen() {
    this.containerEl.addClass("vax-admin-view-host");
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("vax-admin-root");
    this.shellEl = root.createDiv({ cls: "vax-admin" });
    const sidebar = this.shellEl.createDiv({ cls: "vax-admin__sidebar" });
    const sidebarHead = sidebar.createDiv({ cls: "vax-admin__sidebar-head" });
    const brand = sidebarHead.createDiv({ cls: "vax-admin__sidebar-brand" });
    (0, import_obsidian11.setIcon)(brand.createSpan({ cls: "vax-admin__sidebar-brand-icon" }), "layout-dashboard");
    const brandText = brand.createDiv({ cls: "vax-admin__sidebar-brand-text" });
    brandText.createDiv({ text: "Valaxy", cls: "vax-admin__sidebar-brand-title" });
    brandText.createSpan({ text: "\u7AD9\u70B9\u7BA1\u7406\u9762\u677F", cls: "vax-admin__sidebar-brand-sub" });
    const navWrap = sidebar.createDiv({ cls: "vax-admin__sidebar-nav" });
    navWrap.createDiv({ text: "\u7BA1\u7406\u6A21\u5757", cls: "vax-admin__sidebar-nav-label" });
    for (const item of NAV) {
      const btn = navWrap.createEl("button", {
        cls: `vax-admin__nav-item${this.section === item.id ? " is-active" : ""}`
      });
      btn.dataset.section = item.id;
      const iconWrap = btn.createSpan({ cls: "vax-admin__nav-icon-wrap" });
      (0, import_obsidian11.setIcon)(iconWrap.createSpan({ cls: "vax-admin__nav-icon" }), item.icon);
      btn.createSpan({ text: item.label, cls: "vax-admin__nav-label" });
      btn.onclick = () => {
        this.section = item.id;
        if (this.section !== "gallery")
          this.galleryAlbumSlug = null;
        this.closeSidebar();
        void this.render();
      };
    }
    sidebar.createDiv({ cls: "vax-admin__sidebar-foot" }).createSpan({ text: "Valaxy Sync", cls: "vax-admin__sidebar-foot-text" });
    const mainWrap = this.shellEl.createDiv({ cls: "vax-admin__main-wrap" });
    const topbar = mainWrap.createDiv({ cls: "vax-admin__topbar" });
    const brandBtn = topbar.createEl("button", {
      cls: "vax-admin__brand-btn",
      attr: { "aria-label": "\u5207\u6362\u4FA7\u680F", type: "button" }
    });
    this.brandBtn = brandBtn;
    this.menuIconEl = brandBtn.createSpan({ cls: "vax-admin__menu-icon" });
    brandBtn.createSpan({ text: "Valaxy", cls: "vax-admin__brand-text" });
    brandBtn.onclick = () => this.toggleSidebar();
    this.mainEl = mainWrap.createDiv({ cls: "vax-admin__main" });
    this.statusEl = this.mainEl.createDiv({ cls: "vax-admin__status" });
    this.contentEl = this.mainEl.createDiv({ cls: "vax-admin__content" });
    this.backdropEl = this.shellEl.createDiv({ cls: "vax-admin__backdrop" });
    this.backdropEl.onclick = () => this.closeSidebar();
    this.syncSidebarState();
    await this.render();
  }
  async onClose() {
  }
  setStatus(text, isError = false) {
    this.statusEl.setText(text);
    this.statusEl.toggleClass("is-error", isError);
  }
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.syncSidebarState();
  }
  closeSidebar() {
    if (!this.sidebarOpen)
      return;
    if (window.innerWidth >= 760)
      return;
    this.sidebarOpen = false;
    this.syncSidebarState();
  }
  syncSidebarState() {
    this.shellEl.toggleClass("vax-admin--sidebar-open", this.sidebarOpen);
    this.backdropEl.toggleClass("is-visible", this.sidebarOpen);
    if (this.menuIconEl) {
      this.menuIconEl.empty();
      (0, import_obsidian11.setIcon)(
        this.menuIconEl,
        this.sidebarOpen ? "panel-left-close" : "menu"
      );
    }
    if (this.brandBtn) {
      this.brandBtn.setAttr(
        "aria-label",
        this.sidebarOpen ? "\u9690\u85CF\u4FA7\u680F" : "\u663E\u793A\u4FA7\u680F"
      );
    }
  }
  async render() {
    this.containerEl.querySelectorAll(".vax-admin__nav-item").forEach((el) => {
      el.toggleClass("is-active", el.dataset.section === this.section);
    });
    this.contentEl.empty();
    this.setStatus("\u52A0\u8F7D\u4E2D\u2026");
    try {
      switch (this.section) {
        case "posts":
          await this.renderPosts();
          break;
        case "links":
          await this.renderLinks();
          break;
        case "about":
          await this.renderAbout();
          break;
        case "notice":
          await this.renderNotice();
          break;
        case "gallery":
          await this.renderGallerySection();
          break;
        case "files":
          await this.renderHtmlFiles();
          break;
        case "settings":
          await this.renderSiteSettings();
          break;
      }
      this.setStatus("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.setStatus(msg, true);
      this.contentEl.createEl("p", { text: msg, cls: "vax-error" });
    }
  }
  toolbar(title, actions) {
    const bar = this.contentEl.createDiv({ cls: "vax-admin__toolbar" });
    bar.createEl("h3", { text: title, cls: "vax-admin__toolbar-title" });
    const actionsEl = bar.createDiv({ cls: "vax-admin__toolbar-actions" });
    for (const action of actions) {
      const btn = actionsEl.createEl("button", {
        text: action.label,
        cls: action.primary ? "mod-cta" : ""
      });
      btn.onclick = action.onClick;
    }
  }
  async renderPosts() {
    const posts = await this.api.listPosts();
    this.toolbar("\u6587\u7AE0\u7BA1\u7406", [
      { label: "\u5237\u65B0", onClick: () => void this.render() }
    ]);
    if (!posts.length) {
      this.contentEl.createEl("p", { text: "\u6682\u65E0\u6587\u7AE0", cls: "vax-muted" });
      return;
    }
    const table = this.contentEl.createEl("table", { cls: "vax-table" });
    const thead = table.createEl("thead");
    const headRow = thead.createEl("tr");
    for (const h of ["\u6807\u9898", "Slug", "\u65E5\u671F", "\u64CD\u4F5C"])
      headRow.createEl("th", { text: h });
    const tbody = table.createEl("tbody");
    for (const post of posts)
      this.renderPostRow(tbody, post);
  }
  renderPostRow(tbody, post) {
    const tr = tbody.createEl("tr");
    tr.createEl("td", { text: post.title });
    tr.createEl("td", { text: post.slug, cls: "vax-mono" });
    tr.createEl("td", { text: post.date });
    const actions = tr.createEl("td", { cls: "vax-row-actions" });
    const menuBtn = actions.createEl("button", {
      cls: "vax-post-menu-btn",
      attr: { type: "button", "aria-label": "\u6587\u7AE0\u64CD\u4F5C" }
    });
    (0, import_obsidian11.setIcon)(menuBtn.createSpan({ cls: "vax-post-menu-btn__icon" }), "more-vertical");
    menuBtn.onclick = (event) => {
      event.stopPropagation();
      const menu = new import_obsidian11.Menu();
      menu.addItem(
        (item) => item.setTitle("\u9884\u89C8").setIcon("eye").onClick(() => void openPostPreview(this.app, this.api, post.slug, post.title))
      );
      menu.addItem(
        (item) => item.setTitle("\u7F16\u8F91").setIcon("pencil").onClick(() => void openPostForEdit(this.app, this.downloader, post.slug))
      );
      menu.addItem(
        (item) => item.setTitle("\u5220\u9664").setIcon("trash").setWarning(true).onClick(() => void this.deletePost(post.slug, post.title))
      );
      menu.showAtMouseEvent(event);
    };
  }
  async deletePost(slug, title) {
    const modal = new ConfirmModal(
      this.app,
      `\u786E\u5B9A\u5220\u9664\u300C${title}\u300D\uFF1F`,
      async () => {
        await this.api.deletePost(slug);
        const cleared = await this.downloader.clearLocalPublishedUrl(slug);
        new import_obsidian11.Notice(cleared ? "\u5DF2\u5220\u9664\uFF0C\u5E76\u5DF2\u6E05\u9664\u672C\u5730\u53D1\u5E03\u94FE\u63A5" : "\u5DF2\u5220\u9664");
        await this.render();
      }
    );
    modal.open();
  }
  openMarkdownEditor(title, source, save, hint) {
    const modal = new EditorModal(this.app, title, source, async (value) => {
      await save(value);
      new import_obsidian11.Notice(`${title}\u5DF2\u4FDD\u5B58`);
      await this.render();
    }, { language: "markdown", hint });
    modal.open();
  }
  async renderLinks() {
    const detail = await this.api.getLinksDetail();
    const groups = cloneLinkGroups(detail.linkGroups || []);
    const source = detail.source || "";
    let page = readLinksPageSettings(detail.frontmatter, source);
    const linkCount = groups.reduce((sum, group) => {
      var _a;
      return sum + (((_a = group.links) == null ? void 0 : _a.length) || 0);
    }, 0);
    const persistLinks = async () => {
      const nextSource = buildLinksSource(page, groups, source);
      await this.api.saveLinksSource(nextSource);
      new import_obsidian11.Notice("\u53CB\u94FE\u5DF2\u4FDD\u5B58");
      await this.render();
    };
    const section = this.contentEl.createDiv({ cls: "vax-admin-section vax-admin-section--links" });
    renderSectionHeader(section, {
      title: "\u53CB\u94FE\u7BA1\u7406",
      subtitle: `${groups.length} \u4E2A\u5206\u7EC4 \xB7 ${linkCount} \u6761\u53CB\u94FE`,
      actions: [
        {
          label: "\u9875\u9762\u8BBE\u7F6E",
          onClick: () => this.openLinksPageSettings(page, async (next) => {
            page = next;
            await persistLinks();
          })
        },
        {
          label: "\u65B0\u589E\u5206\u7EC4",
          onClick: () => this.openNewLinkGroupEditor(groups, persistLinks)
        },
        {
          label: "\u7F16\u8F91\u6E90\u7801",
          onClick: () => this.openMarkdownEditor("\u7F16\u8F91\u53CB\u94FE\u6E90\u7801", source, (v) => this.api.saveLinksSource(v), "\u5B8C\u6574 Markdown \u6E90\u7801\uFF08\u542B linkGroups\uFF09")
        },
        { label: "\u5237\u65B0", onClick: () => void this.render() }
      ]
    });
    renderLinksBoard(section, groups, {
      onEditLink: (groupIndex, linkIndex) => {
        this.openLinkItemEditor(groups, groupIndex, linkIndex, persistLinks);
      },
      onAddLink: (groupIndex) => {
        this.openLinkItemEditor(groups, groupIndex, -1, persistLinks);
      },
      onEditGroup: (groupIndex) => {
        this.openLinkGroupEditor(groups, groupIndex, persistLinks);
      }
    });
  }
  openLinksPageSettings(page, onSave) {
    const modal = new LinksPageSettingsModal(this.app, page, onSave);
    modal.open();
  }
  openLinkItemEditor(groups, groupIndex, linkIndex, persist) {
    var _a, _b;
    const isNew = linkIndex < 0;
    const initial = isNew ? void 0 : (_b = (_a = groups[groupIndex]) == null ? void 0 : _a.links) == null ? void 0 : _b[linkIndex];
    const modal = new LinkItemEditorModal(this.app, {
      title: isNew ? "\u65B0\u5EFA\u53CB\u94FE" : "\u7F16\u8F91\u53CB\u94FE",
      initial,
      isNew,
      onSave: async (link) => {
        if (isNew)
          groups[groupIndex].links.push(link);
        else
          groups[groupIndex].links[linkIndex] = link;
        await persist();
      },
      onDelete: isNew ? void 0 : async () => {
        const confirmed = await this.confirmAction("\u786E\u5B9A\u5220\u9664\u8FD9\u6761\u53CB\u94FE\u5417\uFF1F");
        if (!confirmed)
          return false;
        groups[groupIndex].links.splice(linkIndex, 1);
        await persist();
        return true;
      }
    });
    modal.open();
  }
  openNewLinkGroupEditor(groups, persist) {
    const modal = new LinkGroupEditorModal(this.app, {
      initial: createEmptyGroup(),
      groupIndex: groups.length,
      groupCount: groups.length + 1,
      isNew: true,
      onSave: async (group) => {
        groups.push(group);
        await persist();
      }
    });
    modal.open();
  }
  openLinkGroupEditor(groups, groupIndex, persist) {
    const modal = new LinkGroupEditorModal(this.app, {
      initial: groups[groupIndex],
      groupIndex,
      groupCount: groups.length,
      onSave: async (group) => {
        groups[groupIndex] = group;
        await persist();
      },
      onDelete: async () => {
        const confirmed = await this.confirmAction("\u786E\u5B9A\u5220\u9664\u8BE5\u5206\u7EC4\u53CA\u5176\u6240\u6709\u53CB\u94FE\u5417\uFF1F");
        if (!confirmed)
          return false;
        groups.splice(groupIndex, 1);
        await persist();
        return true;
      },
      onMove: async (direction) => {
        const target = groupIndex + direction;
        if (target < 0 || target >= groups.length)
          return;
        const [item] = groups.splice(groupIndex, 1);
        groups.splice(target, 0, item);
        await persist();
      }
    });
    modal.open();
  }
  confirmAction(message) {
    return new Promise((resolve) => {
      const modal = new ConfirmModal(
        this.app,
        message,
        async () => resolve(true),
        () => resolve(false)
      );
      modal.open();
    });
  }
  async renderAbout() {
    const detail = parseAboutDetail(await this.api.getAboutDetail());
    let title = detail.frontmatter.title || defaultAboutDetail().frontmatter.title || "\u5173\u4E8E\u6211";
    let cover = detail.frontmatter.cover || "";
    let date = detail.frontmatter.date || todayDateString();
    let markdown = detail.markdown || defaultAboutDetail().markdown || "\n# \u5173\u4E8E\u672C\u7AD9\n\n";
    let saving = false;
    const paint = () => {
      this.contentEl.empty();
      const section = this.contentEl.createDiv({ cls: "vax-admin-section vax-admin-section--about" });
      renderAboutBoard(section, {
        title,
        cover,
        date,
        markdown,
        saving
      }, {
        onRefresh: () => void this.render(),
        onSave: async () => {
          if (!title.trim()) {
            new import_obsidian11.Notice("\u8BF7\u586B\u5199\u9875\u9762\u6807\u9898");
            return;
          }
          saving = true;
          paint();
          try {
            const source = buildAboutSource({ title, cover, date }, markdown);
            await this.api.saveAboutSource(source);
            new import_obsidian11.Notice("\u5173\u4E8E\u9875\u5DF2\u4FDD\u5B58");
          } finally {
            saving = false;
            paint();
          }
        },
        onChangeTitle: (value) => {
          title = value;
        },
        onChangeCover: (value) => {
          cover = value;
        },
        onChangeDate: (value) => {
          date = value;
        },
        onChangeMarkdown: (value) => {
          markdown = value;
        }
      });
    };
    paint();
  }
  async renderNotice() {
    var _a;
    const detail = await this.api.getNoticeDetail();
    let title = detail.title || "\u516C\u544A\u680F";
    let sections = cloneNoticeSections(((_a = detail.sections) == null ? void 0 : _a.length) ? detail.sections : defaultNoticeDetail().sections);
    let updatedAt = detail.updatedAt;
    let saving = false;
    const paint = () => {
      this.contentEl.empty();
      const section = this.contentEl.createDiv({ cls: "vax-admin-section vax-admin-section--notice" });
      renderNoticeBoard(section, {
        title,
        sections,
        saving,
        updatedAt
      }, {
        onRefresh: () => void this.render(),
        onSave: async () => {
          var _a2;
          const payload = buildNoticePayload(title, sections);
          if (!payload.sections.length) {
            new import_obsidian11.Notice("\u8BF7\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u6709\u6548\u5206\u7EC4\u4E0E\u4E00\u884C\u5185\u5BB9");
            return;
          }
          saving = true;
          paint();
          try {
            const saved = await this.api.saveNoticeDetail(payload);
            title = saved.title || payload.title;
            sections = cloneNoticeSections(((_a2 = saved.sections) == null ? void 0 : _a2.length) ? saved.sections : payload.sections);
            updatedAt = saved.updatedAt;
            new import_obsidian11.Notice("\u516C\u544A\u680F\u5DF2\u4FDD\u5B58");
          } finally {
            saving = false;
            paint();
          }
        },
        onAddSection: () => {
          sections.push(createEmptyNoticeSection());
          paint();
        },
        onRemoveSection: (index) => {
          sections.splice(index, 1);
          if (!sections.length)
            sections.push(createEmptyNoticeSection());
          paint();
        },
        onAddLine: (sectionIndex) => {
          var _a2;
          (_a2 = sections[sectionIndex]) == null ? void 0 : _a2.lines.push(createEmptyNoticeLine());
          paint();
        },
        onRemoveLine: (sectionIndex, lineIndex) => {
          const section2 = sections[sectionIndex];
          if (!section2)
            return;
          section2.lines.splice(lineIndex, 1);
          if (!section2.lines.length)
            section2.lines.push(createEmptyNoticeLine());
          paint();
        },
        onChangeTitle: (value) => {
          title = value;
        },
        onChangeSectionLabel: (sectionIndex, value) => {
          const section2 = sections[sectionIndex];
          if (section2)
            section2.label = value;
        },
        onChangeLineText: (sectionIndex, lineIndex, value) => {
          var _a2;
          const line = (_a2 = sections[sectionIndex]) == null ? void 0 : _a2.lines[lineIndex];
          if (line)
            line.text = value;
        },
        onChangeLineUrl: (sectionIndex, lineIndex, value) => {
          var _a2;
          const line = (_a2 = sections[sectionIndex]) == null ? void 0 : _a2.lines[lineIndex];
          if (line)
            line.url = value;
        }
      });
    };
    paint();
  }
  // —— HTML 文件管理 ——
  async renderHtmlFiles() {
    let files = await this.api.listHtmlFiles();
    let loading = false;
    const paint = () => {
      this.contentEl.empty();
      const section = this.contentEl.createDiv({ cls: "vax-admin-section vax-admin-section--files" });
      renderSectionHeader(section, {
        title: "\u0048TML \u6587\u4EF6",
        subtitle: files.length ? `${files.length} \u4E2A\u6587\u4EF6` : "\u8FD8\u6CA1\u6709\u72EC\u7ACB HTML \u9875\u9762",
        actions: [
          { label: "\u65B0\u5EFA\u6587\u4EF6", onClick: () => void this.openHtmlFileEditor(null) },
          { label: "\u5237\u65B0", onClick: () => void this.reloadHtmlFiles() }
        ]
      });
      if (!files.length) {
        section.createEl("p", {
          text: "\u53EF\u4EE5\u4E0A\u4F20\u72EC\u7ACB\u7684 HTML \u9875\u9762\uFF08\u5982\u5C0F\u5DE5\u5177\u3001\u9884\u89C8\u9875\uFF09\uFF0C\u53D1\u5E03\u540E\u901A\u8FC7 /{slug}.html \u8BBF\u95EE\u3002",
          cls: "vax-muted"
        });
        return;
      }
      const list = section.createDiv({ cls: "vax-file-list" });
      for (const file of files) {
        const row = list.createDiv({ cls: "vax-file-row" });
        const info = row.createDiv({ cls: "vax-file-row__info" });
        info.createEl("strong", { text: file.title || file.slug, cls: "vax-file-row__title" });
        info.createDiv({ text: file.publicPath || `/${file.slug}.html`, cls: "vax-file-row__path vax-muted" });
        if (file.description)
          info.createDiv({ text: file.description, cls: "vax-file-row__desc vax-muted" });
        const actions = row.createDiv({ cls: "vax-file-row__actions" });
        const editBtn = actions.createEl("button", { text: "\u7F16\u8F91" });
        editBtn.onclick = () => void this.openHtmlFileEditor(file.slug);
        const openBtn = actions.createEl("button", { text: "\u9884\u89C8" });
        openBtn.onclick = () => window.open(apiUrl(this.api.getSettings().siteUrl, file.publicPath || `/${file.slug}.html`), "_blank");
        const delBtn = actions.createEl("button", { text: "\u5220\u9664", cls: "mod-warning" });
        delBtn.onclick = async () => {
          if (!confirm(`\u786E\u5B9A\u5220\u9664\u300C${file.title || file.slug}\u300D\u5417\uFF1F`))
            return;
          this.setStatus("\u5220\u9664\u4E2D\u2026");
          try {
            await this.api.deleteHtmlFile(file.slug);
            new import_obsidian11.Notice("\u6587\u4EF6\u5DF2\u5220\u9664");
            await this.reloadHtmlFiles();
          } catch (error) {
            this.setStatus(error instanceof Error ? error.message : "\u5220\u9664\u5931\u8D25", true);
          }
        };
      }
    };
    this.reloadHtmlFiles = async () => {
      if (loading)
        return;
      loading = true;
      try {
        files = await this.api.listHtmlFiles();
      } finally {
        loading = false;
      }
      this.setStatus("");
      paint();
    };
    paint();
  }

  async openHtmlFileEditor(slug) {
    let detail = { slug: "", title: "", description: "", content: "" };
    if (slug) {
      try {
        this.setStatus("\u52A0\u8F7D\u6587\u4EF6\u2026");
        const data = await this.api.getHtmlFile(slug);
        detail = {
          slug: data.slug || slug,
          title: data.title || "",
          description: data.description || "",
          content: data.content || ""
        };
      } catch (error) {
        this.setStatus(error instanceof Error ? error.message : "\u52A0\u8F7D\u5931\u8D25", true);
        return;
      } finally {
        this.setStatus("");
      }
    }
    new HtmlFileEditorModal(this.app, {
      isNew: !slug,
      initial: detail,
      onSave: async (payload) => {
        await this.api.saveHtmlFile(payload);
        new import_obsidian11.Notice("\u0048TML \u6587\u4EF6\u5DF2\u4FDD\u5B58");
      },
      onSaved: async () => {
        await this.reloadHtmlFiles();
      }
    }).open();
  }

  // —— 站点设置 ——
  async renderSiteSettings() {
    const detail = await this.api.getSiteSettings();
    const editor = new SiteSettingsEditor(this.contentEl, {
      initial: detail,
      onSave: async (payload) => {
        const saved = await this.api.saveSiteSettings(payload);
        new import_obsidian11.Notice("\u7AD9\u70B9\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
        return saved;
      },
      onReset: async () => {
        const restored = await this.api.resetSiteSettings();
        new import_obsidian11.Notice("\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E");
        return restored;
      },
      onStatus: (text, isError) => this.setStatus(text, isError)
    });
    editor.render();
  }

  async renderGallerySection() {
    if (this.galleryAlbumSlug)
      await this.renderAlbumPhotos(this.galleryAlbumSlug);
    else
      await this.renderGallery();
  }
  async renderGallery() {
    const hub = await this.api.getGalleryHub();
    const albums = cloneAlbumSummaries(hub.albums || []);
    const source = hub.source || "";
    let page = readGalleryPageSettings(hub.frontmatter, source);
    const persistHub = async () => {
      const slugs = albums.map((item) => item.slug);
      const nextSource = buildHubSource(page, slugs, source);
      await this.api.saveGalleryHub(nextSource);
      new import_obsidian11.Notice("\u76F8\u518C\u9875\u9762\u5DF2\u4FDD\u5B58");
      await this.render();
    };
    const section = this.contentEl.createDiv({ cls: "vax-admin-section vax-admin-section--gallery" });
    renderSectionHeader(section, {
      title: "\u76F8\u518C\u7BA1\u7406",
      subtitle: `${albums.length} \u4E2A\u76F8\u518C`,
      actions: [
        {
          label: "\u9875\u9762\u8BBE\u7F6E",
          onClick: () => this.openGalleryPageSettings(page, async (next) => {
            page = next;
            await persistHub();
          })
        },
        {
          label: "\u7F16\u8F91\u7D22\u5F15",
          onClick: () => this.openMarkdownEditor("\u7F16\u8F91\u76F8\u518C\u7D22\u5F15", source, (v) => this.api.saveGalleryHub(v), "\u5B8C\u6574\u76F8\u518C\u7D22\u5F15 Markdown \u6E90\u7801")
        },
        {
          label: "\u65B0\u5EFA\u76F8\u518C",
          onClick: () => this.openAlbumEditor({
            isNew: true,
            albums,
            hubSource: source,
            page
          })
        },
        { label: "\u5237\u65B0", onClick: () => void this.render() }
      ]
    });
    renderGalleryBoard(
      section,
      albums,
      {
        onOpenAlbum: (slug) => {
          this.galleryAlbumSlug = slug;
          void this.render();
        },
        onEditAlbum: (slug) => void this.openAlbumEditor({
          isNew: false,
          slug,
          albums,
          hubSource: source,
          page
        }),
        onCreateAlbum: () => this.openAlbumEditor({
          isNew: true,
          albums,
          hubSource: source,
          page
        })
      }
    );
  }
  async renderAlbumPhotos(slug) {
    let frontmatter = {};
    let existingSource = "";
    let photos = [];
    let selectionMode = false;
    let selectedUrls = [];
    let saving = false;
    let hubContext;
    const loadAlbum = async () => {
      const detail = await this.api.getGalleryAlbum(slug);
      frontmatter = detail.frontmatter || (detail.source ? parseAlbumSource(detail.source).frontmatter : {});
      existingSource = detail.source || "";
      photos = Array.isArray(frontmatter.photos) ? frontmatter.photos.map((photo) => ({ ...photo })) : [];
    };
    const loadHub = async () => {
      const hub = await this.api.getGalleryHub();
      hubContext = {
        albums: cloneAlbumSummaries(hub.albums || []),
        hubSource: hub.source || "",
        page: readGalleryPageSettings(hub.frontmatter, hub.source || "")
      };
    };
    try {
      await Promise.all([loadAlbum(), loadHub()]);
    } catch (error) {
      this.contentEl.createEl("p", {
        text: error instanceof Error ? error.message : "\u52A0\u8F7D\u76F8\u518C\u5931\u8D25",
        cls: "vax-error"
      });
      return;
    }
    const persistPhotos = async (nextPhotos, message) => {
      saving = true;
      paint();
      try {
        const source = buildAlbumSourceWithPhotos(frontmatter, nextPhotos, existingSource);
        await this.api.saveGalleryAlbum(slug, source);
        photos = nextPhotos.map((photo) => ({ ...photo }));
        frontmatter = { ...frontmatter, photos };
        existingSource = source;
        selectedUrls = selectedUrls.filter((url) => photos.some((photo) => photo.url === url));
        new import_obsidian11.Notice(message);
      } finally {
        saving = false;
        paint();
      }
    };
    const paint = () => {
      this.contentEl.empty();
      const section = this.contentEl.createDiv({ cls: "vax-admin-section vax-admin-section--album-photos" });
      renderAlbumPhotosBoard(section, {
        title: frontmatter.title || slug,
        isWebDav: frontmatter.source === "webdav",
        photos,
        selectionMode,
        selectedUrls,
        saving
      }, {
        onBack: () => {
          this.galleryAlbumSlug = null;
          void this.render();
        },
        onEditMeta: () => this.openAlbumEditor({
          isNew: false,
          slug,
          albums: hubContext.albums,
          hubSource: hubContext.hubSource,
          page: hubContext.page,
          onSaved: async () => {
            await loadAlbum();
            paint();
          }
        }),
        onAddPhoto: () => {
          const modal = new AddPhotoModal(this.app, async (photo) => {
            await persistPhotos([...photos, photo], "\u7167\u7247\u5DF2\u6DFB\u52A0");
          });
          modal.open();
        },
        onToggleSelectionMode: () => {
          selectionMode = !selectionMode;
          if (!selectionMode)
            selectedUrls = [];
          paint();
        },
        onToggleSelectAll: () => {
          const allSelected = photos.length > 0 && photos.every((photo) => selectedUrls.includes(photo.url));
          selectedUrls = allSelected ? [] : photos.map((photo) => photo.url);
          paint();
        },
        onDeleteSelected: () => {
          void (async () => {
            const confirmed = await this.confirmAction(`\u786E\u5B9A\u5220\u9664\u9009\u4E2D\u7684 ${selectedUrls.length} \u5F20\u7167\u7247\u5417\uFF1F`);
            if (!confirmed)
              return;
            const selected = new Set(selectedUrls);
            await persistPhotos(photos.filter((photo) => !selected.has(photo.url)), "\u7167\u7247\u5DF2\u5220\u9664");
            selectionMode = false;
            selectedUrls = [];
          })();
        },
        onTogglePhoto: (url) => {
          const index = selectedUrls.indexOf(url);
          if (index >= 0)
            selectedUrls.splice(index, 1);
          else
            selectedUrls.push(url);
          paint();
        },
        onDeletePhoto: (photo) => {
          void (async () => {
            const confirmed = await this.confirmAction("\u786E\u5B9A\u5220\u9664\u8FD9\u5F20\u7167\u7247\u5417\uFF1F");
            if (!confirmed)
              return;
            await persistPhotos(photos.filter((item) => item.url !== photo.url), "\u7167\u7247\u5DF2\u5220\u9664");
          })();
        }
      });
    };
    paint();
  }
  openGalleryPageSettings(page, onSave) {
    const modal = new GalleryPageSettingsModal(this.app, page, onSave);
    modal.open();
  }
  async openAlbumEditor(options) {
    let initialDraft;
    let loadedPhotos = [];
    if (!options.isNew && options.slug) {
      try {
        const detail = await this.api.getGalleryAlbum(options.slug);
        const fm = detail.frontmatter || (detail.source ? parseAlbumSource(detail.source).frontmatter : {});
        loadedPhotos = Array.isArray(fm.photos) ? [...fm.photos] : [];
        initialDraft = albumDraftFromFrontmatter(options.slug, fm);
      } catch (error) {
        new import_obsidian11.Notice(error instanceof Error ? error.message : "\u52A0\u8F7D\u76F8\u518C\u5931\u8D25");
        return;
      }
    }
    const modal = new AlbumEditorModal(this.app, {
      isNew: options.isNew,
      initial: initialDraft,
      loadedPhotos,
      existingSlugs: options.albums.map((item) => item.slug),
      onSave: async ({ slug, albumSource }) => {
        await this.api.saveGalleryAlbum(slug, albumSource);
        if (options.isNew) {
          const slugs = normalizeAlbumSlugs(options.albums.map((item) => item.slug));
          if (!slugs.includes(slug)) {
            slugs.push(slug);
            const nextHub = buildHubSource(options.page, slugs, options.hubSource);
            await this.api.saveGalleryHub(nextHub);
          }
          new import_obsidian11.Notice("\u76F8\u518C\u5DF2\u521B\u5EFA");
        } else {
          new import_obsidian11.Notice("\u76F8\u518C\u5DF2\u4FDD\u5B58");
        }
        if (options.onSaved)
          await options.onSaved();
        else
          await this.render();
      },
      onDelete: options.isNew ? void 0 : async () => {
        const confirmed = await this.confirmAction(`\u786E\u5B9A\u5220\u9664\u76F8\u518C\u300C${options.slug}\u300D\u5417\uFF1F\u76F8\u518C\u5185\u7167\u7247\u914D\u7F6E\u4E5F\u5C06\u88AB\u5220\u9664\u3002`);
        if (!confirmed)
          return false;
        if (options.slug)
          await this.api.deleteGalleryAlbum(options.slug);
        new import_obsidian11.Notice("\u76F8\u518C\u5DF2\u5220\u9664");
        await this.render();
        return true;
      }
    });
    modal.open();
  }
};
async function openAdminPanel(app, _api) {
  const { workspace } = app;
  const existing = workspace.getLeavesOfType(ADMIN_VIEW_TYPE);
  if (existing.length) {
    const leaf = existing[0];
    if (leaf.getRoot() !== workspace.rootSplit) {
      focusMainWorkspace(app);
      const mainLeaf = workspace.getLeaf("tab");
      await mainLeaf.setViewState({ type: ADMIN_VIEW_TYPE, active: true });
      workspace.detachLeaf(leaf);
      workspace.revealLeaf(mainLeaf);
      return;
    }
    workspace.revealLeaf(leaf);
    return;
  }
  await openInMainTab(app, ADMIN_VIEW_TYPE);
}

// src/main.ts
function normalizeVaultFolder2(input) {
  return input.trim().replace(/^\/+|\/+$/g, "").replace(/\\/g, "/");
}
var ValaxySyncPlugin = class extends import_obsidian12.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
  }
  async onload() {
    await this.loadSettings();
    this.api = new SiteApi(this, () => this.settings);
    this.uploader = new PostUploader(this.app, this.api, () => this.settings);
    this.downloader = new PostDownloader(this.app, this.api, () => this.settings);
    this.registerView(ADMIN_VIEW_TYPE, (leaf) => new AdminPanelView(leaf, this.api, this.downloader));
    this.addRibbonIcon("layout-dashboard", "Valaxy \u7BA1\u7406\u9762\u677F", () => {
      void openAdminPanel(this.app, this.api);
    });
    this.addRibbonIcon("upload", "\u4E0A\u4F20\u6587\u7AE0\u5230 Valaxy", () => {
      void this.uploadCurrentNote();
    });
    this.addCommand({
      id: "open-admin-panel",
      name: "\u6253\u5F00 Valaxy \u7BA1\u7406\u9762\u677F",
      callback: () => void openAdminPanel(this.app, this.api)
    });
    this.addCommand({
      id: "upload-current-note",
      name: "\u4E0A\u4F20\u5F53\u524D\u6587\u7AE0\u5230 Valaxy",
      callback: () => void this.uploadCurrentNote()
    });
    this.addSettingTab(new ValaxySettingTab(this.app, this));
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(ADMIN_VIEW_TYPE);
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...data,
      postDownloadFolder: normalizeVaultFolder2(
        (data == null ? void 0 : data.postDownloadFolder) || DEFAULT_SETTINGS.postDownloadFolder
      ) || DEFAULT_SETTINGS.postDownloadFolder
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async uploadCurrentNote() {
    if (!this.settings.siteUrl.trim()) {
      new import_obsidian12.Notice("\u8BF7\u5148\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u7AD9\u70B9\u5730\u5740", 6e3);
      return;
    }
    new import_obsidian12.Notice("\u51C6\u5907\u4E0A\u4F20\u2026", 1500);
    try {
      await this.uploader.uploadActiveNote();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new import_obsidian12.Notice(`\u4E0A\u4F20\u5931\u8D25\uFF1A${message}`, 8e3);
    }
  }
};
var ValaxySettingTab = class extends import_obsidian12.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Valaxy \u535A\u5BA2\u540C\u6B65" });
    containerEl.createEl("p", {
      text: "\u914D\u7F6E\u7AD9\u70B9\u5730\u5740\u4E0E\u9274\u6743\u65B9\u5F0F\u3002API \u8DEF\u5F84\u5C06\u6839\u636E\u7AD9\u70B9\u5730\u5740\u81EA\u52A8\u62FC\u63A5\uFF0C\u65E0\u9700\u5199\u6B7B\u57DF\u540D\u3002",
      cls: "setting-item-description"
    });
    new import_obsidian12.Setting(containerEl).setName("\u7AD9\u70B9\u5730\u5740").setDesc("\u4F8B\u5982 https://your-blog.example.com\uFF08\u4E0D\u8981\u672B\u5C3E\u659C\u6760\uFF09").addText((text) => text.setPlaceholder("https://your-blog.example.com").setValue(this.plugin.settings.siteUrl).onChange(async (value) => {
      const next = value.trim();
      if (next !== this.plugin.settings.siteUrl) {
        this.plugin.settings.sessionCookie = "";
        this.plugin.api.resetAuthCache();
      }
      this.plugin.settings.siteUrl = next;
      await this.plugin.saveSettings();
    }));
    new import_obsidian12.Setting(containerEl).setName("\u9274\u6743\u65B9\u5F0F").addDropdown((drop) => drop.addOption("token", "API Token\uFF08\u63A8\u8350\uFF09").addOption("password", "\u8D26\u53F7\u5BC6\u7801").setValue(this.plugin.settings.authMode).onChange(async (value) => {
      this.plugin.settings.authMode = value;
      this.plugin.settings.sessionCookie = "";
      this.plugin.api.resetAuthCache();
      await this.plugin.saveSettings();
      this.display();
    }));
    if (this.plugin.settings.authMode === "token") {
      new import_obsidian12.Setting(containerEl).setName("API Token").setDesc("\u4E0E\u670D\u52A1\u5668\u73AF\u5883\u53D8\u91CF ADMIN_API_TOKEN \u76F8\u540C\uFF1B\u8BF7\u6C42\u5934 Authorization: Bearer \u2026").addText((text) => text.setPlaceholder("your-admin-api-token").setValue(this.plugin.settings.apiToken).onChange(async (value) => {
        this.plugin.settings.apiToken = value;
        this.plugin.api.resetAuthCache();
        await this.plugin.saveSettings();
      }));
    } else {
      new import_obsidian12.Setting(containerEl).setName("\u7BA1\u7406\u5458\u7528\u6237\u540D").addText((text) => text.setValue(this.plugin.settings.username).onChange(async (value) => {
        this.plugin.settings.username = value;
        this.plugin.settings.sessionCookie = "";
        this.plugin.api.resetAuthCache();
        await this.plugin.saveSettings();
      }));
      new import_obsidian12.Setting(containerEl).setName("\u7BA1\u7406\u5458\u5BC6\u7801").addText((text) => text.setPlaceholder("\u5BC6\u7801").setValue(this.plugin.settings.password).onChange(async (value) => {
        this.plugin.settings.password = value;
        this.plugin.settings.sessionCookie = "";
        this.plugin.api.resetAuthCache();
        await this.plugin.saveSettings();
      }));
    }
    new import_obsidian12.Setting(containerEl).setName("\u53D1\u5E03\u94FE\u63A5\u5B57\u6BB5\u540D").setDesc("\u4E0A\u4F20\u6210\u529F\u540E\u5199\u5165 frontmatter \u7684\u5B57\u6BB5\uFF0C\u9ED8\u8BA4 published_url").addText((text) => text.setValue(this.plugin.settings.publishedUrlKey).onChange(async (value) => {
      this.plugin.settings.publishedUrlKey = value.trim() || "published_url";
      await this.plugin.saveSettings();
    }));
    new import_obsidian12.Setting(containerEl).setName("\u6587\u7AE0\u4E0B\u8F7D\u76EE\u5F55").setDesc("\u7BA1\u7406\u9762\u677F\u70B9\u51FB\u300C\u7F16\u8F91\u300D\u65F6\uFF0C\u6587\u7AE0\u4E0B\u8F7D\u5230\u6B64\u76EE\u5F55\u5E76\u5728 Obsidian \u4E2D\u6253\u5F00\u3002\u76F8\u5BF9 vault \u6839\u76EE\u5F55\uFF0C\u4F8B\u5982 Valaxy/Posts").addText((text) => text.setPlaceholder("Valaxy/Posts").setValue(this.plugin.settings.postDownloadFolder).onChange(async (value) => {
      this.plugin.settings.postDownloadFolder = value.trim().replace(/^\/+|\/+$/g, "").replace(/\\/g, "/");
      await this.plugin.saveSettings();
    }));
    new import_obsidian12.Setting(containerEl).setName("\u6D4B\u8BD5\u8FDE\u63A5").setDesc("\u9A8C\u8BC1\u7AD9\u70B9\u5730\u5740\u4E0E\u9274\u6743\u662F\u5426\u53EF\u7528").addButton((btn) => btn.setButtonText("\u6D4B\u8BD5").setCta().onClick(async () => {
      try {
        await this.plugin.api.testConnection();
        new import_obsidian12.Notice("\u8FDE\u63A5\u6210\u529F");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        new import_obsidian12.Notice(`\u8FDE\u63A5\u5931\u8D25\uFF1A${message}`, 8e3);
      }
    }));
  }
};
