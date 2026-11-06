# My Portfolio Universe

以原生 JavaScript ES Modules + Three.js 建立的 3D 互動星球作品集。

## 功能
- 暗黑星空宇宙，無日夜模式
- 中央 My Portfolio 核心星球 + 五大主題星球
- 滑鼠拖曳旋轉、滾輪縮放、點擊星球聚焦
- 星球作品清單、名稱搜尋、年份篩選
- 點擊作品顯示 ID、年份、標籤、圖片數量及原始連結
- 響應式 UI

## 執行方式

本專案使用 ES Modules，請透過本機 HTTP Server 開啟，不要直接雙擊 index.html。

### VS Code
1. 使用 VS Code 開啟專案資料夾。
2. 安裝 Live Server 擴充功能。
3. 在 `index.html` 按右鍵，選擇 **Open with Live Server**。

### Python
在專案根目錄執行：

```bash
python -m http.server 8000
```

瀏覽器開啟 `http://localhost:8000`。

Three.js 透過 jsDelivr CDN 載入，因此執行時需要網路連線。

## 作品資料
- `js/data.js` 是由使用者提供的 `webData.js` 轉換而來。
- 原始欄位 `id`, `name`, `year`, `linkHref`, `photoNum`, `tag` 均保留。
- 新增 `planet` 欄位作為主要星球分類。
- 五大分類筆數：生涯探索 38、華語學習 16、閱讀素養 19、學習診斷 15、研究學術 26，共 114 筆。

## 圖片注意事項
目前提供的 `webData.js` 只有 `photoNum`，沒有實際圖片路徑。因此此版本不會猜測或虛構圖片 URL；作品詳細視窗先顯示資料。取得原始作品圖片資料夾結構後，再將圖片路徑加入資料並建立作品縮圖。

## 分類說明
作品以目前確認的五大主題作為單一主要分類。若某作品的實際內容與名稱不一致，可在 `js/data.js` 修改該筆 `planet` 值。


## 加入生涯探索島 GLB 模型
1. 先使用 Blender 執行 `career_island_generator.py`，產生 `career_exploration_island.glb`。
2. 將 GLB 複製到本網站的 `models` 資料夾。
3. 檔名請保持 `career_exploration_island.glb`，不要改名。
4. 使用 Live Server 或 `python -m http.server 8000` 啟動網站，再開啟 `http://localhost:8000`。
5. 載入成功時，生涯探索島會自動以 GLB 模型取代原本的程序化示意島；其他四顆星球與作品互動維持原樣。

若 GLB 尚未放入 `models`，網站會先顯示原本的程序化示意島，不會因此整個網站無法啟動。
