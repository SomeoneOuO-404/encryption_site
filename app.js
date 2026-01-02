// ================== 元素綁定 ==================
const methodSelect = document.getElementById('methodSelect');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const keyField = document.getElementById('keyField');
const secretKeyInput = document.getElementById('secretKey');
const caesarShift = document.getElementById('caesarShift');
const shiftValueInput = document.getElementById('shiftValue');

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
    const shift = parseInt(shiftValueInput.value);
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
                result = chachaOperation(input, operationType, key);
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

// ================== ChaCha20 ==================
function chachaOperation(input, operationType, key) {
    // 96-bit nonce（教學用，實務請隨機）
    const nonce = CryptoJS.enc.Hex.parse("000000000000000000000000");

    if (operationType === 'encrypt') {
        const encrypted = CryptoJS.ChaCha20.encrypt(
            input,
            CryptoJS.enc.Utf8.parse(key),
            { iv: nonce }
        );
        return encrypted.toString(); // Base64
    } else {
        const decrypted = CryptoJS.ChaCha20.decrypt(
            input,
            CryptoJS.enc.Utf8.parse(key),
            { iv: nonce }
        );
        const text = decrypted.toString(CryptoJS.enc.Utf8);
        if (!text) throw new Error('ChaCha20 解密失敗（密鑰錯誤或密文損毀）');
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

// ================== AES ==================
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
    return operationType === 'encrypt'
        ? btoa(unescape(encodeURIComponent(result)))
        : decodeURIComponent(escape(atob(result)));
}
