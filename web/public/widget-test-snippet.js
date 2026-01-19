// TEMPORARY WIDGET TEST - Paste this in browser console to test widget
// This will inject the widget into the current page for testing

(function() {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .ai-tryon-widget { margin: 20px 0; }
    .ai-tryon-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 14px 28px; border: none; border-radius: 8px;
      font-size: 16px; font-weight: 600; cursor: pointer;
      display: inline-flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .ai-tryon-modal { display: none; position: fixed; top: 0; left: 0;
      width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7);
      z-index: 10000; align-items: center; justify-content: center; }
    .ai-tryon-modal.active { display: flex; }
    .ai-tryon-modal-content { background: white; padding: 32px;
      border-radius: 16px; max-width: 500px; width: 90%; position: relative; }
    .ai-tryon-close { position: absolute; top: 16px; right: 16px;
      background: none; border: none; font-size: 28px; cursor: pointer; }
  `;
  document.head.appendChild(style);

  // Inject HTML
  const widgetHTML = `
    <div class="ai-tryon-widget">
      <button class="ai-tryon-button" id="testAiTryOnBtn">
        🤳 Üzerimde Dene (AI) - TEST
      </button>
    </div>
    <div class="ai-tryon-modal" id="testAiTryOnModal">
      <div class="ai-tryon-modal-content">
        <button class="ai-tryon-close" id="testCloseBtn">&times;</button>
        <h3>✨ Widget Çalışıyor!</h3>
        <p>Backend bağlantısını test etmek için console'a şu kodu yapıştırın:</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">
fetch('/apps/ai-tryon/virtual-try-on', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerImage: 'data:image/png;base64,test',
    productImageUrl: 'https://example.com/test.jpg',
    productName: 'Test'
  })
}).then(r => r.json()).then(console.log).catch(console.error);
        </pre>
      </div>
    </div>
  `;

  // Append to body
  const container = document.createElement('div');
  container.innerHTML = widgetHTML;
  document.body.appendChild(container);

  // Add event listeners
  document.getElementById('testAiTryOnBtn').onclick = () => {
    document.getElementById('testAiTryOnModal').classList.add('active');
  };
  document.getElementById('testCloseBtn').onclick = () => {
    document.getElementById('testAiTryOnModal').classList.remove('active');
  };

  console.log('✅ Test widget injected! Look for the purple button on the page.');
})();
