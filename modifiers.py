import base64
import string
import hashlib
from cryptography.fernet import Fernet
from vars import SUBSTITUTION_TABLE


# =========================
# 1. Atbash Cipher
# =========================
def atbash(text: str) -> str:
    result = ""
    for c in text:
        if c.isupper():
            result += chr(ord('Z') - (ord(c) - ord('A')))
        elif c.islower():
            result += chr(ord('z') - (ord(c) - ord('a')))
        else:
            result += c
    return result


# =========================
# 2. Caesar Cipher
# =========================
def caesar(text: str, shift: int) -> str:
    result = ""
    for c in text:
        if c.isupper():
            result += chr((ord(c) - 65 + shift) % 26 + 65)
        elif c.islower():
            result += chr((ord(c) - 97 + shift) % 26 + 97)
        else:
            result += c
    return result


# =========================
# 3. Substitution Cipher（僅加密）
# =========================
def substitution(text: str) -> str:
    """
    單表替換（Substitution Cipher）：
    - 本專案採用固定替換表 SUBSTITUTION_TABLE
    - 不提供反向解密（decrypt）
    - 僅支援英文大寫 A-Z
    """
    result = ""
    for c in text:
        if c in string.ascii_uppercase:
            result += SUBSTITUTION_TABLE[ord(c) - ord('A')]
        else:
            result += c
    return result


# =========================
# 4. AES (Fernet)
# =========================
def _derive_key(key: str) -> bytes:
    """
    將使用者輸入的 key 轉成 Fernet 合法金鑰
    """
    digest = hashlib.sha256(key.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def aes_encrypt(text: str, key: str) -> str:
    fernet_key = _derive_key(key)
    f = Fernet(fernet_key)
    return f.encrypt(text.encode()).decode()


def aes_decrypt(text: str, key: str) -> str:
    fernet_key = _derive_key(key)
    f = Fernet(fernet_key)
    return f.decrypt(text.encode()).decode()


# =========================
# 5. XOR Cipher
# =========================
def xor_encrypt(text: str, key: str) -> str:
    raw = bytes([
        ord(text[i]) ^ ord(key[i % len(key)])
        for i in range(len(text))
    ])
    return base64.b64encode(raw).decode()


def xor_decrypt(text: str, key: str) -> str:
    raw = base64.b64decode(text)
    out = bytes([
        raw[i] ^ ord(key[i % len(key)])
        for i in range(len(raw))
    ])
    return out.decode()
