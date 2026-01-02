// ================== 元素綁定 ==================
const methodSelect = document.getElementById('methodSelect');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const keyField = document.getElementById('keyField');

// ⚠️ 這裡請確認你的 HTML input id 是哪個：
// 如果你的 HTML 是 <input id="secretKeyInput"> 用這行
const secretKeyInput = document.getElementById('secretKeyInput');
// 如果你的 HTML 是 <input id="secretKey"> 就改成：
// const secretKeyInput = document.getElementById('secretKey');

const caesarShift = document.getElementById('caesarShift');
const shiftValueInput = document.getElementById('shiftValue');

// ================== libsodium 初始化 ==================
let sodiumReady = false;
(async () => {
  await sodium.ready;
  sodiumReady = true;
})();

// ================== UI 控制 ==================
methodSelect.addEventListener('change', function () {
    const method = this.value;

    keyField.style.display = 'none';
    caesarShift.style.display = 'none';

    if (method === 'aes' || method === 'xor' || method === 'substitution' || method === 'chacha') {
        keyField.style.display = 'block';
    } else if (method === 'caesar') {
        caesarShift.style.display = 'block';
    }
});
methodSelect.dispatchEvent(new Event('change'));

// ================== 核心執行 ==================
async function executeOperation(operationType) {
    const method = methodSelect.value;
    const input = inputText.value;
    const key = secretKeyInput.value;
    const shift = parseInt(shiftValueInput.value, 10);
    let result = '';

    if (!input) {
        alert('請輸入要處理的文字！');
        return;
    }

    try {
        switch (method) {
            case 'chacha':
                if (!key) {
                    alert('請輸入 ChaCha20 密鑰！');
                    return;
                }
                result = await chachaOperation(input, operationType, key);
                break;

            case 'caesar':
                if (isNaN(shift)) {
                    alert('請輸入有效的凱撒位移量！');
                    return;
                }
                result = caesarOperation(input, operationType, shift);
                break;

            case 'substitution':
                result = substitutionOperation(input, operationType, key);
                break;

            case 'aes':
                if (!key) {
                    alert('請輸入 AES 密鑰！');
                    return;
                }
                result = aesOperation(input, operationType, key);
                break;

            case 'xor':
                if (!key) {
                    alert('請輸入 XOR 密鑰！');
                    return;
                }
                result = xorOperation(input, operationType, key);
                break;

            default:
                result = '未知的操作方法';
        }
    } catch (err) {
        console.error(err);
        result = '執行失敗：' + err.message;
    }

    outputText.value = result;
}

// ================== 真正 ChaCha20-Poly1305（libsodium） ==================
// 這裡使用 XChaCha20-Poly1305-IETF（nonce 24 bytes），比 12 bytes nonce 更安全/更好用
// 加密輸出：base64(nonce || ciphertext)
async function chachaOperation(input, operationType, keyStr) {
    if (!sodiumReady) throw new Error('libsodium 尚未載入完成，請稍等 1 秒再試');

    const sodium = window.sodium;

    // 把使用者輸入的 key 字串 -> 固定 32 bytes key
    // 這樣你不用要求使用者一定輸入 32 bytes
    const key = sodium.crypto_generichash(32, sodium.from_string(keyStr));

    if (operationType === 'encrypt') {
        const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES); // 24 bytes
        const msg = sodium.from_string(input);

        const cipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
            msg,
            null,      // additional data (AAD) 可不用
            null,      // nsec 不用
            nonce,
            key
        );

        // 合併 nonce + cipher，方便一次貼上/儲存
        const packed = new Uint8Array(nonce.length + cipher.length);
        packed.set(nonce, 0);
        packed.set(cipher, nonce.length);

        return sodium.to_base64(packed, sodium.base64_variants.ORIGINAL);
    } else {
        // 解密：把 base64 轉回 packed，再切 nonce/cipher
        const packed = sodium.from_base64(input, sodium.base64_variants.ORIGINAL);

        const nlen = sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES; // 24
        if (packed.length <= nlen) throw new Error('密文格式錯誤（太短）');

        const nonce = packed.slice(0, nlen);
        const cipher = packed.slice(nlen);

        let plain;
        try {
            plain = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
                null,  // nsec 不用
                cipher,
                null,  // AAD
                nonce,
                key
            );
        } catch {
            throw new Error('ChaCha20 解密失敗（密鑰錯誤或密文被改）');
        }

        return sodium.to_string(plain);
    }
}

// ================== 凱撒密碼 ==================
function caesarOperation(input, operationType, shift) {
    const s = operationType === 'encrypt' ? shift : -shift;
    return input.toUpperCase().replace(/[A-Z]/g, c =>
        String.fromCharCode((c.charCodeAt(0) - 65 + s + 26) % 26 + 65)
    );
}

// ================== 單表置換 ==================
function substitutionOperation(input, operationType, key) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const subKey = (key || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 26);

    if (subKey.length < 26) {
        throw new Error('單表置換密鑰需 26 個字母');
    }

    let mapA = alphabet;
    let mapB = subKey;

    if (operationType === 'decrypt') {
        [mapA, mapB] = [mapB, mapA];
    }

    return input.toUpperCase().split('').map(c => {
        const i = mapA.indexOf(c);
        return i === -1 ? c : mapB[i];
    }).join('');
}

// ================== AES（CryptoJS） ==================
function aesOperation(input, operationType, key) {
    if (operationType === 'encrypt') {
        return CryptoJS.AES.encrypt(input, key).toString();
    } else {
        const bytes = CryptoJS.AES.decrypt(input, key);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        if (!text) throw new Error('AES 解密失敗');
        return text;
    }
}

// ================== XOR ==================
function xorOperation(input, operationType, key) {
    let result = '';
    for (let i = 0; i < input.length; i++) {
        result += String.fromCharCode(
            input.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }

    if (operationType === 'encrypt') {
        return btoa(unescape(encodeURIComponent(result)));
    } else {
        // input 是 base64 字串，先 decode 成 XOR 的結果，再回傳文字
        const decoded = decodeURIComponent(escape(atob(input)));
        let plain = '';
        for (let i = 0; i < decoded.length; i++) {
            plain += String.fromCharCode(
                decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return plain;
    }
}
