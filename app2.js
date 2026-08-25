"use strict";

/* ================= 视频工厂 ================= */
let videoState = { style:'news', bg:'#1a1a2e', fg:'#fff', accent:'#f92672', dur:15, text:'', progress:0, rendering:false, result:null };
let vAnimId = null, vStartT = 0;

const VSTYLES = {
  news:    { name:'资讯播报', bg:'#0f0f1e', fg:'#fff',     accent:'#00e5ff', font:'sans-serif' },
  pink:    { name:'种草安利', bg:'#ff6b9d', fg:'#fff',     accent:'#fff48a', font:'sans-serif' },
  dark:    { name:'暗黑科技', bg:'#0a0a0a', fg:'#00ff88',  accent:'#ff0055', font:'monospace' },
  warm:    { name:'温暖日常', bg:'#f5a623', fg:'#3d1c00',  accent:'#b40000', font:'serif' },
  minimal: { name:'极简白',  bg:'#fff',     fg:'#1a1a1a',  accent:'#0066ff', font:'sans-serif' },
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
              <div class="fld"><label><label class="ck"><input type="checkbox" id="vBgm" checked> 添加节奏BGM（合成）</label></label></div>
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
              <b>建议：</b>文案每句一行，会自动拆成画面帧；时长越长每句停留越久；生成后右键视频可"另存为"下载到本地。
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
    `<span class="chip ${k===videoState.style?'active':''}" data-s="${k}">${v.name}</span>`).join('');
  ss.querySelectorAll('.chip').forEach(c => c.onclick = () => {
    videoState.style = c.dataset.s;
    const s = VSTYLES[videoState.style];
    videoState.bg = s.bg; videoState.fg = s.fg; videoState.accent = s.accent;
    ss.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === c));
    drawFrame(videoState._frame || 0);
  });
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

function drawFrame(idx){
  const c = $('#vPreview'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const s = VSTYLES[videoState.style] || VSTYLES.news;
  const bg = videoState.bg || s.bg;
  const fg = videoState.fg || s.fg;
  const accent = videoState.accent || s.accent;
  const font = s.font || 'sans-serif';

  // bg
  const g = ctx.createLinearGradient(0, 0, 0, H);
  const bg2 = bg.length === 7 ? bg + '88' : bg;
  g.addColorStop(0, bg); g.addColorStop(1, bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // accent shapes
  ctx.fillStyle = accent;
  ctx.globalAlpha = .07;
  ctx.beginPath(); ctx.arc(W*.8, H*.15, W*.5, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(W*.2, H*.85, W*.4, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;

  // accent bar top
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 5);

  // text
  const lines = (videoState.text || '输入文案开始生成').split('\n').filter(Boolean);
  const line = lines[idx] || lines[0] || '请输入文案';
  ctx.fillStyle = fg;
  ctx.font = `bold ${Math.round(W/14)}px ${font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const wrapped = wrapText(ctx, line, W * .82);
  const lh = Math.round(W / 14) * 1.35;
  const startY = H/2 - (wrapped.length-1)*lh/2;
  wrapped.forEach((l, i) => { ctx.fillText(l, W/2, startY + i*lh); });

  // subtitle bar
  if ($('#vSub') && $('#vSub').checked) {
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0, H - 68, W, 68);
    ctx.fillStyle = accent;
    ctx.fillRect(20, H - 58, 4, 46);
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(W/22)}px ${font}`;
    ctx.textAlign = 'left';
    const sub = line.length > 22 ? line.slice(0, 22) + '…' : line;
    ctx.fillText(sub, 36, H - 30);
  }

  // frame number
  ctx.fillStyle = fg;
  ctx.globalAlpha = .4;
  ctx.font = `12px monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(`${idx+1}/${lines.length||1}`, W - 12, 20);
  ctx.globalAlpha = 1;
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
  if ($('#vBgm').checked) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const dest = ac.createMediaStreamDestination();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(dest);
      gain.gain.value = .03;
      const notes = [261.63, 329.63, 392, 329.63, 261.63, 196, 261.63, 329.63];
      let nIdx = 0, nTime = 0;
      osc.frequency.setValueAtTime(notes[0], 0);
      const beat = dur / notes.length;
      for (let i = 1; i < notes.length; i++) {
        osc.frequency.setValueAtTime(notes[i % notes.length], i * beat);
      }
      osc.start(); osc.stop(ac.currentTime + dur);
      audioTracks = dest.stream.getAudioTracks();
    } catch(e) { console.warn('Audio failed', e); }
  }
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
    const url = URL.createObjectURL(blob);
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
          <a href="${url}" download="超级员工_视频_${Date.now()}.webm" class="btn primary sm">⬇ 下载视频</a>
        </div>
      </div>`;
    videoState.rendering = false;
    btn.disabled = false; btn.textContent = '🎬 重新生成';
    bump('video', 1); S.stats.minutes += 5; save();
    logAct('🎬', `生成视频「${lines[0].slice(0,14)}…」（${dur}s）`);
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

    // bg
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bg); g.addColorStop(1, bg + '88');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // shapes
    ctx.fillStyle = accent; ctx.globalAlpha = .07;
    ctx.beginPath(); ctx.arc(W*.8, H*.15, W*.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(W*.2, H*.85, W*.4, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 6);
    // text
    ctx.fillStyle = fg;
    ctx.font = `bold ${Math.round(W/14)}px ${font}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const wrapped = wrapText(ctx, lines[curLine], W * .82);
    const lh = Math.round(W/14) * 1.35;
    const startY = H/2 - (wrapped.length-1)*lh/2;
    // 逐字渐入
    wrapped.forEach((l, i) => {
      const charCount = l.length;
      const visible = Math.floor(charCount * Math.min(1, localT * 2));
      const shown = l.slice(0, Math.max(1, visible));
      ctx.fillText(shown, W/2, startY + i * lh);
    });
    // progress bar
    ctx.fillStyle = accent; ctx.globalAlpha = .3;
    ctx.fillRect(0, H - 4, W * (elapsed / dur), 4);
    ctx.globalAlpha = 1;
    // sub
    if (showSub) {
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(0, H - 72, W, 72);
      ctx.fillStyle = accent; ctx.fillRect(22, H - 60, 4, 48);
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(W/22)}px ${font}`;
      ctx.textAlign = 'left';
      const sub = lines[curLine].length > 22 ? lines[curLine].slice(0,22) + '…' : lines[curLine];
      ctx.fillText(sub, 38, H - 30);
    }
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
  $('#asImgInput').onchange = e => {
    const files = [...e.target.files];
    if (!files.length) return;
    let done = 0;
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        S.assetsImg.push({id: uid(), title: f.name.slice(0, 20), data: ev.target.result});
        done++;
        if (done === files.length) { save(); drawImgs(); toast(`已上传 ${files.length} 张图片`); }
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };
  $('#asTextList').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) {
      const a = S.assetsText.find(x => x.id === b.dataset.copy);
      if (a) copyText(a.content);
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
    else { S.assetsText.push({id: uid(), cat, title, content}); logAct('📚', `添加文案「${title}」`); toast('已添加'); }
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
            · 本地Ollama — <code>http://localhost:11434/v1</code> + <code>llama3.1</code>
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
              版本：v1.0 便携版<br>
              架构：纯前端 HTML + JS，零后端依赖<br>
              数据：100% 本地存储，断网可用<br>
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
    const data = JSON.stringify(S, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '超级员工_数据备份_' + todayStr().replace(/\//g,'') + '.json';
    a.click();
    toast('已导出备份文件');
  };
  $('#btnImport').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        S = Object.assign(defaultState(), data);
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
