// ================== 元素綁定 ==================
const methodSelect = document.getElementById('methodSelect');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const keyField = document.getElementById('keyField');
const secretKeyInput = document.getElementById('secretKey');
const caesarShift = document.getElementById('caesarShift');
const shiftValueInput = document.getElementById('shiftValue');

// ================== RSA 金鑰 ==================
let rsaKeyPair = null;

// 產生 RSA 金鑰（頁面載入一次）
async function generateRSAKeyPair() {
    rsaKeyPair = await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );
}
generateRSAKeyPair();

// ================== UI 控制 ==================
methodSelect.addEventListener('change', function () {
    const method = this.value;

    keyField.style.display = 'none';
    caesarShift.style.display = 'none';

    if (method === 'aes' || method === 'xor' || method === 'substitution') {
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
    const shift = parseInt(shiftValueInput.value);
    let result = '';

    if (!input) {
        alert('請輸入要處理的文字！');
        return;
    }

    try {
        switch (method) {
            case 'rsa':
                result = await rsaOperation(input, operationType);
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

// ================== RSA 加解密 ==================
async function rsaOperation(input, operationType) {
    if (!rsaKeyPair) {
        throw new Error('RSA 金鑰尚未就緒');
    }

    if (operationType === 'encrypt') {
        const encoded = new TextEncoder().encode(input);

        const encrypted = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            rsaKeyPair.publicKey,
            encoded
        );

        // ArrayBuffer → Base64（僅作顯示用途）
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } else {
        const encryptedBytes = Uint8Array.from(
            atob(input),
            c => c.charCodeAt(0)
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            rsaKeyPair.privateKey,
            encryptedBytes
        );

        return new TextDecoder().decode(decrypted);
    }
}

// ================== 其他原有功能（未動） ==================

// 凱撒密碼
function caesarOperation(input, operationType, shift) {
    const s = operationType === 'encrypt' ? shift : -shift;
    return input.toUpperCase().replace(/[A-Z]/g, c =>
        String.fromCharCode((c.charCodeAt(0) - 65 + s + 26) % 26 + 65)
    );
}

// 單表置換
function substitutionOperation(input, operationType, key) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const subKey = key.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 26);

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

// AES
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

// XOR
function xorOperation(input, operationType, key) {
    let result = '';
    for (let i = 0; i < input.length; i++) {
        result += String.fromCharCode(
            input.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    return operationType === 'encrypt'
        ? btoa(unescape(encodeURIComponent(result)))
        : decodeURIComponent(escape(atob(result)));
}
