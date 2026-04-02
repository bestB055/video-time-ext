(() => {
  'use strict';

  const LABEL = '视频创建时间：';
  const ATTR   = 'data-time-injected';
  // 匹配 YYYY-MM-DD HH:mm:ss
  const TIME_RE = /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/;

  /**
   * 给定创建时间字符串，返回 "（x小时前）" 或 "（一小时内）"
   */
  function getLabel(createStr) {
    const create = new Date(createStr.replace(' ', 'T'));
    if (isNaN(create.getTime())) return '';
    const diffMs = Date.now() - create.getTime();
    if (diffMs < 0) return '';
    const hours = Math.floor(diffMs / 3_600_000);
    return hours < 1 ? '（一小时内）' : `（${hours}小时前）`;
  }

  /**
   * 核心：遍历全部 span，找到 innerText === '视频创建时间：' 的节点，
   * 然后取其父节点，从父节点 textContent 里提取时间并注入标签。
   */
  function processAll() {
    // 找所有 span，文本内容精确匹配
    const spans = document.querySelectorAll('span');
    for (const span of spans) {
      // 只看直接文本（避免把带子节点的 span 误判）
      if (span.textContent.trim() !== LABEL) continue;

      const parent = span.parentElement;
      if (!parent || parent.hasAttribute(ATTR)) continue;

      // 从父节点完整文本中提取时间串
      const fullText = parent.textContent || '';
      const match = fullText.match(TIME_RE);
      if (!match) continue;

      const timeStr = match[1];
      const label   = getLabel(timeStr);
      if (!label) continue;

      // 找到父节点中包含时间数字的那个文本节点，追加标签
      injectLabel(parent, timeStr, label);
      parent.setAttribute(ATTR, '1');
    }
  }

  /**
   * 在 container 内找到包含 timeStr 的文本节点，
   * 在其末尾紧接插入一个 <span> 标签。
   */
  function injectLabel(container, timeStr, label) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.includes(timeStr)) {
        // 把文本节点切成：前缀 | timeStr | 后缀
        // 然后在 timeStr 末尾插入 label span
        const idx   = node.nodeValue.indexOf(timeStr);
        const after = node.nodeValue.slice(idx + timeStr.length);
        // 修改原文本节点只保留 timeStr 之前的部分 + timeStr
        node.nodeValue = node.nodeValue.slice(0, idx + timeStr.length);

        // 插入 label span
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

  // ── 初始执行 ──────────────────────────────────────────────────
  // 延迟 500ms，等待可能的懒加载渲染完成
  setTimeout(processAll, 500);
  setTimeout(processAll, 1500); // 二次保险

  // ── MutationObserver：监听 DOM 变化（SPA / 异步渲染） ─────────
  const observer = new MutationObserver(() => {
    // 节流：避免频繁触发
    clearTimeout(observer._timer);
    observer._timer = setTimeout(processAll, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree:   true,
  });
})();
