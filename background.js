let isActive = false;

chrome.action.onClicked.addListener((tab) => {
  isActive = !isActive;
  if (isActive) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['styles.css']
    });
  } else {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        if (window.removeTranslator) {
          window.removeTranslator();
        }
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "speak") {
    chrome.tts.speak(request.text, {
      lang: 'ja-JP',
      onEvent: function(event) {
        if (event.type === 'error') {
          console.error('TTS错误:', event);
          sendResponse({error: '朗读失败'});
        }
      }
    });
    return true; // 保持消息通道开放以进行异步响应
  }
});
