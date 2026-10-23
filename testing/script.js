(function () {
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- Animated particle network background ---------- */
  var c = document.getElementById('net');
  var x = c ? c.getContext('2d') : null;
  var W, H, P = [];

  function size() {
    if (!c) return;
    W = c.width = innerWidth;
    H = c.height = innerHeight;
    P = [];
    var n = Math.min(70, Math.floor(W * H / 18000));
    for (var i = 0; i < n; i++) {
      P.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4
      });
    }
  }

  function draw() {
    if (!x) return;
    x.clearRect(0, 0, W, H);
    for (var i = 0; i < P.length; i++) {
      var a = P[i];
      if (!still) {
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
      }
      x.fillStyle = '#38f2ff';
      x.globalAlpha = 0.8;
      x.fillRect(a.x, a.y, 2, 2);

      for (var j = i + 1; j < P.length; j++) {
        var b = P[j];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 140) {
          x.globalAlpha = (1 - d / 140) * 0.35;
          x.strokeStyle = i % 3 ? '#8a5cff' : '#ff3ea5';
          x.beginPath();
          x.moveTo(a.x, a.y);
          x.lineTo(b.x, b.y);
          x.stroke();
        }
      }
    }
    if (!still) requestAnimationFrame(draw);
  }

  addEventListener('resize', function () {
    size();
    if (still) draw();
  });
  size();
  draw();

  /* ---------- Typing effect in the hero ---------- */
  var words = ['Front-end developer', 'HTML + CSS + JavaScript', 'Student. Builder. Learner.'];
  var wi = 0, ci = 0, del = false;
  var t = document.getElementById('typed');

  if (t) {
    if (still) {
      t.textContent = words[0];
    } else {
      (function tick() {
        var w = words[wi];
        t.textContent = w.slice(0, ci);
        if (!del && ci === w.length) {
          del = true;
          return setTimeout(tick, 1600);
        }
        if (del && ci === 0) {
          del = false;
          wi = (wi + 1) % words.length;
        }
        ci += del ? -1 : 1;
        setTimeout(tick, del ? 35 : 70);
      })();
    }
  }

  /* ---------- Skill bars fill when scrolled into view ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.querySelectorAll('em').forEach(function (m) {
          m.style.width = m.dataset.w + '%';
        });
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });

  if (document.getElementById('bars')) {
    io.observe(document.getElementById('bars'));
  }

  /* ---------- Floating Chat Toggle Logic ---------- */
  const chatToggleBtn = document.getElementById('chat-toggle-btn');
  const chatCloseBtn = document.getElementById('chat-close-btn');
  const chatPopup = document.getElementById('chat-popup');

  if (chatToggleBtn && chatCloseBtn && chatPopup) {
    chatToggleBtn.addEventListener('click', () => {
      chatPopup.classList.toggle('hidden');
    });
    chatCloseBtn.addEventListener('click', () => {
      chatPopup.classList.add('hidden');
    });
  }

  /* ---------- Extract HTML Page Content for Knowledge Base ---------- */
  function extractPortfolioKnowledge() {
    // Select main portfolio containers or fallback to entire document body
    const mainContent = document.querySelector('main') || document.body;
    
    // Clone node so we can clean up script/style tags before reading text
    const clone = mainContent.cloneNode(true);
    
    // Remove chat box and non-content elements from the clone
    const selectorsToRemove = ['#chat-popup', '#chat-toggle-btn', 'script', 'style', 'nav'];
    selectorsToRemove.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });

    // Clean whitespace and get readable innerText
    let textContent = clone.innerText || clone.textContent || '';
    return textContent.replace(/\s+/g, ' ').trim();
  }

  /* ---------- Cohere AI Chat Integration ---------- */
  const API_KEY = 'wA87aUVVwFnFiwoJM6pWcvcXkSQddtuZABO0JWMk'; 
  const API_URL = 'https://api.cohere.com/v2/chat';

  const chatBox = document.getElementById('chat-box');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');

  // Dynamically pull text from HTML portfolio page
  const pageKnowledge = extractPortfolioKnowledge();

  let conversationHistory = [
    { 
      role: 'system', 
      content: `You are the AI assistant for Karl Dominic Bautista's personal website portfolio.
You must identify yourself as Karl's AI assistant, NOT Karl.

YOUR STRICT KNOWLEDGE BASE (Scraped directly from Karl's portfolio HTML page):
"""
${pageKnowledge}
"""

RULES FOR RESPONDING:
1. Answer visitor questions STRICTLY using ONLY the facts present in the Knowledge Base above.
2. If a visitor asks a question whose answer is NOT present in the Knowledge Base above, politely state that you don't have that information on the portfolio and advise them to contact Karl directly at karldominicbautista0811@gmail.com.
3. NEVER make up, invent, or assume any details, dates, skills, or background not explicitly stated above.
4. Keep responses concise (2-4 sentences), friendly, and professional.` 
    }
  ];

  async function sendChatMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user-message');
    userInput.value = '';
    
    conversationHistory.push({ role: 'user', content: text });
    const loadingId = appendMessage('Thinking...', 'ai-message loading');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'command-r-plus-08-2024',
          messages: conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cohere API Error Details:', errorData);
        throw new Error(`API error (${response.status}): ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.message || !data.message.content || !data.message.content.length) {
        throw new Error('Unexpected empty response format from Cohere API.');
      }

      const aiResponseText = data.message.content[0].text;

      removeMessage(loadingId);
      appendMessage(aiResponseText, 'ai-message');

      conversationHistory.push({ role: 'assistant', content: aiResponseText });

    } catch (error) {
      console.error('Chat error:', error);
      removeMessage(loadingId);
      appendMessage('Oops! Something went wrong connecting to Cohere. Check your API key or console.', 'ai-message');
    }
  }

  function appendMessage(text, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.textContent = text;
    
    if (className.includes('loading')) {
      messageDiv.id = 'loading-msg-' + Date.now();
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv.id;
  }

  function removeMessage(id) {
    if (id) {
      const msg = document.getElementById(id);
      if (msg) msg.remove();
    }
  }

  if (sendBtn && userInput) {
    sendBtn.addEventListener('click', sendChatMessage);
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
})();