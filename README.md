# Node.js PDF and AWS WorkDocs Integration

## 簡介
這是一個基於 Node.js的 AWS Lambda 函數範例，該函數用於生成 PDF 文件並將其上傳至 AWS WorkDocs。用戶可以通過發送 HTTP 請求並提供必要的參數，得到一個包含調查結果的 PDF 文件。

## 功能
- 接收查詢參數，解密調查數據。
- 生成一個包含題目和答案的 PDF 文件。
- 將生成的 PDF 文件上傳至 AWS WorkDocs。
- 提供用戶查看的 PDF 文件。

## 安裝與使用方式

### 環境設定
1. 確保已安裝 Node.js 和 npm。
2. 下載或克隆此專案至本地機器。

### 安裝依賴
在專案根目錄下執行以下命令來安裝必要的依賴：
```bash
npm install
```

### 設定 AWS 認證
在程式碼中，輸入 AWS IAM 的 `accessKeyId` 和 `secretAccessKey`，以及相應的 `region` 設定。

### 使用 Lambda 部署
將整個專案上傳至 AWS Lambda，並設定觸發器以接收 HTTP 請求。

### 發送請求
發送 HTTP GET 請求至你的 Lambda 函數 URL，並包含以下查詢參數：
- `svid` - 調查 ID
- `hash` - 調查的哈希值
- `img` - 簽名圖像的 URL 編碼字符串

成功請求之後，將收到包含 PDF 文件的響應。

## 必要的依賴模組清單
- `pdfkit-table` - 用於生成 PDF 表格
- `aws-sdk` - AWS SDK 用於與 AWS 服務交互
- `got` - 用於 http 請求
- `node-fetch` - 用於發送 fetch 請求
- `get-stream` - 用於將流轉換為 Buffer

```json
{
  "dependencies": {
    "pdfkit-table": "^VERSION",
    "aws-sdk": "^VERSION",
    "got": "^VERSION",
    "node-fetch": "^VERSION",
    "get-stream": "^VERSION"
  }
}
```

> 注意：請根據實際安裝的版本替換 `^VERSION`。

## 授權條款
本專案遵循 MIT 授權條款。請參閱 [LICENSE](LICENSE) 文件以獲取詳情。