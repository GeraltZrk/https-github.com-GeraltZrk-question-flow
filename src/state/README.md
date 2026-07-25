# Client state lane

技术 B 在这里加入：

- `reducer.ts`：三步状态和 Resolution
- `cache.ts`：图片哈希 + OCR / prompt / schema 版本缓存

缓存命中必须显示 `CACHED LIVE AI`，不能伪装成新的实时调用。
