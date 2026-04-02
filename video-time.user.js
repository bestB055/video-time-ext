// ==UserScript==
// @name         视频创建时间计算器
// @namespace    https://github.com/你的用户名/video-time-ext
// @version      1.1.0
// @description  在「视频创建时间」后自动显示距今时长，如「2小时前」
// @author       你的名字
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://你的用户名.github.io/video-time-ext/video-time.user.js
// @downloadURL  https://你的用户名.github.io/video-time-ext/video-time.user.js
// ==/UserScript==

(() => {
  'use strict';

  const LABEL  = '视频创建时间：';
  const ATTR   = 'data-time-injected';
  const TIME_RE = /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/;

  function getLabel(createStr) {
    const create = new Date(createStr.replace(' ', 'T'));
    if (isNaN(create.getTime())) return '';
    const diffMs = Date.now() - create.getTime();
    if (diffMs < 0) return '';
    const hours = Math.floor(diffMs / 3_600_000);
    return hours < 1 ? '（一小时内）' : `（${hours}小时前）`;
  }

  function injectLabel(container, timeStr, label) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.includes(timeStr)) {
        const idx   = node.nodeValue.indexOf(timeStr);
        const after = node.nodeValue.slice(idx + timeStr.length);
        node.nodeValue = node.nodeValue.slice(0, idx + timeStr.length);

        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        labelSpan.style.cssText = 'color:#888;font-size:0.92em;margin-left:2px;';

        const afterNode = document.createTextNode(after);
        const ref = node.nextSibling;
        container.insertBefore(labelSpan, ref);
        container.insertBefore(afterNode, ref);
        break;
      }
    }
  }

  function processAll() {
    const spans = document.querySelectorAll('span');
    for (const span of spans) {
      if (span.textContent.trim() !== LABEL) continue;
      const parent = span.parentElement;
      if (!parent || parent.hasAttribute(ATTR)) continue;

      const fullText = parent.textContent || '';
      const match = fullText.match(TIME_RE);
      if (!match) continue;

      const timeStr = match[1];
      const label   = getLabel(timeStr);
      if (!label) continue;

      injectLabel(parent, timeStr, label);
      parent.setAttribute(ATTR, '1');
    }
  }

  setTimeout(processAll, 500);
  setTimeout(processAll, 1500);

  const observer = new MutationObserver(() => {
    clearTimeout(observer._timer);
    observer._timer = setTimeout(processAll, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
