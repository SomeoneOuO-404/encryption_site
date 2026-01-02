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
    <h2>FastAPI 五種加解密系統</h2>
    <p>請前往 <a href="/docs">/docs</a> 進行測試</p>
    """