# Encryption Site

      將文字透過不同的加密演算法，轉換成安全或可讀的形式。

___
# 小組成員
      B11200033江智瑞
      B11200037陳明聰
      B11217036李冠億
___
# 這是什麼？

      Encryption Site 是一個基於 **FastAPI** 的加解密展示系統。  

      系統會根據你選擇的加密方式，將輸入文字進行加密或解密處理。

      你可以提供任意文字與必要的參數（例如位移或密鑰），  

      系統會即時回傳對應的轉換結果。  

---
# 一、系統功能
      本系統支援以下 5 種加解密方式：

## Atbash Cipher（鏡像替換）
      將英文字母做鏡像映射：A ↔ Z、B ↔ Y …

      特性：加密與解密為相同操作，再執行一次即可還原原文。

## Caesar Cipher（凱薩位移）

      將字母依照位移量 shift 進行平移。

      例：shift = 3，HELLO → KHOOR

      特性：解密等同於以相反方向位移。

## Substitution Cipher（單表替換）

      使用固定替換表將字母替換為另一字母。

      限制：目前僅支援英文大寫 A–Z。

## AES Symmetric Encryption（AES 對稱式加密 / 解密）

      使用對稱式金鑰進行加密與解密。

      特性：必須使用相同的密鑰（key）才能正確解密。

      本系統使用 Fernet 格式進行實作。

## XOR Cipher（異或加密 / 解密）

    將文字與密鑰逐字元進行 XOR 運算。

    特性：加密與解密為相同運算流程，使用相同 key 即可還原。

___
# 二、API 使用方式
    系統提供單一 API 端點進行所有加解密操作：

    POST /crypto
___
## 三、請求參數說明（JSON）

      | 欄位名稱 | 說明 |
      |---------|------|
      | method | 加密方法（atbash / caesar / substitution / aes / xor） |
      | action | encrypt（加密）或 decrypt（解密） |
      | text | 欲處理的文字 |
      | shift | 凱薩加密位移量（僅 Caesar 使用） |
      |  key | 密鑰（AES、XOR 必填） |

___
# 四、操作範例
    範例 1：Caesar 加密
    {
        "method": "caesar",
        "action": "encrypt",
        "text": "HELLO",
        "shift": 3
    }
    回傳結果：
    {
        "result": "KHOOR"
    }