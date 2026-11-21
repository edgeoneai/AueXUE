-- 文章加入系列：保存文章所属系列名，供前台「系列页」聚合
ALTER TABLE posts ADD COLUMN series TEXT;
CREATE INDEX IF NOT EXISTS idx_posts_series ON posts(series);
