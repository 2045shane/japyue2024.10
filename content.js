function initializeTranslator() {
  let translateContainer = null;
  let translatePopup = null;
  let isTranslating = false;

  function createTranslateContainer() {
    if (translateContainer) return;
    
    translateContainer = document.createElement('div');
    translateContainer.id = 'translate-container';
    translateContainer.style.position = 'fixed';
    translateContainer.style.top = '0';
    translateContainer.style.left = '0';
    translateContainer.style.width = '100%';
    translateContainer.style.height = '100%';
    translateContainer.style.pointerEvents = 'none';
    translateContainer.style.zIndex = '2147483647';
    document.body.appendChild(translateContainer);
  }

  createTranslateContainer();

  function handleMouseUp(event) {
    if (isTranslating) return;
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      translateText(selectedText, event.clientX, event.clientY);
    } else if (!translatePopup || !translatePopup.contains(event.target)) {
      removePopup();
    }
  }

  function handleMouseDown(event) {
    if (translatePopup && !translatePopup.contains(event.target)) {
      removePopup();
    }
  }

  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousedown', handleMouseDown);

  function detectLanguage(text) {
    const chineseRegex = /[\u4e00-\u9fa5]/;
    const englishRegex = /^[a-zA-Z\s.,!?]+$/;
    
    if (chineseRegex.test(text)) return 'zh';
    if (englishRegex.test(text)) return 'en';
    return 'unknown';
  }

  function translateText(text, x, y) {
    isTranslating = true;
    const sourceLanguage = detectLanguage(text);
    
    if (sourceLanguage === 'unknown') {
      showPopup('无法识别语言', x, y);
      isTranslating = false;
      return;
    }

    const langPair = `${sourceLanguage}|ja`;
    
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`)
      .then(response => response.json())
      .then(data => {
        const translation = data.responseData.translatedText;
        showPopup(translation, x, y);
      })
      .catch(error => {
        console.error('翻译出错:', error);
        showPopup('翻译失败', x, y);
      })
      .finally(() => {
        isTranslating = false;
      });
  }

  function showPopup(translation, x, y) {
    removePopup();
    translatePopup = document.createElement('div');
    translatePopup.className = 'translate-popup';
    
    const translationText = document.createElement('span');
    translationText.textContent = translation;
    translatePopup.appendChild(translationText);
    
    const speakButton = document.createElement('button');
    speakButton.textContent = '朗读';
    speakButton.className = 'speak-button';
    speakButton.addEventListener('click', (event) => {
      event.stopPropagation();
      speakText(translation);
    });
    translatePopup.appendChild(speakButton);
    
    translatePopup.style.position = 'absolute';
    translatePopup.style.left = `${x}px`;
    translatePopup.style.top = `${y + 20}px`;
    translatePopup.style.pointerEvents = 'auto';
    
    translateContainer.appendChild(translatePopup);

    translatePopup.addEventListener('mousedown', (event) => event.stopPropagation());
    translatePopup.addEventListener('mouseup', (event) => event.stopPropagation());
    translatePopup.addEventListener('click', (event) => event.stopPropagation());
  }

  function removePopup() {
    if (translatePopup) {
      translatePopup.remove();
      translatePopup = null;
    }
  }

  function speakText(text) {
    chrome.runtime.sendMessage({action: "speak", text: text}, (response) => {
      if (chrome.runtime.lastError) {
        console.error('发送消息时出错:', chrome.runtime.lastError);
      } else if (response && response.error) {
        console.error('朗读出错:', response.error);
      }
    });
  }

  function removeTranslator() {
    if (translateContainer) {
      translateContainer.remove();
      translateContainer = null;
    }
    if (translatePopup) {
      translatePopup.remove();
      translatePopup = null;
    }
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousedown', handleMouseDown);
  }

  // 将 removeTranslator 函数添加到 window 对象，以便 background script 可以调用
  window.removeTranslator = removeTranslator;
}

initializeTranslator();
