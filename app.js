// ================== 元素綁定 ==================
const methodSelect = document.getElementById('methodSelect');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const keyField = document.getElementById('keyField');

// 如果你的 HTML 是 <input id="secretKeyInput"> 用這行
const secretKeyInput = document.getElementById('secretKeyInput');
// 如果你的 HTML 是 <input id="secretKey"> 就改成：
// const secretKeyInput = document.getElementById('secretKey');

const caesarShift = document.getElementById('caesarShift');
const shiftValueInput = document.getElementById('shiftValue');

// ================== UI 控制 ==================
methodSelect.addEventListener('change', function () {
    const method = this.value;

    keyField.style.display = 'none';
    caesarShift.style.display = 'none';

    // 需要 key 的方法
    if (method === 'aes' || method === 'xor' || method === 'substitution' || method === 'blowfish') {
        keyField.style.display = 'block';
    } else if (method === 'caesar') {
        caesarShift.style.display = 'block';
    }
});
methodSelect.dispatchEvent(new Event('change'));

// ================== 核心執行 ==================
function executeOperation(operationType) {
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
            case 'blowfish':
                if (!key) {
                    alert('請輸入 Blowfish 密鑰！');
                    return;
                }
                result = blowfishOperation(input, operationType, key);
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

// ================== Blowfish（CryptoJS）==================
function blowfishOperation(input, operationType, key) {
    if (operationType === 'encrypt') {
        // 輸出為 Base64 字串（CryptoJS 預設）
        return CryptoJS.Blowfish.encrypt(input, key).toString();
    } else {
        const bytes = CryptoJS.Blowfish.decrypt(input, key);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        if (!text) throw new Error('Blowfish 解密失敗（密鑰錯誤或密文損壞）');
        return text;
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

// ================== XOR（修正版） ==================
function xorOperation(input, operationType, key) {
    if (operationType === 'encrypt') {
        // 明文 XOR 後 → Base64
        let out = '';
        for (let i = 0; i < input.length; i++) {
            out += String.fromCharCode(
                input.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return btoa(unescape(encodeURIComponent(out)));
    } else {
        // 先 Base64 解碼回 XOR 結果，再 XOR 還原
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
