(() => {
  'use strict';
  const zh = document.documentElement.lang.startsWith('zh');
  const say = (en, cn) => zh ? cn : en;
  const el = (id) => document.getElementById(id);
  const captchaMessage = say('Please complete verification below.', '请完成下方的人机验证。');
  const busyMessage = say('Submitting…', '正在提交…');
  let publicClient;
  function status(target, text, error = false) {
    if (!target) return;
    target.textContent = text;
    target.className = 'ql-status-msg' + (error ? ' ql-error-text' : '');
  }
  async function api(endpoint, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      const headers = payload ? { 'Content-Type': 'application/json' } : {};
      if (endpoint === 'subscribe-confirm') {
        // This function retains the existing gateway JWT check. Only the
        // public anon client credential belongs in a browser request.
        if (!publicClient) {
          const config = await fetch('/assets/supabase-public.json', { signal: controller.signal });
          if (!config.ok) throw new TypeError('Client configuration unavailable');
          publicClient = await config.json();
        }
        headers.Authorization = 'Bearer ' + publicClient.anonKey;
      }
      const response = await fetch(SUPABASE_FUNCTIONS_URL + '/' + endpoint, {
        method: payload ? 'POST' : 'GET', signal: controller.signal,
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        let message = say('Unable to complete the request. Please try again.', '请求未完成，请重试。');
        if (response.status === 429) message = say('Too many requests. Please try again later.', '操作较频繁，请稍后重试。');
        if (data.error?.code === 'captcha_failed') message = say('Verification expired. Please verify again.', '验证已失效，请重新验证。');
        if (response.status === 502) message = say('Email delivery failed. Please try again later.', '邮件发送失败，请稍后重试。');
        if (response.status === 401) message = say('This confirmation link has expired or is invalid. Please subscribe again.', '确认链接已失效，请重新订阅。');
        throw new Error(message);
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new Error(say('Connection interrupted. Please check your network and retry.', '连接中断，请检查网络后重试。'));
      }
      throw error;
    } finally { clearTimeout(timeout); }
  }
  function captcha() {
    const token = window.__ql_turnstile_token;
    if (!token) {
      document.querySelector('.cf-turnstile')?.scrollIntoView({ block: 'center' });
      throw new Error(captchaMessage);
    }
    window.__ql_turnstile_token = null;
    return token;
  }
  document.addEventListener('ql-captcha-error', () => {
    status(el('ql-comment-status') || el('ql-subscribe-status'), say('Verification could not load. Check your connection and reload.', '验证未能加载，请检查网络并刷新页面。'), true);
  });
  document.addEventListener('ql-captcha-ready', () => {
    const target = el('ql-comment-status') || el('ql-subscribe-status');
    if (target?.classList.contains('ql-error-text')) status(target, '');
  });

  if (el('ql-comment-form')) {
    const postSlug = getPostSlug();
    const deviceId = getDeviceId();
    const query = new URLSearchParams({ postSlug, deviceId });
    let liked = null;
    let submitting = false;
    const likeButton = el('ql-like-btn');
    function setLike(data) {
      liked = Boolean(data.liked);
      el('ql-like-count').textContent = String(data.count);
      likeButton.setAttribute('aria-pressed', String(liked));
      likeButton.classList.toggle('ql-liked', liked);
      likeButton.querySelector('svg').setAttribute('fill', liked ? 'currentColor' : 'none');
    }
    async function loadLikes() {
      try { setLike(await api('like-toggle?' + query)); return true; }
      catch (error) { status(el('ql-action-status'), error.message, true); return false; }
    }
    async function loadComments() {
      const list = el('ql-comments-list');
      el('ql-comments-retry').hidden = true;
      try {
        const data = await api('comments-list?' + new URLSearchParams({ postSlug }));
        list.replaceChildren();
        if (!data.comments.length) {
          const empty = document.createElement('p');
          empty.className = 'ql-empty';
          empty.textContent = say('No comments yet. Be the first to share your thoughts!', '还没有评论，欢迎分享您的想法！');
          list.append(empty);
        }
        for (const comment of data.comments) {
          const item = document.createElement('article'); item.className = 'ql-comment-item';
          const meta = document.createElement('div'); meta.className = 'ql-comment-meta';
          const name = document.createElement('strong'); name.textContent = comment.nickname || say('Anonymous', '匿名');
          const date = document.createElement('time'); date.dateTime = comment.created_at;
          date.textContent = new Date(comment.created_at).toLocaleDateString(zh ? 'zh-CN' : 'en');
          const text = document.createElement('p'); text.className = 'ql-comment-text'; text.textContent = comment.content;
          meta.append(name, date); item.append(meta, text); list.append(item);
        }
      } catch (error) {
        list.textContent = error.message; el('ql-comments-retry').hidden = false;
      }
    }
    function busy(value) {
      submitting = value; likeButton.disabled = value; el('ql-comment-submit').disabled = value;
    }
    likeButton.addEventListener('click', async () => {
      if (submitting) return;
      if (liked === null && !await loadLikes()) return;
      let token;
      try { token = captcha(); }
      catch (error) { status(el('ql-action-status'), error.message, true); return; }
      busy(true);
      try {
        setLike(await api('like-toggle', { postSlug, deviceId, liked: !liked, captchaToken: token }));
        status(el('ql-action-status'), liked ? say('Liked. Thank you!', '已点赞，谢谢！') : say('Like removed.', '已取消点赞。'));
      } catch (error) { status(el('ql-action-status'), error.message, true); }
      finally { qlResetCaptcha(); busy(false); }
    });
    el('ql-comment-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting || !event.currentTarget.reportValidity()) return;
      const content = el('ql-comment-content').value.trim();
      if (!content) { status(el('ql-comment-status'), say('Please write a comment.', '请输入评论内容。'), true); return; }
      let token;
      try { token = captcha(); }
      catch (error) { status(el('ql-comment-status'), error.message, true); return; }
      busy(true); status(el('ql-comment-status'), busyMessage);
      try {
        await api('comments-create', { postSlug, nickname: el('ql-comment-name').value.trim(), content, captchaToken: token });
        el('ql-comment-content').value = '';
        status(el('ql-comment-status'), say('Comment submitted. It will appear after moderation.', '评论已提交，审核后将显示在本文下方。'));
      } catch (error) { status(el('ql-comment-status'), error.message, true); }
      finally { qlResetCaptcha(); busy(false); }
    });
    el('ql-share-btn').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(window.location.href); status(el('ql-action-status'), say('Link copied.', '链接已复制。')); }
      catch { status(el('ql-action-status'), say('Copy the page address from your browser to share it.', '可复制浏览器地址栏中的链接进行分享。')); }
    });
    el('ql-comments-retry').addEventListener('click', () => { loadComments(); loadLikes(); });
    loadLikes(); loadComments();
  }

  if (el('ql-subscribe-form')) {
    const form = el('ql-subscribe-form');
    const button = el('ql-subscribe-submit');
    const output = el('ql-subscribe-status');
    const current = new URL(window.location.href);
    const confirmation = new URLSearchParams(current.hash.slice(1)).get('confirm') || current.searchParams.get('confirm');
    if (confirmation) {
      button.disabled = true; status(output, say('Confirming your subscription…', '正在确认订阅…'));
      api('subscribe-confirm', { token: confirmation }).then(() => {
        status(output, say('Email confirmed. You are subscribed!', '邮箱已确认，订阅成功！'));
        current.hash = ''; current.searchParams.delete('confirm');
        history.replaceState({}, document.title, current.pathname + current.search);
        window.dispatchEvent(new Event('hashchange'));
      }).catch((error) => status(output, error.message, true)).finally(() => { button.disabled = false; });
    }
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (button.disabled || !form.reportValidity()) return;
      let token;
      try { token = captcha(); }
      catch (error) { status(output, error.message, true); return; }
      button.disabled = true; status(output, busyMessage);
      try {
        await api('subscribe', { email: el('ql-subscribe-email').value.trim(), captchaToken: token, locale: zh ? 'zh-CN' : 'en' });
        status(output, say('Check your email, including spam, to confirm your subscription.', '请查收确认邮件（也请检查垃圾邮件文件夹），点击链接完成订阅。'));
        el('ql-subscribe-email').value = '';
      } catch (error) { status(output, error.message, true); }
      finally { qlResetCaptcha(); button.disabled = false; }
    });
  }
})();
