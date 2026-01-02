// 綁定元素
const methodSelect = document.getElementById('methodSelect');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const keyField = document.getElementById('keyField');
const secretKeyInput = document.getElementById('secretKey');
const caesarShift = document.getElementById('caesarShift');
const shiftValueInput = document.getElementById('shiftValue');

// --- 事件監聽器：控制顯示/隱藏 ---
methodSelect.addEventListener('change', function() {
    const selectedMethod = this.value;
    
    // 預設全部隱藏 (Atbash 不需要任何密鑰或位移，所以包含在這裡)
    keyField.style.display = 'none';
    caesarShift.style.display = 'none';
    
    // 根據選擇的方法顯示對應欄位
    if (selectedMethod === 'aes' || selectedMethod === 'xor' || selectedMethod === 'substitution') {
        keyField.style.display = 'block';
    } else if (selectedMethod === 'caesar') {
        caesarShift.style.display = 'block';
    }
    // 注意：selectedMethod === 'atbash' 會走預設隱藏邏輯，這是正確的
});

// 手動觸發一次 change 事件，確保初始狀態正確
methodSelect.dispatchEvent(new Event('change'));


// --- 核心執行函數 ---
function executeOperation(operationType) {
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
            case 'atbash': // --- 修改點：原本是 base64 ---
                // Atbash 加密與解密過程完全一樣，所以不需要判斷 operationType
                result = atbashOperation(input);
                break;
                
            case 'caesar':
                if (isNaN(shift)) {
                    alert('請輸入有效的凱撒密碼位移量！');
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
                result = '未知的操作方法。';
        }
    } catch (error) {
        result = '執行失敗，請檢查輸入或密鑰是否正確。錯誤: ' + error.message;
        console.error(error);
    }
    
    outputText.value = result;
}


// --- 5 種操作方法的實現 ---

// 1. 埃特巴什碼 (Atbash Cipher) - --- 新增函數 ---
function atbashOperation(input) {
    // 邏輯：A <-> Z, B <-> Y (鏡像對映)
    // 公式：新字元代碼 = (Z的代碼) - (原字元代碼 - A的代碼)
    
    return input.replace(/[a-zA-Z]/g, (char) => {
        const code = char.charCodeAt(0);
        // 判斷是大寫還是小寫
        const isUpper = code >= 65 && code <= 90;
        
        if (isUpper) {
            // 大寫 A(65) - Z(90)
            return String.fromCharCode(90 - (code - 65));
        } else {
            // 小寫 a(97) - z(122)
            return String.fromCharCode(122 - (code - 97));
        }
    });
}

// 2. 凱撒密碼
function caesarOperation(input, operationType, shift) {
    const s = operationType === 'encrypt' ? shift : -shift;
    
    return input.toUpperCase().replace(/[A-Z]/g, (char) => {
        const charCode = char.charCodeAt(0);
        let offset = 65; 
        let newCharCode = charCode + s;
        
        if (s > 0) {
            newCharCode = (newCharCode - offset) % 26 + offset;
        } else {
            newCharCode = (newCharCode - offset + 26) % 26 + offset;
        }

        return String.fromCharCode(newCharCode);
    });
}

// 3. 單表置換密碼
function substitutionOperation(input, operationType, key) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const subKey = key.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 26);
    
    if (subKey.length < 26) {
        throw new Error('單表置換密鑰必須包含至少 26 個英文字母！');
    }

    let mapA = alphabet; 
    let mapB = subKey;    
    
    if (operationType === 'decrypt') {
        [mapA, mapB] = [mapB, mapA];
    }
    
    let result = '';
    input = input.toUpperCase();

    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const index = mapA.indexOf(char);

        if (index !== -1) {
            result += mapB[index];
        } else {
            result += char;
        }
    }
    return result;
}

// 4. AES 對稱加密
function aesOperation(input, operationType, key) {
    if (operationType === 'encrypt') {
        const encrypted = CryptoJS.AES.encrypt(input, key).toString();
        return encrypted;
    } else {
        const decryptedBytes = CryptoJS.AES.decrypt(input, key);
        const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8); 

        if (decryptedText === '') {
            throw new Error('解密失敗，可能密鑰或密文錯誤！');
        }
        return decryptedText;
    }
}

// 5. 異或運算 (XOR Cipher)
function xorOperation(input, operationType, key) {
    let result = '';
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length); 
        const xorResult = charCode ^ keyChar; 
        result += String.fromCharCode(xorResult);
    }
    
    if (operationType === 'encrypt') {
        return btoa(unescape(encodeURIComponent(result)));
    } else {
        const decodedInput = decodeURIComponent(escape(atob(input)));
        let finalDecrypted = '';
        for (let i = 0; i < decodedInput.length; i++) {
            const charCode = decodedInput.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            const xorResult = charCode ^ keyChar;
            finalDecrypted += String.fromCharCode(xorResult);
        }
        return finalDecrypted;
    }
}