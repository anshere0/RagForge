(function () {
  var script = document.currentScript;
  var clientSlug = script ? script.getAttribute('data-client') : null;
  if (!clientSlug) {
    console.error('RAGForge Widget: Missing data-client attribute on script tag.');
    return;
  }

  var host = script.src.split('/widget.js')[0];
  var iframeUrl = host + '/chat/' + clientSlug;

  // Create floating launcher button
  var button = document.createElement('div');
  button.id = 'ragforge-widget-button';
  button.style.position = 'fixed';
  button.style.bottom = '24px';
  button.style.right = '24px';
  button.style.width = '56px';
  button.style.height = '56px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = '#3B82F6';
  button.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
  button.style.cursor = 'pointer';
  button.style.zIndex = '999999';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.transition = 'transform 0.2s ease, background-color 0.2s ease';
  button.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

  button.onmouseenter = function() { button.style.transform = 'scale(1.05)'; };
  button.onmouseleave = function() { button.style.transform = 'scale(1)'; };

  // Create chat container iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'ragforge-widget-iframe';
  iframe.src = iframeUrl;
  iframe.style.position = 'fixed';
  iframe.style.bottom = '96px';
  iframe.style.right = '24px';
  iframe.style.width = '380px';
  iframe.style.height = '620px';
  iframe.style.maxHeight = 'calc(100vh - 120px)';
  iframe.style.maxWidth = 'calc(100vw - 32px)';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '20px';
  iframe.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
  iframe.style.zIndex = '999998';
  iframe.style.display = 'none';
  iframe.style.overflow = 'hidden';

  var isOpen = false;
  button.onclick = function () {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    button.innerHTML = isOpen
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  };

  document.body.appendChild(button);
  document.body.appendChild(iframe);
})();
