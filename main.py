from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from pathlib import Path
import markdown

from modifiers import (
    atbash,
    caesar,
    substitution,
    aes_encrypt,
    aes_decrypt,
    xor_encrypt,
    xor_decrypt
)

# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(title="五種加解密系統")

# ============================================================
# Pydantic Model
# ============================================================

class CryptoRequest(BaseModel):
    method: str = Field(
        description="加密方式：atbash / caesar / substitution / aes / xor",
        example="caesar"
    )
    action: str = Field(
        description="操作模式：encrypt 或 decrypt",
        example="encrypt"
    )
    text: str = Field(
        description="要進行加密或解密的文字內容",
        example="HELLO"
    )
    key: str | None = Field(
        default=None,
        description="密鑰（AES 與 XOR 必填）",
        example="my-secret-key"
    )
    shift: int | None = Field(
        default=None,
        description="位移量（僅 Caesar Cipher 使用）",
        example=3
    )

# ============================================================
# Markdown 首頁載入
# ============================================================

def load_index_html() -> str:
    md_file = Path("assets/index.md")
    md_content = md_file.read_text(encoding="utf-8")

    return f"""
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <title>FastAPI 五種加解密系統</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                             Roboto, "Noto Sans TC", Arial, sans-serif;
                max-width: 900px;
                margin: 40px auto;
                line-height: 1.8;
                color: #222;
            }}

            h1, h2, h3 {{
                color: #2c3e50;
                margin-top: 1.5em;
            }}

            hr {{
                border: none;
                border-top: 1px solid #ddd;
                margin: 2em 0;
            }}

            blockquote {{
                background: #eef6ff;
                border-left: 4px solid #3b82f6;
                margin: 1.5em 0;
                padding: 0.8em 1em;
                color: #333;
            }}

            code {{
                background: #f4f4f4;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.95em;
            }}

            pre {{
                background: #f4f4f4;
                padding: 14px;
                border-radius: 6px;
                overflow-x: auto;
                line-height: 1.5;
            }}

            pre code {{
                background: none;
                padding: 0;
            }}

            ul, ol {{
                margin-left: 1.5em;
            }}

            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 1.5em 0;
            }}

            th, td {{
                border: 1px solid #ccc;
                padding: 8px 12px;
                text-align: left;
            }}

            th {{
                background: #f0f0f0;
            }}
        </style>
    </head>
    <body>
        {markdown.markdown(md_content, extensions=["extra", "codehilite"])}
    </body>
    </html>
    """


# ============================================================
# Routes
# ============================================================

@app.get("/", response_class=HTMLResponse)
def home():
    return load_index_html()


@app.post("/crypto")
def crypto(req: CryptoRequest):
    method = req.method.lower()
    action = req.action.lower()

    # 1. Atbash
    if method == "atbash":
        return {"result": atbash(req.text)}

    # 2. Caesar
    if method == "caesar":
        if req.shift is None:
            return {"error": "Caesar Cipher 需要 shift 參數"}
        shift = req.shift if action == "encrypt" else -req.shift
        return {"result": caesar(req.text, shift)}

    # 3. Substitution
    if method == "substitution":
        if action not in ("encrypt", "decrypt"):
            return {"error": "Substitution 需要 encrypt 或 decrypt"}
        return {"result": substitution(req.text, action)}

    # 4. AES
    if method == "aes":
        if not req.key:
            return {"error": "AES 需要密鑰"}
        return {
            "result": aes_encrypt(req.text, req.key)
            if action == "encrypt"
            else aes_decrypt(req.text, req.key)
        }

    # 5. XOR
    if method == "xor":
        if not req.key:
            return {"error": "XOR 需要密鑰"}
        return {
            "result": xor_encrypt(req.text, req.key)
            if action == "encrypt"
            else xor_decrypt(req.text, req.key)
        }

    return {"error": "未知加密方式"}


# 啟動點


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
