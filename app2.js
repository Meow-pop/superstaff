"use strict";

/* ================= 视频工厂 ================= */
let videoState = { style:'news', bg:'#0b1020', fg:'#f8fbff', accent:'#67e8f9', dur:15, text:'', progress:0, rendering:false, result:null };
let vAnimId = null, vStartT = 0;

const VSTYLES = {
  news:    { name:'深蓝观点', desc:'专业 / 商业', bg:'#0b1020', bg2:'#1f2b5c', fg:'#f8fbff', accent:'#67e8f9', muted:'#a5b4fc', font:'sans-serif', label:'INSIGHT' },
  pink:    { name:'奶油种草', desc:'生活 / 好物', bg:'#fff0f4', bg2:'#f7d8e4', fg:'#4a2331', accent:'#e94f7b', muted:'#9d6174', font:'sans-serif', label:'GOOD THINGS' },
  dark:    { name:'暗黑科技', desc:'科技 / 效率', bg:'#05070b', bg2:'#10251f', fg:'#eafff6', accent:'#42f5a7', muted:'#7dd3b0', font:'monospace', label:'FUTURE LAB' },
  warm:    { name:'日落故事', desc:'情绪 / 叙事', bg:'#241713', bg2:'#8b4932', fg:'#fff7ed', accent:'#fdba74', muted:'#fed7aa', font:'serif', label:'STORY' },
  minimal: { name:'纸感极简', desc:'知识 / 清单', bg:'#f7f4ed', bg2:'#e8e3d7', fg:'#1f2937', accent:'#3157d5', muted:'#6b7280', font:'sans-serif', label:'FIELD NOTES' },
};

function renderVideoPage(){
  const pg = $('#pg-video');
  if (!pg.dataset.built){
    pg.innerHTML = `
    <div class="video-layout">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-h"><b>🎬 视频工厂</b><span class="bdg b-ok">本地渲染 · 无需联网</span></div>
          <div class="card-b">
            <div id="vDraftNotice"></div>
            <div class="fld"><label>视频文案（口播文字，将逐句显示在画面上）</label>
              <textarea id="vText" class="ta" rows="4" placeholder="输入视频文案，每句话会自动分成一帧画面显示…">关于副业，我踩过最大的坑就是什么都想做。
后来我发现，聚焦一个方向死磕三个月，比什么都试一遍强十倍。
别急着买课，先把最小闭环跑通。
关注我，下期拆解我是怎么从零起步的。</textarea></div>
            <div class="fld"><label>风格模板</label>
              <div class="vstyle-grid" id="vStyles"></div></div>
            <div class="row2">
              <div class="fld"><label>时长（秒）</label>
                <div class="range-row"><input type="range" id="vDur" min="5" max="30" step="1" value="15"><b id="vDurVal">15s</b></div>
              </div>
              <div class="fld"><label>分辨率</label><select id="vRes" class="sel"><option value="720x1280">720×1280（推荐）</option><option value="1080x1920">1080×1920（高清）</option><option value="480x854">480×854（快速）</option></select></div>
            </div>
            <div class="row2">
              <div class="fld"><label>配乐（本地合成）</label><select id="vBgm" class="sel"><option value="soft">轻盈氛围（推荐）</option><option value="pulse">轻快律动</option><option value="none">无配乐</option></select></div>
              <div class="fld"><label><label class="ck"><input type="checkbox" id="vSub" checked> 底部字幕条</label></label></div>
            </div>
            <button class="btn primary block" id="btnRender" style="margin-top:4px">🎬 开始生成视频</button>
          </div>
        </div>
        <div class="card" id="vResultCard" style="display:none">
          <div class="card-h"><b>✅ 生成完成</b><button class="btn ghost sm" id="btnReRender">重新生成</button></div>
          <div class="card-b">
            <div class="v-result" id="vResultBody"></div>
          </div>
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-h"><b>👁️ 实时预览</b></div>
          <div class="card-b">
            <div class="canvas-box">
              <canvas id="vPreview" width="360" height="640"></canvas>
              <div class="v-nav">
                <button class="ibtn" id="vPrev" title="上一帧">◀</button>
                <span id="vFrameInfo">第 1 帧</span>
                <button class="ibtn" id="vNext" title="下一帧">▶</button>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><b>💡 使用说明</b></div>
          <div class="card-b">
            <div class="tip">
              <b>本地渲染原理：</b>用 Canvas 逐帧绘制文字动画 → 通过 <code>MediaRecorder</code> 录制为 WebM 视频，全程在浏览器内完成，<b>不上传任何数据</b>。<br><br>
              <b>建议：</b>文案每句一行，会自动拆成画面帧；时长越长每句停留越久。当前声音是轻量背景配乐，不包含真人口播。
            </div>
          </div>
        </div>
      </div>
    </div>`;
    pg.dataset.built = '1';
    $('#vDur').oninput = e => { $('#vDurVal').textContent = e.target.value + 's'; videoState.dur = +e.target.value; };
    $('#vText').oninput = e => { videoState.text = e.target.value; drawFrame(0); };
    $('#btnRender').onclick = renderVideo;
    $('#btnReRender').onclick = renderVideo;
    $('#vPrev').onclick = () => { videoState._frame = Math.max(0, (videoState._frame||0)-1); drawFrame(videoState._frame); updateFrameInfo(); };
    $('#vNext').onclick = () => { const max = (videoState.text||'').split('\n').filter(Boolean).length - 1 || 0; videoState._frame = Math.min(max, (videoState._frame||0)+1); drawFrame(videoState._frame); updateFrameInfo(); };
  }
  // 风格选择
  const ss = $('#vStyles');
  ss.innerHTML = Object.entries(VSTYLES).map(([k,v]) =>
    `<button class="vstyle-card ${k===videoState.style?'active':''}" data-s="${k}" style="--v-bg:${v.bg};--v-bg2:${v.bg2};--v-accent:${v.accent}"><i></i><span><b>${v.name}</b><small>${v.desc}</small></span></button>`).join('');
  ss.querySelectorAll('.vstyle-card').forEach(c => c.onclick = () => {
    videoState.style = c.dataset.s;
    const s = VSTYLES[videoState.style];
    videoState.bg = s.bg; videoState.fg = s.fg; videoState.accent = s.accent;
    ss.querySelectorAll('.vstyle-card').forEach(x => x.classList.toggle('active', x === c));
    drawFrame(videoState._frame || 0);
  });
  if (S.videoDraft && S.videoDraft.content && videoState.draftId !== S.videoDraft.id) {
    videoState.draftId = S.videoDraft.id;
    videoState._frame = 0;
    $('#vText').value = S.videoDraft.content;
    $('#vDraftNotice').innerHTML = `<div class="handoff-note"><span>✓</span><div><b>已接收：${esc(S.videoDraft.title)}</b><p>来自${S.videoDraft.source === 'workflow' ? '工作流' : S.videoDraft.source === 'chat' ? 'AI 员工' : '素材库'}，可直接调整并生成视频。</p></div></div>`;
  }
  videoState.text = $('#vText').value;
  drawFrame(0);
  updateFrameInfo();
}

function updateFrameInfo(){
  const lines = (videoState.text||'').split('\n').filter(Boolean);
  $('#vFrameInfo').textContent = `第 ${(videoState._frame||0)+1} / ${lines.length||1} 帧`;
}

function wrapText(ctx, text, maxW){
  const chars = text.split('');
  const lines = []; let cur = '';
  for (const ch of chars) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = ch; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 6);
}

function colorAlpha(hex, alpha){
  let h = String(hex || '#000').replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function roundBox(ctx, x, y, w, h, r){
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const easeOut = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

function drawVideoScene(ctx, W, H, line, idx, total, sceneProgress = 1, showSub = true){
  const s = VSTYLES[videoState.style] || VSTYLES.news;
  const scale = W / 360;
  const isLight = videoState.style === 'pink' || videoState.style === 'minimal';
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, s.bg); bg.addColorStop(.62, s.bg2); bg.addColorStop(1, s.bg);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * .82, H * .12, 0, W * .82, H * .12, W * .68);
  glow.addColorStop(0, colorAlpha(s.accent, isLight ? .22 : .30));
  glow.addColorStop(1, colorAlpha(s.accent, 0));
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = colorAlpha(s.fg, isLight ? .055 : .07);
  ctx.lineWidth = Math.max(1, scale * .6);
  for (let x = -W; x < W * 2; x += W / 7) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H * .22, H); ctx.stroke();
  }

  ctx.fillStyle = colorAlpha(s.fg, isLight ? .07 : .06);
  ctx.font = `800 ${Math.round(118 * scale)}px ${s.font}`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText(String(idx + 1).padStart(2, '0'), W - 18 * scale, 55 * scale);

  const pillX = 24 * scale, pillY = 28 * scale, pillW = 128 * scale, pillH = 28 * scale;
  ctx.fillStyle = isLight ? 'rgba(255,255,255,.68)' : 'rgba(255,255,255,.10)';
  roundBox(ctx, pillX, pillY, pillW, pillH, pillH / 2); ctx.fill();
  ctx.fillStyle = s.accent;
  ctx.beginPath(); ctx.arc(pillX + 15 * scale, pillY + pillH / 2, 3 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = s.fg;
  ctx.font = `700 ${Math.round(9.5 * scale)}px sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(s.label, pillX + 25 * scale, pillY + pillH / 2 + .5 * scale);

  const enter = easeOut(sceneProgress * 1.8);
  const exit = sceneProgress > .84 ? Math.max(0, 1 - (sceneProgress - .84) / .16) : 1;
  const alpha = Math.min(1, enter) * exit;
  const moveY = (1 - enter) * 28 * scale - (1 - exit) * 18 * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, moveY);
  const fontSize = Math.round(W / (line.length > 34 ? 16.5 : line.length > 22 ? 14.6 : 12.8));
  ctx.font = `800 ${fontSize}px ${s.font}`;
  const wrapped = wrapText(ctx, line, W * .78);
  const lineHeight = fontSize * 1.32;
  const blockY = H * .39;
  ctx.fillStyle = s.accent;
  roundBox(ctx, W * .11, blockY - 30 * scale, 42 * scale, 5 * scale, 3 * scale); ctx.fill();
  ctx.fillStyle = s.fg;
  ctx.shadowColor = isLight ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.30)';
  ctx.shadowBlur = 18 * scale;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  wrapped.forEach((part, i) => ctx.fillText(part, W * .11, blockY + i * lineHeight));
  ctx.shadowBlur = 0;
  ctx.restore();

  const captionY = H - 104 * scale;
  if (showSub) {
    ctx.fillStyle = isLight ? 'rgba(255,255,255,.74)' : 'rgba(5,8,18,.52)';
    roundBox(ctx, 22 * scale, captionY, W - 44 * scale, 54 * scale, 14 * scale); ctx.fill();
    ctx.fillStyle = s.accent;
    roundBox(ctx, 33 * scale, captionY + 13 * scale, 4 * scale, 28 * scale, 2 * scale); ctx.fill();
    ctx.fillStyle = s.fg;
    ctx.font = `600 ${Math.round(12.5 * scale)}px ${s.font}`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const sub = line.length > 24 ? line.slice(0, 24) + '…' : line;
    ctx.fillText(sub, 47 * scale, captionY + 27 * scale);
  }

  const gap = 4 * scale;
  const barW = (W - 44 * scale - gap * Math.max(0, total - 1)) / Math.max(1, total);
  for (let i = 0; i < total; i++) {
    ctx.fillStyle = i < idx ? colorAlpha(s.accent, .55) : i === idx ? s.accent : colorAlpha(s.fg, .16);
    roundBox(ctx, 22 * scale + i * (barW + gap), H - 26 * scale, barW, 3 * scale, 2 * scale); ctx.fill();
  }
  ctx.restore();
}

function drawFrame(idx){
  const c = $('#vPreview'); if (!c) return;
  const lines = (videoState.text || '输入文案开始生成').split('\n').filter(Boolean);
  const line = lines[idx] || lines[0] || '请输入文案';
  drawVideoScene(c.getContext('2d'), c.width, c.height, line, idx, lines.length || 1, 1, !!($('#vSub') && $('#vSub').checked));
}

function createAmbientTrack(duration, mode){
  if (mode === 'none') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ac = new AudioCtx();
  const dest = ac.createMediaStreamDestination();
  const filter = ac.createBiquadFilter();
  const master = ac.createGain();
  filter.type = 'lowpass';
  filter.frequency.value = mode === 'pulse' ? 1800 : 1200;
  master.gain.value = mode === 'pulse' ? .32 : .24;
  filter.connect(master); master.connect(dest);
  const start = ac.currentTime + .05;
  const roots = mode === 'pulse' ? [220, 261.63, 196, 246.94] : [174.61, 220, 196, 164.81];
  const part = Math.max(1.4, duration / roots.length);

  roots.forEach((root, i) => {
    const t0 = start + i * part;
    const t1 = Math.min(start + duration, t0 + part + .15);
    [1, 1.25, 1.5].forEach((ratio, voice) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = voice === 0 ? 'sine' : 'triangle';
      osc.frequency.value = root * ratio;
      osc.detune.value = voice === 2 ? -5 : voice === 1 ? 4 : 0;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(voice === 0 ? .026 : .012, t0 + .28);
      gain.gain.setValueAtTime(voice === 0 ? .026 : .012, Math.max(t0 + .3, t1 - .55));
      gain.gain.exponentialRampToValueAtTime(.0001, t1);
      osc.connect(gain); gain.connect(filter);
      osc.start(t0); osc.stop(t1 + .03);
    });
  });

  if (mode === 'pulse') {
    for (let t = start; t < start + duration; t += .72) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(92, t);
      osc.frequency.exponentialRampToValueAtTime(48, t + .16);
      gain.gain.setValueAtTime(.05, t);
      gain.gain.exponentialRampToValueAtTime(.0001, t + .18);
      osc.connect(gain); gain.connect(filter);
      osc.start(t); osc.stop(t + .2);
    }
  }
  ac.resume().catch(() => {});
  return {context:ac, tracks:dest.stream.getAudioTracks()};
}

async function renderVideo(){
  const text = $('#vText').value.trim();
  if (!text) { toast('请先输入文案', 'warn'); return; }
  if (videoState.rendering) return;
  videoState.rendering = true;

  const btn = $('#btnRender');
  btn.disabled = true; btn.textContent = '渲染中…';
  $('#vResultCard').style.display = 'none';

  const lines = text.split('\n').filter(Boolean);
  if (lines.length === 0) { toast('文案不能为空', 'warn'); videoState.rendering = false; btn.disabled = false; btn.textContent = '🎬 开始生成视频'; return; }

  const dur = +$('#vDur').value;
  const res = $('#vRes').value.split('x');
  const W = +res[0], H = +res[1];
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const font = (VSTYLES[videoState.style] || VSTYLES.news).font || 'sans-serif';
  const bg = videoState.bg, fg = videoState.fg, accent = videoState.accent;
  const showSub = $('#vSub').checked;

  const stream = c.captureStream(30);
  let audioTracks = [];
  let audioSession = null;
  try {
    audioSession = createAmbientTrack(dur, $('#vBgm').value);
    audioTracks = audioSession ? audioSession.tracks : [];
  } catch(e) { console.warn('Audio failed', e); }
  const tracks = [...stream.getVideoTracks(), ...audioTracks];
  const ms = new MediaStream(tracks);

  let mr;
  try {
    mr = new MediaRecorder(ms, { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 2000000 });
  } catch(e) {
    try { mr = new MediaRecorder(ms, { mimeType: 'video/webm' }); }
    catch(e2) { toast('浏览器不支持视频录制，请用Chrome/Edge', 'warn'); videoState.rendering = false; btn.disabled = false; btn.textContent = '🎬 开始生成视频'; return; }
  }
  const chunks = [];
  mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  mr.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    ms.getTracks().forEach(t => t.stop());
    if (audioSession) audioSession.context.close().catch(() => {});
    if (videoState.resultUrl) URL.revokeObjectURL(videoState.resultUrl);
    const url = URL.createObjectURL(blob);
    videoState.resultUrl = url;
    const card = $('#vResultCard');
    card.style.display = 'block';
    $('#vResultBody').innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        <video src="${url}" controls style="width:200px;border-radius:10px;background:#000"></video>
        <div style="flex:1;min-width:200px">
          <p style="font-size:13px;margin-bottom:8px"><b>格式：</b>WebM</p>
          <p style="font-size:13px;margin-bottom:8px"><b>时长：</b>${dur}秒</p>
          <p style="font-size:13px;margin-bottom:8px"><b>分辨率：</b>${W}×${H}</p>
          <p style="font-size:13px;margin-bottom:12px"><b>大小：</b>${(blob.size/1024/1024).toFixed(1)} MB</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a href="${url}" download="超级员工_视频_${Date.now()}.webm" class="btn primary sm">⬇ 下载视频</a>
            <button class="btn ghost sm" id="btnSaveVideoText">📚 保存文案</button>
          </div>
        </div>
      </div>`;
    $('#btnSaveVideoText').onclick = () => saveTextAsset({cat:'视频文案', title:S.videoDraft?.title || smartTitle(text), content:text, source:'video'});
    videoState.rendering = false;
    btn.disabled = false; btn.textContent = '🎬 重新生成';
    bump('video', 1); S.stats.minutes += 5; save();
    logAct('🎬', `生成视频「${lines[0].slice(0,14)}…」（${dur}s）`);
    const waiting = S.tasks.find(t => t.type === 'handoff' && t.status === 'ready' && t.ref === S.videoDraft?.id);
    if (waiting) { waiting.status = 'done'; waiting.detail = '已生成视频'; save(); }
    addTask('video', `生成视频：${S.videoDraft?.title || smartTitle(lines[0])}`, `${dur} 秒 · ${W}×${H}`);
    toast('视频生成完成！');
  };

  mr.start();
  const perLine = dur / lines.length;
  let curLine = 0;
  const t0 = performance.now();
  vAnimId = null;

  function animate(){
    const elapsed = (performance.now() - t0) / 1000;
    if (elapsed >= dur) { try{ mr.stop(); }catch(e){} return; }
    curLine = Math.min(lines.length - 1, Math.floor(elapsed / perLine));
    const localT = (elapsed - curLine * perLine) / perLine;

    drawVideoScene(ctx, W, H, lines[curLine], curLine, lines.length, localT, showSub);
    // update mini preview
    drawFrame(curLine);
    updateFrameInfo();
    videoState._frame = curLine;
    vAnimId = requestAnimationFrame(animate);
  }
  animate();
}

/* ================= 账号矩阵 ================= */
function renderAcct(){
  const pg = $('#pg-acct');
  const total = S.accounts.reduce((s, a) => s + (a.fans || 0), 0);
  const platforms = {};
  S.accounts.forEach(a => { platforms[a.platform] = (platforms[a.platform]||0) + 1; });
  pg.innerHTML = `
    <div class="stat-strip">
      <div class="mini-stat"><b>${S.accounts.length}</b><span>总账号数</span></div>
      <div class="mini-stat"><b>${fmtNum(total)}</b><span>总粉丝量</span></div>
      <div class="mini-stat"><b>${Object.keys(platforms).length}</b><span>覆盖平台</span></div>
      <div class="mini-stat"><b>${S.accounts.filter(a=>a.status==='正常').length}</b><span>正常账号</span></div>
    </div>
    <div class="card">
      <div class="card-h"><b>📱 账号列表</b><button class="btn primary sm" id="btnNewAcct">＋ 添加账号</button></div>
      <div class="card-b" style="padding:0">
        <div class="tbl-scroll">
          <table class="tbl">
            <thead><tr><th>平台</th><th>账号名称</th><th>粉丝数</th><th>状态</th><th>今日发布</th><th>备注</th><th>操作</th></tr></thead>
            <tbody id="acctBody"></tbody>
          </table>
        </div>
      </div>
    </div>`;
  function drawRows(){
    $('#acctBody').innerHTML = S.accounts.length ? S.accounts.map(a => `
      <tr>
        <td><span class="bdg ${a.platform==='抖音'?'b-pink':a.platform==='小红书'?'b-danger':a.platform==='视频号'?'b-blue':a.platform==='快手'?'b-orange':'b-gray'}">${esc(a.platform)}</span></td>
        <td><b>${esc(a.name)}</b></td>
        <td>${fmtNum(a.fans)}</td>
        <td><span class="bdg ${a.status==='正常'?'b-ok':'b-warn'}">${esc(a.status)}</span></td>
        <td>${a.posts} 条</td>
        <td style="color:#7a8095">${esc(a.note||'')}</td>
        <td>
          <button class="ibtn" data-edit="${a.id}" title="编辑">✏️</button>
          <button class="ibtn" data-del="${a.id}" title="删除">🗑</button>
        </td>
      </tr>`).join('') : '<tr><td colspan="7"><div class="empty">还没有账号，点右上角添加</div></td></tr>';
  }
  drawRows();
  $('#btnNewAcct').onclick = () => acctModal();
  $('#acctBody').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.dataset.edit || b.dataset.del;
    if (b.dataset.edit) acctModal(id);
    else confirmBox('删除该账号？', () => {
      S.accounts = S.accounts.filter(a => a.id !== id);
      save(); drawRows(); renderAcct(); toast('已删除');
    });
  };
}

function acctModal(id){
  const a = id ? S.accounts.find(x => x.id === id) : null;
  modal(a ? '编辑账号' : '添加账号', `
    <div class="row2">
      <div class="fld"><label>平台</label><select id="acPlat" class="sel">
        ${['抖音','小红书','视频号','快手','B站','微博','知乎'].map(p => `<option ${a&&a.platform===p?'selected':''}>${p}</option>`).join('')}
      </select></div>
      <div class="fld"><label>账号名称</label><input id="acName" class="inp" value="${a?esc(a.name):''}" placeholder="如：煜哥说创业"></div>
    </div>
    <div class="row2">
      <div class="fld"><label>粉丝数</label><input id="acFans" class="inp" type="number" value="${a?a.fans:''}" placeholder="0"></div>
      <div class="fld"><label>状态</label><select id="acStatus" class="sel">
        <option ${a&&a.status==='正常'?'selected':''}>正常</option>
        <option ${a&&a.status==='限流'?'selected':''}>限流</option>
        <option ${a&&a.status==='封禁'?'selected':''}>封禁</option>
        <option ${a&&a.status==='养号中'?'selected':''}>养号中</option>
      </select></div>
    </div>
    <div class="row2">
      <div class="fld"><label>今日发布数</label><input id="acPosts" class="inp" type="number" value="${a?a.posts:0}" placeholder="0"></div>
      <div class="fld"><label>备注</label><input id="acNote" class="inp" value="${a?esc(a.note||''):''}" placeholder="运营备注"></div>
    </div>`,
    `<button class="btn ghost" onclick="closeModal()">取消</button><button class="btn primary" id="acOk">${a?'保存':'添加'}</button>`);
  $('#acOk').onclick = () => {
    const name = $('#acName').value.trim();
    if (!name) { toast('请填写账号名称', 'warn'); return; }
    const data = {
      platform: $('#acPlat').value, name,
      fans: +$('#acFans').value || 0,
      status: $('#acStatus').value,
      posts: +$('#acPosts').value || 0,
      note: $('#acNote').value.trim()
    };
    if (a) { Object.assign(a, data); toast('已保存'); }
    else { S.accounts.push({id: uid(), ...data}); logAct('📱', `添加账号「${name}」`); toast('已添加'); }
    save(); closeModal(); renderAcct();
  };
}

/* ================= 客户管理 ================= */
function renderCust(){
  const pg = $('#pg-cust');
  const stages = { '潜在':0, '意向':0, '已成交':0, '已流失':0 };
  S.customers.forEach(c => { if (stages[c.stage] !== undefined) stages[c.stage]++; });
  const maxV = Math.max(1, ...Object.values(stages));
  pg.innerHTML = `
    <div class="row2" style="margin-bottom:16px;align-items:start">
      <div class="card">
        <div class="card-h"><b>📊 客户漏斗</b></div>
        <div class="card-b">
          <div class="funnel">
            ${Object.entries(stages).map(([k,v], i) => {
              const colors = ['#a78bfa','#818cf8','#34d399','#fb7185'];
              return `<div class="f-row">
                <div class="f-lab">${k}</div>
                <div class="f-bar" style="width:${Math.max(20, v/maxV*100)}%;background:${colors[i]}">${v}</div>
                <div class="f-cnt">${v} 人</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><b>📋 客户列表</b><button class="btn primary sm" id="btnNewCust">＋ 添加</button></div>
        <div class="card-b" style="padding:0">
          <div class="tbl-scroll">
            <table class="tbl">
              <thead><tr><th>客户</th><th>来源</th><th>阶段</th><th>标签</th><th>备注</th><th></th></tr></thead>
              <tbody id="custBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
  function drawRows(){
    $('#custBody').innerHTML = S.customers.length ? S.customers.map(c => `
      <tr>
        <td><b>${esc(c.name)}</b><br><span style="font-size:11px;color:#9aa0b4">${esc(c.contact||'')}</span></td>
        <td>${esc(c.source||'')}</td>
        <td><span class="bdg ${c.stage==='已成交'?'b-ok':c.stage==='意向'?'b-primary':c.stage==='潜在'?'b-warn':'b-gray'}">${esc(c.stage)}</span></td>
        <td style="font-size:12px">${esc(c.tags||'')}</td>
        <td style="color:#7a8095;font-size:12px">${esc(c.note||'')}</td>
        <td><button class="ibtn" data-edit="${c.id}">✏️</button><button class="ibtn" data-del="${c.id}">🗑</button></td>
      </tr>`).join('') : '<tr><td colspan="6"><div class="empty">还没有客户记录</div></td></tr>';
  }
  drawRows();
  $('#btnNewCust').onclick = () => custModal();
  $('#custBody').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.dataset.edit || b.dataset.del;
    if (b.dataset.edit) custModal(id);
    else confirmBox('删除该客户？', () => {
      S.customers = S.customers.filter(x => x.id !== id);
      save(); drawRows(); renderCust(); toast('已删除');
    });
  };
}

function custModal(id){
  const c = id ? S.customers.find(x => x.id === id) : null;
  modal(c ? '编辑客户' : '添加客户', `
    <div class="row2">
      <div class="fld"><label>客户姓名</label><input id="cuName" class="inp" value="${c?esc(c.name):''}" placeholder="如：王女士"></div>
      <div class="fld"><label>联系方式</label><input id="cuContact" class="inp" value="${c?esc(c.contact||''):''}" placeholder="微信/手机号"></div>
    </div>
    <div class="row2">
      <div class="fld"><label>来源</label><select id="cuSource" class="sel">
        ${['抖音私信','小红书评论','朋友介绍','线下到店','电话咨询','其他'].map(s => `<option ${c&&c.source===s?'selected':''}>${s}</option>`).join('')}
      </select></div>
      <div class="fld"><label>阶段</label><select id="cuStage" class="sel">
        ${['潜在','意向','已成交','已流失'].map(s => `<option ${c&&c.stage===s?'selected':''}>${s}</option>`).join('')}
      </select></div>
    </div>
    <div class="fld"><label>标签（逗号分隔）</label><input id="cuTags" class="inp" value="${c?esc(c.tags||''):''}" placeholder="如：母婴,复购潜力"></div>
    <div class="fld"><label>跟进备注</label><textarea id="cuNote" class="ta" rows="2" placeholder="跟进情况">${c?esc(c.note||''):''}</textarea></div>`,
    `<button class="btn ghost" onclick="closeModal()">取消</button><button class="btn primary" id="cuOk">${c?'保存':'添加'}</button>`);
  $('#cuOk').onclick = () => {
    const name = $('#cuName').value.trim();
    if (!name) { toast('请填写客户姓名', 'warn'); return; }
    const data = {
      name, contact: $('#cuContact').value.trim(),
      source: $('#cuSource').value, stage: $('#cuStage').value,
      tags: $('#cuTags').value.trim(), note: $('#cuNote').value.trim()
    };
    if (c) { Object.assign(c, data); toast('已保存'); }
    else { S.customers.push({id: uid(), ...data}); logAct('🤝', `添加客户「${name}」`); toast('已添加'); }
    save(); closeModal(); renderCust();
  };
}

/* ================= 素材库 ================= */
function imageForStorage(file){
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type).startsWith('image/')) { reject(new Error('不是图片文件')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片格式不受支持'));
      img.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(c.toDataURL(type, .82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderAsset(){
  const pg = $('#pg-asset');
  const cats = [...new Set(S.assetsText.map(a => a.cat))];
  pg.innerHTML = `
    <div class="tabs" id="asTabs" style="margin-bottom:16px">
      <button class="tab active" data-t="text">📝 文案素材</button>
      <button class="tab" data-t="img">🖼️ 图片素材</button>
    </div>
    <div id="asTextPanel">
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><b>📝 文案库</b><button class="btn primary sm" id="btnNewAsset">＋ 添加文案</button></div>
        <div class="card-b">
          ${cats.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px" id="asCatFilter">
            <span class="chip active" data-cat="">全部</span>
            ${cats.map(c => `<span class="chip" data-cat="${esc(c)}">${esc(c)}</span>`).join('')}
          </div>` : ''}
          <div id="asTextList"></div>
        </div>
      </div>
    </div>
    <div id="asImgPanel" style="display:none">
      <div class="card">
        <div class="card-h"><b>🖼️ 图片库</b><button class="btn primary sm" id="btnUpImg">＋ 上传图片</button>
          <input type="file" id="asImgInput" accept="image/*" multiple style="display:none"></div>
        <div class="card-b">
          <div id="asImgGrid" class="img-grid"></div>
        </div>
      </div>
    </div>`;
  let curCat = '';
  function drawText(){
    const list = curCat ? S.assetsText.filter(a => a.cat === curCat) : S.assetsText;
    $('#asTextList').innerHTML = list.length ? list.map(a => `
      <div class="asset-item">
        <div class="as-body">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
            <span class="bdg b-primary">${esc(a.cat)}</span>
            <b>${esc(a.title)}</b>
          </div>
          <p>${esc(a.content)}</p>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="ibtn" data-copy="${a.id}" title="复制内容">📋</button>
          <button class="ibtn" data-video="${a.id}" title="做成视频">🎬</button>
          <button class="ibtn" data-edit="${a.id}" title="编辑">✏️</button>
          <button class="ibtn" data-del="${a.id}" title="删除">🗑</button>
        </div>
      </div>`).join('') : '<div class="empty">还没有文案素材</div>';
  }
  drawText();
  function drawImgs(){
    const grid = $('#asImgGrid');
    grid.innerHTML = S.assetsImg.length ? S.assetsImg.map(a => `
      <div class="img-cell">
        <img src="${a.data}" alt="${esc(a.title)}">
        <div class="im-op"><span>${esc(a.title)}</span><button class="ibtn" data-delimg="${a.id}">🗑</button></div>
      </div>`).join('') : '<div class="empty" style="grid-column:1/-1">还没有图片素材</div>';
  }
  drawImgs();
  $('#asTabs .tab').forEach(t => t.onclick = () => {
    $$('#asTabs .tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const isImg = t.dataset.t === 'img';
    $('#asTextPanel').style.display = isImg ? 'none' : '';
    $('#asImgPanel').style.display = isImg ? '' : 'none';
  });
  $('#asCatFilter') && $$('#asCatFilter .chip').forEach(c => c.onclick = () => {
    $$('#asCatFilter .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); curCat = c.dataset.cat; drawText();
  });
  $('#btnNewAsset').onclick = () => assetModal();
  $('#btnUpImg').onclick = () => $('#asImgInput').click();
  $('#asImgInput').onchange = async e => {
    const files = [...e.target.files].slice(0, 6);
    if (!files.length) return;
    let done = 0;
    for (const f of files) {
      try {
        const data = await imageForStorage(f);
        S.assetsImg.push({id: uid(), title:f.name.slice(0, 20), data, createdAt:new Date().toISOString()});
        done++;
      } catch(err) { console.warn(err); }
    }
    save(); drawImgs();
    toast(done ? `已压缩并保存 ${done} 张图片` : '图片读取失败', done ? '' : 'warn');
    e.target.value = '';
  };
  $('#asTextList').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) {
      const a = S.assetsText.find(x => x.id === b.dataset.copy);
      if (a) copyText(a.content);
    } else if (b.dataset.video) {
      const a = S.assetsText.find(x => x.id === b.dataset.video);
      if (a) sendToVideo(a.content, a.title, 'asset');
    } else if (b.dataset.edit) {
      assetModal(b.dataset.edit);
    } else if (b.dataset.del) {
      confirmBox('删除该文案？', () => {
        S.assetsText = S.assetsText.filter(x => x.id !== b.dataset.del);
        save(); renderAsset(); toast('已删除');
      });
    }
  };
  $('#asImgGrid').onclick = e => {
    const b = e.target.closest('[data-delimg]'); if (!b) return;
    confirmBox('删除该图片？', () => {
      S.assetsImg = S.assetsImg.filter(x => x.id !== b.dataset.delimg);
      save(); drawImgs(); toast('已删除');
    });
  };
}

function assetModal(id){
  const a = id ? S.assetsText.find(x => x.id === id) : null;
  modal(a ? '编辑文案' : '添加文案', `
    <div class="row2">
      <div class="fld"><label>分类</label><input id="asCat" class="inp" value="${a?esc(a.cat):''}" placeholder="如：爆款标题"></div>
      <div class="fld"><label>标题</label><input id="asTitle" class="inp" value="${a?esc(a.title):''}" placeholder="如：万能开头公式"></div>
    </div>
    <div class="fld"><label>内容</label><textarea id="asContent" class="ta" rows="4" placeholder="文案正文…">${a?esc(a.content||''):''}</textarea></div>`,
    `<button class="btn ghost" onclick="closeModal()">取消</button><button class="btn primary" id="asOk">${a?'保存':'添加'}</button>`);
  $('#asOk').onclick = () => {
    const cat = $('#asCat').value.trim() || '未分类';
    const title = $('#asTitle').value.trim();
    const content = $('#asContent').value.trim();
    if (!title || !content) { toast('请填写标题和内容', 'warn'); return; }
    if (a) { Object.assign(a, {cat, title, content}); toast('已保存'); }
    else { S.assetsText.unshift({id: uid(), cat, title, content, source:'manual', createdAt:new Date().toISOString()}); logAct('📚', `添加文案「${title}」`); addTask('asset', `添加素材：${title}`, cat); toast('已添加'); }
    save(); closeModal(); renderAsset();
  };
}

/* ================= 系统设置 ================= */
function renderSet(){
  const pg = $('#pg-set');
  const st = S.settings;
  pg.innerHTML = `
    <div class="set-grid">
      <div class="card">
        <div class="card-h"><b>🔌 AI接口配置</b></div>
        <div class="card-b">
          <div class="fld"><label>API地址（OpenAI兼容，含 https://）</label>
            <input id="setApiBase" class="inp" value="${esc(st.apiBase)}" placeholder="如：https://api.deepseek.com/v1"></div>
          <div class="fld"><label>API Key</label>
            <input id="setApiKey" class="inp" type="password" value="${esc(st.apiKey)}" placeholder="sk-..."></div>
          <div class="fld"><label>模型名称</label>
            <input id="setModel" class="inp" value="${esc(st.model)}" placeholder="如：deepseek-chat / gpt-4o-mini / qwen-plus"></div>
          <div class="fld">
            <label class="ck"><input type="checkbox" id="setDemo" ${st.demoOnly?'checked':''}> 仅用演示模式（不调用AI接口）</label>
          </div>
          <div class="row2">
            <button class="btn primary" id="btnSaveSet">💾 保存配置</button>
            <button class="btn ghost" id="btnTestApi">🧪 测试连接</button>
          </div>
          <div class="note">
            <b>支持的接口（任选一种）：</b><br>
            · DeepSeek — <code>https://api.deepseek.com/v1</code> + 模型 <code>deepseek-chat</code><br>
            · 通义千问 — <code>https://dashscope.aliyuncs.com/compatible-mode/v1</code> + <code>qwen-plus</code><br>
            · Kimi — <code>https://api.moonshot.cn/v1</code> + <code>moonshot-v1-8k</code><br>
            · OpenAI — <code>https://api.openai.com/v1</code> + <code>gpt-4o-mini</code><br>
            · 本地Ollama — <code>http://localhost:11434/v1</code> + <code>llama3.1</code><br>
            <b>Demo 提醒：</b>API Key 只保存在当前浏览器，导出备份时会自动排除；请使用可随时撤销的测试 Key。
          </div>
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-h"><b>💾 数据管理</b></div>
          <div class="card-b">
            <button class="btn primary block" id="btnExport" style="margin-bottom:10px">📦 导出全部数据（备份）</button>
            <button class="btn ghost block" id="btnImport" style="margin-bottom:10px">📥 导入数据（恢复）</button>
            <input type="file" id="importFile" accept=".json" style="display:none">
            <button class="btn danger block" id="btnReset" style="margin-bottom:10px">🗑 清空所有数据（重置）</button>
            <div class="note">
              <b>数据存储位置：</b>浏览器 localStorage<br>
              <b>迁移方式：</b>导出 → 传给对方 → 对方导入，或直接拷贝 <code>index.html</code> + <code>app.js</code> + <code>app2.js</code> 三个文件即可<br>
              <b>快捷键：</b><span class="kbd">Ctrl+S</span> 随时保存
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><b>ℹ️ 关于</b></div>
          <div class="card-b">
            <div style="font-size:13px;line-height:2;color:#4b5162">
              <b>超级员工 · AI智能体工作台</b><br>
              版本：v${APP_VERSION} 可用 Demo<br>
              架构：纯前端 HTML + JS，零后端依赖<br>
              数据：业务数据保存在本机；真实 AI 模式会把对话发送到你配置的模型服务<br>
              部署：拷贝3个文件到任何电脑，双击 <code>index.html</code> 即用
            </div>
          </div>
        </div>
      </div>
    </div>`;
  $('#btnSaveSet').onclick = () => {
    st.apiBase = $('#setApiBase').value.trim();
    st.apiKey = $('#setApiKey').value.trim();
    st.model = $('#setModel').value.trim() || 'gpt-4o-mini';
    st.demoOnly = $('#setDemo').checked;
    save(); updateApiBadge(); toast('配置已保存');
    if (isLive()) logAct('🔌', '已接入AI接口');
  };
  $('#btnTestApi').onclick = async () => {
    const base = $('#setApiBase').value.trim();
    const key = $('#setApiKey').value.trim();
    const model = $('#setModel').value.trim() || 'gpt-4o-mini';
    if (!base || !key) { toast('请先填写API地址和Key', 'warn'); return; }
    const btn = $('#btnTestApi'); btn.disabled = true; btn.textContent = '测试中…';
    try {
      const res = await fetch(base.replace(/\/+$/,'') + '/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer ' + key},
        body: JSON.stringify({model, messages:[{role:'user',content:'你好'}], max_tokens:10})
      });
      if (res.ok) {
        toast('✅ 连接成功！AI接口可用');
        st.apiBase = base; st.apiKey = key; st.model = model;
        save(); updateApiBadge();
      } else {
        const t = await res.text().catch(() => '');
        toast('❌ HTTP ' + res.status + '：' + t.slice(0, 80), 'warn');
      }
    } catch(e) { toast('❌ 连接失败：' + e.message, 'warn'); }
    btn.disabled = false; btn.textContent = '🧪 测试连接';
  };
  $('#btnExport').onclick = () => {
    const exported = JSON.parse(JSON.stringify(S));
    if (exported.settings) exported.settings.apiKey = '';
    const data = JSON.stringify(exported, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '超级员工_数据备份_' + todayStr().replace(/\//g,'') + '.json';
    a.click();
    toast('已导出备份（API Key 未包含）');
  };
  $('#btnImport').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('INVALID_BACKUP');
        S = normalizeState(data);
        save(); toast('导入成功！页面将刷新'); setTimeout(() => location.reload(), 800);
      } catch(err) { toast('文件格式错误', 'warn'); }
    };
    reader.readAsText(f);
  };
  $('#btnReset').onclick = () => confirmBox('确定清空所有数据？此操作不可恢复！', () => {
    localStorage.removeItem(DATA_KEY);
    S = defaultState(); seed(); save();
    toast('已重置，页面将刷新'); setTimeout(() => location.reload(), 800);
  });
}

/* ================= 初始化 ================= */
function init(){
  load(); seed(); save();
  $$('.nav-item').forEach(n => n.onclick = () => go(n.dataset.pg));
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); toast('已保存'); }
  });
  go('dash');
  updateApiBadge();
}
init();
