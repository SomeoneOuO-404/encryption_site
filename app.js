// 綁定元素，用於控制顯示/隱藏和獲取輸入值
const methodSelect = document.getElementById('methodSelect');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const keyField = document.getElementById('keyField');
const secretKeyInput = document.getElementById('secretKey');
const caesarShift = document.getElementById('caesarShift');
const shiftValueInput = document.getElementById('shiftValue');



// --- 事件監聽器：根據選擇的方法顯示或隱藏密鑰/位移欄位 ---
methodSelect.addEventListener('change', function() {
    const selectedMethod = this.value;
    
    // 預設全部隱藏
    keyField.style.display = 'none';
    caesarShift.style.display = 'none';
    
    // 根據選擇的方法顯示對應欄位
    if (selectedMethod === 'aes' || selectedMethod === 'xor' || selectedMethod === 'substitution') {
        keyField.style.display = 'block';
    } else if (selectedMethod === 'caesar') {
        caesarShift.style.display = 'block';
    }
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
            case 'base64':
                result = base64Operation(input, operationType);
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

// 1. ROT13 編碼/解碼（取代原本的 Base64）
function base64Operation(input, operationType) {
    return input.replace(/[a-zA-Z]/g, function(char) {
        const base = char <= 'Z' ? 65 : 97; // 大寫或小寫
        const code = char.charCodeAt(0) - base;
        const rotated = (code + 13) % 26;
        return String.fromCharCode(rotated + base);
    });
}

// 2. 凱撒密碼 (只處理英文字母)
function caesarOperation(input, operationType, shift) {
    const s = operationType === 'encrypt' ? shift : -shift; // 加密是正向位移，解密是反向位移
    
    return input.toUpperCase().replace(/[A-Z]/g, (char) => {
        const charCode = char.charCodeAt(0);
        let offset = 65; // 'A' 的 ASCII 碼
        
        let newCharCode = charCode + s;
        
        // 確保循環回到 A-Z 範圍內
        if (s > 0) {
            newCharCode = (newCharCode - offset) % 26 + offset;
        } else {
            // 處理負數位移 (解密)
            newCharCode = (newCharCode - offset + 26) % 26 + offset;
        }

        return String.fromCharCode(newCharCode);
    });
}

// 3. 單表置換密碼 (使用密鑰作為置換表)
function substitutionOperation(input, operationType, key) {
    // 這裡為了演示簡單，讓 key 成為一個長度 26 的替換表
    // Key: 必須是 26 個不重複的字母
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const subKey = key.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 26);
    
    if (subKey.length < 26) {
        throw new Error('單表置換密鑰必須包含至少 26 個英文字母！');
    }

    let mapA = alphabet; // 明文的字母表
    let mapB = subKey;    // 密文的字母表 (替換表)
    
    if (operationType === 'decrypt') {
        // 解密時，將替換表顛倒
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
            result += char; // 非字母字符不變
        }
    }
    return result;
}


// 4. AES 對稱加密/解密 (使用 crypto-js 庫)
function aesOperation(input, operationType, key) {
    if (operationType === 'encrypt') {
        // 加密
        const encrypted = CryptoJS.AES.encrypt(input, key).toString();
        return encrypted;
    } else {
        // 解密
        const decryptedBytes = CryptoJS.AES.decrypt(input, key);
        // 將位元組轉換為 UTF-8 字串
        const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8); 

        if (decryptedText === '') {
            throw new Error('解密失敗，可能密鑰或密文錯誤！');
        }
        return decryptedText;
    }
}

// 5. 異或運算加密/解密 (XOR Cipher)
function xorOperation(input, operationType, key) {
    let result = '';
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length); // 循環使用密鑰字元
        
        // 使用 XOR 運算：加密和解密使用相同的邏輯
        const xorResult = charCode ^ keyChar; 
        result += String.fromCharCode(xorResult);
    }
    
    // 如果是加密操作，將結果進行 Base64 編碼以便於顯示和傳輸
    if (operationType === 'encrypt') {
        // Base64 編碼，處理可能產生的不可見字元
        return btoa(unescape(encodeURIComponent(result)));
    } else {
        // 解密操作，先進行 Base64 解碼，再進行 XOR
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
