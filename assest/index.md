# FastAPI 五種加解密系統

本專案使用 **FastAPI** 建立一個提供 **五種加密 / 解密** 的 API 服務，並透過內建的 **Swagger UI** 進行操作測試。  
首頁提供系統介紹與操作指引；實際功能測試請前往：**/docs**。

---

## 一、系統功能

本系統支援以下 5 種加解密方式：

1. **Atbash Cipher（鏡像替換）**  
   將英文字母做鏡像映射：A ↔ Z、B ↔ Y …  
   **特性**：加密與解密為相同操作，再執行一次即可還原原文。

2. **Caesar Cipher（凱薩位移）**  
   將字母依照位移量 `shift` 進行平移。  
   例：`shift = 3`，HELLO → KHOOR  
   **特性**：解密等同於以相反方向位移。

3. **Substitution Cipher（單表替換）**  
   使用固定替換表將字母替換為另一字母。  
   **限制**：目前僅支援英文大寫 A–Z。

4. **AES Symmetric Encryption（AES 對稱式加密 / 解密）**  
   使用對稱式金鑰進行加密與解密。  
   **特性**：必須使用相同的密鑰（key）才能正確解密。  
   本系統使用 Fernet 格式進行實作。

5. **XOR Cipher（異或加密 / 解密）**  
   將文字與密鑰逐字元進行 XOR 運算。  
   **特性**：加密與解密為相同運算流程，使用相同 key 即可還原。

---

## 二、API 使用方式

### 主要 API

- **POST `/crypto`**  
  用於所有加密與解密操作。

---

## 三、請求參數說明（JSON）

| 欄位名稱 | 說明 |
|--------|------|
| method | 加密方法（atbash / caesar / substitution / aes / xor） |
| action | encrypt 或 decrypt |
| text | 欲處理的文字 |
| shift | 凱薩加密位移量（僅 Caesar 使用） |
| key | 密鑰（AES、XOR 必填） |

---

## 四、操作範例

### 範例 1：Caesar 加密

```json
{
  "method": "caesar",
  "action": "encrypt",
  "text": "HELLO",
  "shift": 3
}
