-- 公告栏：把原本写在 valaxy.config.ts 里的轮播间隔与 Markdown 开关移到数据表
ALTER TABLE notice_board ADD COLUMN rotate_interval INTEGER NOT NULL DEFAULT 5000;
ALTER TABLE notice_board ADD COLUMN allow_markdown INTEGER NOT NULL DEFAULT 0;
