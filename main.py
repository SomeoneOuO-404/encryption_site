from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from modifiers import (
    atbash,
    caesar,
    substitution,
    aes_encrypt,
    aes_decrypt,
    xor_encrypt,
    xor_decrypt
)

app = FastAPI(title="五種加解密系統")

class CryptoRequest(BaseModel):
    method: str
    action: str
    text: str
    key: str | None = None
    shift: int | None = None


@app.post("/crypto")
def crypto(req: CryptoRequest):
    if req.method == "atbash":
        return {"result": atbash(req.text)}

    if req.method == "caesar":
        shift = req.shift if req.action == "encrypt" else -req.shift
        return {"result": caesar(req.text, shift)}

    if req.method == "substitution":
        return {"result": substitution(req.text)}

    if req.method == "aes":
        if not req.key:
            return {"error": "AES 需要密鑰"}
        return {
            "result": aes_encrypt(req.text, req.key)
            if req.action == "encrypt"
            else aes_decrypt(req.text, req.key)
        }

    if req.method == "xor":
        if not req.key:
            return {"error": "XOR 需要密鑰"}
        return {
            "result": xor_encrypt(req.text, req.key)
            if req.action == "encrypt"
            else xor_decrypt(req.text, req.key)
        }

    return {"error": "未知加密方式"}


@app.get("/", response_class=HTMLResponse)
def home():
    return """
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <title>FastAPI 五種加解密系統</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                             Roboto, "Noto Sans TC", Arial, sans-serif;
                max-width: 900px;
                margin: 40px auto;
                line-height: 1.7;
                color: #222;
            }
            h1, h2, h3 {
                color: #2c3e50;
            }
            code {
                background: #f4f4f4;
                padding: 2px 6px;
                border-radius: 4px;
            }
            pre {
                background: #f4f4f4;
                padding: 12px;
                border-radius: 6px;
                overflow-x: auto;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
            }
            th, td {
                border: 1px solid #ccc;
                padding: 8px 10px;
                text-align: left;
            }
            th {
                background: #f0f0f0;
            }
            .hint {
                background: #eef6ff;
                padding: 12px;
                border-left: 4px solid #3b82f6;
                margin: 20px 0;
            }
        </style>
    </head>

    <body>
        <h1>FastAPI 五種加解密系統</h1>

        <p>
            本專案使用 <strong>FastAPI</strong> 建立一個提供
            <strong>五種加密 / 解密</strong> 的 API 服務，
            並透過內建的 <strong>Swagger UI</strong> 進行操作測試。
        </p>

        <div class="hint">
            👉 實際功能測試請前往：
            <a href="/docs"><strong>/docs</strong></a>
        </div>

        <hr>

        <h2>一、系統功能</h2>

        <p>本系統支援以下 5 種加解密方式：</p>

        <ol>
            <li>
                <strong>Atbash Cipher（鏡像替換）</strong><br>
                將英文字母做鏡像映射：A ↔ Z、B ↔ Y …<br>
                <strong>特性：</strong>加密與解密為相同操作，再執行一次即可還原原文。
            </li>

            <li>
                <strong>Caesar Cipher（凱薩位移）</strong><br>
                將字母依照位移量 <code>shift</code> 進行平移。<br>
                例：<code>shift = 3</code>，HELLO → KHOOR<br>
                <strong>特性：</strong>解密等同於以相反方向位移。
            </li>

            <li>
                <strong>Substitution Cipher（單表替換）</strong><br>
                使用固定替換表將字母替換為另一字母。<br>
                <strong>限制：</strong>目前僅支援英文大寫 A–Z。
            </li>

            <li>
                <strong>AES Symmetric Encryption（AES 對稱式加密 / 解密）</strong><br>
                使用對稱式金鑰進行加密與解密。<br>
                <strong>特性：</strong>必須使用相同的密鑰（key）才能正確解密。<br>
                本系統使用 Fernet 格式進行實作。
            </li>

            <li>
                <strong>XOR Cipher（異或加密 / 解密）</strong><br>
                將文字與密鑰逐字元進行 XOR 運算。<br>
                <strong>特性：</strong>加密與解密為相同運算流程，使用相同 key 即可還原。
            </li>
        </ol>

        <hr>

        <h2>二、API 使用方式</h2>

        <p>
            系統提供單一 API 端點進行所有加解密操作：
        </p>

        <ul>
            <li><strong>POST <code>/crypto</code></strong></li>
        </ul>

        <hr>

        <h2>三、請求參數說明（JSON）</h2>

        <table>
            <tr>
                <th>欄位名稱</th>
                <th>說明</th>
            </tr>
            <tr>
                <td>method</td>
                <td>加密方法（atbash / caesar / substitution / aes / xor）</td>
            </tr>
            <tr>
                <td>action</td>
                <td>encrypt 或 decrypt</td>
            </tr>
            <tr>
                <td>text</td>
                <td>欲處理的文字</td>
            </tr>
            <tr>
                <td>shift</td>
                <td>凱薩加密位移量（僅 Caesar 使用）</td>
            </tr>
            <tr>
                <td>key</td>
                <td>密鑰（AES、XOR 必填）</td>
            </tr>
        </table>

        <hr>

        <h2>四、操作範例</h2>

        <h3>範例 1：Caesar 加密</h3>

        <pre><code>{
  "method": "caesar",
  "action": "encrypt",
  "text": "HELLO",
  "shift": 3
}</code></pre>

        <p>回傳結果：</p>

        <pre><code>{
  "result": "KHOOR"
}</code></pre>

    </body>
    </html>
    """
