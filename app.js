"use strict";
/* ================= 工具函数 ================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmtNum = n => n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n);
const nowTime = () => new Date().toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'});
const todayStr = () => new Date().toLocaleDateString('zh-CN');
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const APP_VERSION = '0.2.0';

function copyText(t){
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).then(()=>toast('已复制到剪贴板')).catch(()=>fallbackCopy(t));
  } else fallbackCopy(t);
}
function fallbackCopy(t){
  const ta = document.createElement('textarea');
  ta.value = t; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('已复制'); } catch(e) { toast('复制失败','warn'); }
  ta.remove();
}

function toast(msg, type){
  const w = $('#toastWrap');
  const d = document.createElement('div');
  d.className = 'toast' + (type ? ' ' + type : '');
  d.textContent = msg;
  w.appendChild(d);
  setTimeout(()=>{ d.style.opacity='0'; d.style.transform='translateY(-8px)'; }, 2300);
  setTimeout(()=>d.remove(), 2700);
}

function modal(title, body, foot){
  const root = $('#modalRoot');
  root.innerHTML = `<div class="mask"><div class="modal">
    <div class="modal-h"><b>${title}</b><span class="mclose" onclick="closeModal()">✕</span></div>
    <div class="modal-b">${body}</div>
    ${foot ? `<div class="modal-f">${foot}</div>` : ''}
  </div></div>`;
  root.querySelector('.mask').addEventListener('mousedown', e => {
    if (e.target.classList.contains('mask')) closeModal();
  });
  return root.querySelector('.modal');
}
function closeModal(){ $('#modalRoot').innerHTML = ''; }
function confirmBox(msg, cb){
  modal('请确认', `<p style="line-height:1.9;font-size:13.5px">${msg}</p>`,
    `<button class="btn ghost" onclick="closeModal()">取消</button><button class="btn danger" id="cfOk">确定</button>`);
  $('#cfOk').onclick = () => { closeModal(); cb(); };
}

/* ================= 数据状态（localStorage 全本地） ================= */
const DATA_KEY = 'superstaff_v1';

const PRESET_AGENTS = [
  {key:'script', emoji:'🎬', name:'短视频编剧', desc:'爆款钩子、口播脚本、分镜', builtin:true,
   prompt:'你是顶级短视频编剧，精通抖音/快手爆款逻辑。用户给你一个主题，你输出：开头3秒钩子、15秒干货主体、结尾引导关注的完整口播脚本，并给出画面建议和BGM推荐。语言口语化、有网感。',
   try:['帮我写一条"新手做副业"的开场钩子','生成一条护肤品种草的30秒脚本','写一个办公室搞笑短剧的剧本框架']},
  {key:'xhs', emoji:'📕', name:'小红书文案官', desc:'种草笔记、标题、标签一把梭', builtin:true,
   prompt:'你是小红书爆款文案专家。输出结构：抓眼球的标题（带emoji）+ 正文（分点、口语化、多emoji）+ 相关话题标签。严格遵循小红书社区语感，真实、不硬广。',
   try:['写一篇"居家咖啡角"的种草笔记','帮我写"减肥代餐"的小红书文案','生成5个母婴好物的爆款标题']},
  {key:'service', emoji:'💬', name:'客服话术专家', desc:'高情商回复、投诉处理', builtin:true,
   prompt:'你是金牌客服教练。根据用户描述的客户场景，给出：客户心理分析、3种不同风格的高情商回复话术、以及后续跟进建议。语气专业且温暖。',
   try:['客户说太贵了怎么回复','客户投诉物流慢，帮我写道歉话术','怎么礼貌地催客户下单']},
  {key:'report', emoji:'📊', name:'周报生成器', desc:'把流水账变成亮眼周报', builtin:true,
   prompt:'你是职场写作高手。用户输入本周做的事情（可以很零散），你把它整理成一份结构清晰的周报：本周成果（量化）、亮点分析、问题与风险、下周计划。用词专业、突出价值。',
   try:['这周改了3个bug，开了2个会，帮同事做了个表格','帮我把"上线了新功能"写成周报','月底总结了，帮我把碎事整理成汇报']},
  {key:'title', emoji:'🏷️', name:'爆款标题大师', desc:'一条素材，百条标题', builtin:true,
   prompt:'你是标题狙击手。根据用户给的主题或素材，一次性输出10条不同风格的爆款标题：悬念式、数字式、反差式、痛点式、利益式等，每条标注所属风格，并推荐最优的一条。',
   try:['主题：30岁转行做自媒体','给"自制减脂餐"起10个标题','我的产品是手工皮具，帮我起标题']},
];

const PRESET_FLOWS = [
  {name:'爆款内容流水线', desc:'输入一个主题，自动产出：选题分析 → 10个标题 → 口播脚本 → 发布文案',
   steps:[
     {name:'选题分析', prompt:'你是内容策划专家。分析这个主题的爆款潜力和目标人群，输出3个切入角度：'},
     {name:'生成标题', prompt:'你是标题专家。基于以下分析，生成10条爆款标题，标注风格，并推荐最优1条：'},
     {name:'口播脚本', prompt:'你是短视频编剧。根据以下标题和分析，写一条30秒口播脚本，包含0-3秒钩子：'},
     {name:'发布文案', prompt:'你是社媒运营。根据以下脚本，生成发布文案（含emoji）和10个推荐标签：'},
   ], runs:0},
  {name:'客户跟进流水线', desc:'输入客户情况，自动产出：画像分析 → 定制开场白 → 3轮跟进节奏',
   steps:[
     {name:'客户画像', prompt:'你是销售顾问。根据以下信息分析客户类型、购买意向、决策顾虑：'},
     {name:'定制开场白', prompt:'基于以下分析，写3条不同风格的微信开场白，要自然不油腻：'},
     {name:'跟进节奏', prompt:'基于以上内容，制定为期一周的3次跟进计划，每次给出具体话术和发送时间建议：'},
   ], runs:0},
];

function defaultState(){
  return {
    version: 2,
    settings:{apiBase:'', apiKey:'', model:'gpt-4o-mini', demoOnly:false},
    agents:[], flows:[], accounts:[], customers:[],
    assetsText:[], assetsImg:[],
    stats:{msg:0, video:0, run:0, minutes:0},
    activities:[], tasks:[], chats:{}, videoDraft:null, seeded:false
  };
}
let S = defaultState();

function normalizeState(data){
  const defaults = defaultState();
  const src = data && typeof data === 'object' ? data : {};
  const next = Object.assign({}, defaults, src);
  next.settings = Object.assign({}, defaults.settings, src.settings || {});
  next.stats = Object.assign({}, defaults.stats, src.stats || {});
  ['agents','flows','accounts','customers','assetsText','assetsImg','activities','tasks'].forEach(k => {
    if (!Array.isArray(next[k])) next[k] = [];
  });
  if (!next.chats || typeof next.chats !== 'object' || Array.isArray(next.chats)) next.chats = {};
  next.version = 2;
  return next;
}

function load(){
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) S = normalizeState(JSON.parse(raw));
  } catch(e) { console.warn('读取本地数据失败', e); }
}
function save(){
  try { localStorage.setItem(DATA_KEY, JSON.stringify(S)); }
  catch(e) { toast('本地存储空间不足，建议清理图片素材', 'warn'); }
}
function logAct(ico, txt){
  S.activities.unshift({ico, txt, time: todayStr() + ' ' + nowTime()});
  S.activities = S.activities.slice(0, 30);
  save();
}
function bump(k, n){ S.stats[k] = (S.stats[k] || 0) + n; save(); }

function addTask(type, title, detail = '', status = 'done', ref = ''){
  const task = {id:uid(), type, title, detail, status, ref, time:todayStr() + ' ' + nowTime()};
  S.tasks.unshift(task);
  S.tasks = S.tasks.slice(0, 50);
  save();
  return task;
}

function smartTitle(text, fallback = '未命名内容'){
  const clean = String(text || '').replace(/<[^>]+>/g, ' ').replace(/🎭\s*演示模式\s*·\s*在「系统设置」接入AI后即为真实智能回答/g, ' ').replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, 28) + (clean.length > 28 ? '…' : '') : fallback;
}

function saveTextAsset({cat = 'AI生成', title = '', content = '', source = 'manual'} = {}){
  const clean = String(content || '').trim();
  if (!clean) { toast('没有可保存的内容', 'warn'); return null; }
  const finalTitle = String(title || '').trim() || smartTitle(clean);
  const duplicate = S.assetsText.find(a => a.content === clean && a.title === finalTitle);
  if (duplicate) { toast('这份内容已在素材库中'); return duplicate; }
  const item = {id:uid(), cat, title:finalTitle, content:clean, source, createdAt:new Date().toISOString()};
  S.assetsText.unshift(item);
  addTask('asset', `保存素材：${finalTitle}`, cat);
  logAct('📚', `保存文案「${finalTitle}」`);
  toast('已保存到素材库');
  return item;
}

function toVideoScript(content){
  const raw = String(content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/🎭\s*演示模式\s*·\s*在「系统设置」接入AI后即为真实智能回答/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*(?:#{1,6}\s*|[-*>•]\s*|\d+[.、]\s*)/gm, '')
    .replace(/\*\*/g, '')
    .trim();
  if (!raw) return '';
  let lines = raw.split(/\n+/).map(s => s.trim()).filter(Boolean);
  if (lines.length < 2) lines = raw.split(/(?<=[。！？!?；;])/).map(s => s.trim()).filter(Boolean);
  return lines.slice(0, 10).map(line => line.length > 52 ? line.slice(0, 52) + '…' : line).join('\n');
}

function sendToVideo(content, title = '', source = 'manual'){
  const script = toVideoScript(content);
  if (!script) { toast('没有可用于视频的文案', 'warn'); return; }
  const finalTitle = String(title || '').trim() || smartTitle(script, '视频文案');
  S.videoDraft = {id:uid(), title:finalTitle, content:script, source, createdAt:new Date().toISOString()};
  addTask('handoff', `送入视频工厂：${finalTitle}`, '等待生成', 'ready', S.videoDraft.id);
  logAct('🎬', `已将「${finalTitle}」送入视频工厂`);
  closeModal();
  go('video');
  toast('文案已带入视频工厂');
}

function seed(){
  if (S.seeded) return;
  S.agents = PRESET_AGENTS.map(a => ({...a, id: 'ag_' + a.key}));
  S.flows = PRESET_FLOWS.map(f => ({...f, id: uid()}));
  S.accounts = [
    {id:uid(), platform:'抖音', name:'煜哥说创业', fans:12500, status:'正常', posts:2, note:'主号，日更'},
    {id:uid(), platform:'小红书', name:'煜哥的笔记', fans:4300, status:'正常', posts:1, note:'图文种草'},
    {id:uid(), platform:'视频号', name:'煜企课堂', fans:860, status:'限流', posts:0, note:'待排查原因'},
  ];
  S.customers = [
    {id:uid(), name:'王女士', contact:'wx_wang**', source:'抖音私信', stage:'意向', tags:'母婴,复购潜力', note:'咨询了两次价格'},
    {id:uid(), name:'李先生', contact:'138****5678', source:'朋友介绍', stage:'已成交', tags:'高客单', note:'首单2980'},
    {id:uid(), name:'张同学', contact:'wx_zh**', source:'小红书评论', stage:'潜在', tags:'学生党', note:'预算有限'},
  ];
  S.assetsText = [
    {id:uid(), cat:'爆款标题', title:'万能开头公式', content:'"我劝你别再XXX了，除非你能做到这3点"——反常识开头，前3秒留人率提升60%'},
    {id:uid(), cat:'话术', title:'客户嫌贵标准应对', content:'"理解您，价格确实是要重点考虑的。不过您换个角度算一下：平摊到每天不到一杯咖啡钱，但能持续用一整年，其实是最省钱的选择。"'},
  ];
  S.seeded = true;
  save();
}

/* ================= AI 接口（OpenAI兼容，支持DeepSeek/通义/Ollama等） ================= */
const isLive = () => !!(S.settings.apiBase && S.settings.apiKey && !S.settings.demoOnly);

async function callLLMOnce(messages, stream, opt){
  const base = String(S.settings.apiBase || '').trim().replace(/\/+$/, '');
  const key = String(S.settings.apiKey || '').trim();
  const model = String(S.settings.model || '').trim() || 'gpt-4o-mini';
  const body = JSON.stringify({model, messages, stream, max_tokens: opt.maxTokens || 2048});
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const res = await fetch(base + '/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + key},
      body,
      signal:controller.signal
    });
  if (!res.ok) {
    let t = '';
    try { t = (await res.text()).slice(0, 160); } catch(e) {}
    throw new Error('HTTP ' + res.status + (t ? '：' + t : ''));
  }
  if (stream && res.body && res.body.getReader) {
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = '', full = '';
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      buf += dec.decode(value, {stream:true});
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const ln of lines) {
        const s = ln.trim();
        if (!s.startsWith('data:')) continue;
        const d = s.slice(5).trim();
        if (d === '[DONE]') continue;
        try {
          const j = JSON.parse(d);
          const t = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
          if (t) { full += t; if (opt.onDelta) opt.onDelta(t); }
        } catch(e) {}
      }
    }
    if (full) return full;
    throw new Error('STREAM_EMPTY');
  }
    const j = await res.json();
    const t = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    if (opt.onDelta && t) opt.onDelta(t);
    return t;
  } catch(e) {
    if (e && e.name === 'AbortError') throw new Error('请求超过90秒，已自动停止');
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
async function callLLM(messages, opt = {}){
  try { return await callLLMOnce(messages, true, opt); }
  catch(e) {
    if (String(e.message).includes('STREAM_EMPTY')) return callLLMOnce(messages, false, opt);
    throw e;
  }
}

/* ================= 演示模式回复 ================= */
function demoReply(agent, userText){
  const t = (userText || '').trim().slice(0, 42) || '这个话题';
  const head = `<span class="demo-tag">🎭 演示模式 · 在「系统设置」接入AI后即为真实智能回答</span>`;
  const map = {
    script: `${head}
🎬 **《${t}》30秒爆款脚本**

**【0-3秒 钩子】**
"关于${t}，我踩过的坑，你一个都别踩！"

**【3-15秒 干货】**
一、先跑通最小闭环，别憋大招
二、聚焦一个场景打透，别贪多
三、每周复盘数据，让反馈带你走

**【15-25秒 案例】**
我身边一个小团队就这么干，3个人一个月起号，纯靠这套方法……

**【25-30秒 引导】**
关注我，下期拆解${t}的完整变现路径！

**画面建议**：口播为主 + 关键词花字
**BGM**：紧凑鼓点，卡点切镜`,
    xhs: `${head}
📕 **${t}｜谁懂啊，真的会谢！**

姐妹们！今天必须来交作业了✨
关于${t}，我踩坑半年总结出3条血泪经验👇

1️⃣ 别一上来就买贵的，先搞清楚自己适不适合
2️⃣ 记录比努力重要，我做了个打卡表（评论区扣1）
3️⃣ 坚持21天，你会回来谢我的🍀

真的不允许还有人不知道这些！
搞懂了记得回来评论区报喜呀💬

#${t.replace(/\s+/g,'')} #经验分享 #干货 #自律 #成长记录`,
    service: `${head}
💬 **客户心理分析**
客户说"${t}"，通常不是拒绝，而是在寻求"值不值"的确认。此刻最忌讳降价或硬怼。

**话术一（共情式）**
"特别理解您，价格确实要好好考虑～您主要是和哪家对比呢？我帮您算笔账。"

**话术二（价值式）**
"咱不着急定，您先想想用它解决什么问题。如果这问题每月值3000块，那这价格其实就是捡漏。"

**话术三（退一步式）**
"没关系～那我先发份案例给您，您看完咱们再聊，买不买都没事🙂"

**跟进建议**：24小时内轻跟进一次，发案例不发价格。`,
    report: `${head}
📊 **本周工作报告**

**一、本周成果**
1. 核心推进：${t}——已按计划落地执行，进度符合预期
2. 日常交付：完成既定任务清单，响应及时率100%
3. 协同支持：配合团队完成2项交叉事项

**二、亮点分析**
- 主动沉淀了可复用的方法/模板，后续同类事项效率可提升约30%

**三、问题与风险**
- 部分环节依赖外部反馈，存在等待损耗，建议增加中 checkpoints

**四、下周计划**
1. 持续推进主线任务，目标完成度 ≥ 90%
2. 输出一套标准化流程文档
3. 主动对齐上下游需求，减少返工`,
    title: `${head}
🏷️ **主题：${t}** — 10条爆款标题

1.（悬念）${t}，我劝你先别急着开始
2.（数字）关于${t}，记住这3条就够了
3.（反差）做${t}半年，我发现90%的人第一步就错了
4.（痛点）为什么你的${t}总是没效果？
5.（利益）学会${t}，我每月多赚了4位数
6.（身份）适合普通人的${t}攻略，保姆级
7.（悬念）原来${t}还能这么玩？
8.（反差）别学网上那些${t}教程了，真的
9.（数字）3个月从0到1，${t}我全程记录
10.（利益）${t}最省钱的一条路，今天说透

⭐ **推荐**：第3条（反差+痛点双buff，完播率最高）`,
  };
  if (map[agent.key]) return map[agent.key];
  return `${head}
**收到！关于「${t}」，我的建议如下：**

**1. 先明确目标**
想清楚要的结果是什么，用一句话写下来。

**2. 拆解路径**
把目标拆成3个可执行的小步骤，先跑通第一步。

**3. 快速验证**
用最小成本试一下，根据反馈调整，别闭门造车。

---
💡 当前为演示模式，回复由内置模板生成。前往「系统设置」填入任意 OpenAI 兼容接口（DeepSeek、通义千问、Kimi、本地Ollama均可），我就能像真人一样深度干活了。`;
}

function demoStep(stepName, input){
  const n = stepName || '本步骤';
  if (n.includes('标题')) {
    return `【演示输出】基于「${input}」生成标题：
1. ${input}，我劝你先别急着开始
2. 关于${input}，记住这3条就够了
3. 做${input}半年，我发现90%的人第一步就错了
⭐ 推荐：第3条（反差+痛点，完播率高）`;
  }
  if (n.includes('脚本')) {
    return `【演示输出】《${input}》30秒口播脚本：
【0-3秒】关于${input}，我踩过的坑你一个都别踩！
【3-15秒】①先跑通最小闭环 ②聚焦一个场景 ③每周复盘
【15-25秒】我朋友就这么干，3人一个月起号……
【25-30秒】关注我，下期拆解变现路径！`;
  }
  if (n.includes('画像') || n.includes('分析')) {
    return `【演示输出】「${input}」分析：
· 目标人群：25-40岁，有明确痛点，决策周期短
· 爆款潜质：★★★★☆（话题有讨论度，情绪价值高）
· 推荐切入角度：反面案例警示 / 低成本实操 / 避坑清单`;
  }
  return `【演示输出】已完成「${n}」：
针对「${input}」，本步骤输出了结构化的处理结果——包括要点拆解、执行建议和注意事项。接入真实AI接口后，这里将是深度定制的内容。`;
}

/* ================= 简易 Markdown 渲染 ================= */
function md(s){
  let h = esc(s);
  h = h.replace(/&lt;span class=&quot;demo-tag&quot;&gt;(.*?)&lt;\/span&gt;/g, '<span class="demo-tag">$1</span>');
  h = h.replace(/^###\s?(.+)$/gm, '<div class="mh">$1</div>')
       .replace(/^##\s?(.+)$/gm, '<div class="mh big">$1</div>')
       .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
       .replace(/`([^`\n]+)`/g, '<code>$1</code>')
       .replace(/^[-*•]\s?(.+)$/gm, '<div class="li">• $1</div>')
       .replace(/\n/g, '<br>');
  return h;
}

/* ================= 路由 ================= */
const PAGES = {
  dash:['工作台','欢迎回来，今天也让AI替你打工'],
  chat:['智能体对话','为每个岗位配一个AI员工，随叫随到'],
  flow:['工作流','把重复工作编排成自动化流水线'],
  video:['视频工厂','文案一键生成竖版短视频，全程本地渲染'],
  acct:['账号矩阵','多平台账号统一管理'],
  cust:['客户管理','轻量CRM，客户跟进不遗漏'],
  asset:['素材库','高转化文案与素材，随取随用'],
  set:['系统设置','配置AI接口，管理本地数据'],
};
let CUR = 'dash';

function go(pg){
  CUR = pg;
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.pg === pg));
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'pg-' + pg));
  const [t, d] = PAGES[pg];
  $('#pgTitle').textContent = t;
  $('#pgDesc').textContent = d;
  const fn = {dash:renderDash, chat:renderChat, flow:renderFlow, video:renderVideoPage,
              acct:renderAcct, cust:renderCust, asset:renderAsset, set:renderSet}[pg];
  if (fn) fn();
  updateApiBadge();
}
function updateApiBadge(){
  const live = isLive();
  const b = $('#apiBadge');
  b.className = 'bdg ' + (live ? 'b-ok' : 'b-warn');
  b.textContent = live ? '● AI已连接' : '● 演示模式';
  const sa = $('#sideApi');
  sa.classList.toggle('live', live);
  sa.innerHTML = '<i></i>' + (live ? 'AI已连接' : '演示模式');
}

/* ================= 工作台 ================= */
function renderDash(){
  const pg = $('#pg-dash');
  const st = S.stats;
  const cards = [
    ['💬','累计对话', st.msg + ' 条','#6366f1','#8b5cf6'],
    ['🎬','生成视频', st.video + ' 个','#ec4899','#f97316'],
    ['⚙️','工作流运行', st.run + ' 次','#06b6d4','#3b82f6'],
    ['👤','管理账号', S.accounts.length + ' 个','#10b981','#84cc16'],
    ['🤝','客户总数', S.customers.length + ' 位','#f59e0b','#ef4444'],
    ['⏱️','累计省时', fmtNum(st.minutes) + ' 分钟','#8b5cf6','#d946ef'],
  ];
  const acts = S.activities.slice(0, 8);
  const tasks = S.tasks.slice(0, 6);
  const taskIcons = {chat:'💬', flow:'⚙️', asset:'📚', handoff:'➡️', video:'🎬'};
  pg.innerHTML = `
    <div class="pipeline-hero">
      <div class="msg-body">
        <span class="bdg b-primary">v${APP_VERSION} · 可用 Demo</span>
        <h2>从一个想法，到一条可下载的视频</h2>
        <p>用 AI 员工或工作流生成内容，保存为素材，再一键送入视频工厂。</p>
      </div>
      <div class="pipeline-actions">
        <button class="btn primary" data-go="chat">① 生成内容</button>
        <button class="btn ghost" data-go="asset">② 查看素材</button>
        <button class="btn ghost" data-go="video">③ 制作视频</button>
      </div>
    </div>
    <div class="grid-stats">
      ${cards.map(c => `<div class="stat-card">
        <div class="stat-ico" style="background:linear-gradient(135deg,${c[3]},${c[4]})">${c[0]}</div>
        <div class="stat-meta"><b>${c[2]}</b><span>${c[1]}</span></div>
      </div>`).join('')}
    </div>
    <div class="dash-grid">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-h"><b>⚡ 快速开始</b></div>
          <div class="card-b">
            <div class="qa-grid">
              <div class="qa-btn" data-go="chat"><div>💬</div><div>和AI员工对话</div></div>
              <div class="qa-btn" data-go="flow"><div>⚙️</div><div>运行工作流</div></div>
              <div class="qa-btn" data-go="video"><div>🎬</div><div>生成短视频</div></div>
              <div class="qa-btn" data-go="acct"><div>📱</div><div>添加矩阵账号</div></div>
              <div class="qa-btn" data-go="asset"><div>📚</div><div>查看素材库</div></div>
              <div class="qa-btn" data-go="set"><div>🔌</div><div>接入AI接口</div></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><b>🧭 最近任务</b><span class="bdg b-gray">${S.tasks.length} 条</span></div>
          <div class="card-b" style="padding-top:6px">
            ${tasks.length ? tasks.map(t => `
              <div class="task-item">
                <div class="ico">${taskIcons[t.type] || '✓'}</div>
                <div class="task-meta"><div class="t">${esc(t.title)}</div><div class="tm">${esc(t.detail || '')} · ${esc(t.time)}</div></div>
                <span class="bdg ${t.status === 'ready' ? 'b-warn' : 'b-ok'}">${t.status === 'ready' ? '待处理' : '已完成'}</span>
              </div>`).join('') : '<div class="empty" style="padding:26px">暂无任务，先生成第一份内容吧</div>'}
          </div>
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-h"><b>🚀 上手指南</b></div>
          <div class="card-b" style="padding-top:8px">
            <div class="guide-step"><i>1</i><p><b>生成：</b>让 AI 员工写脚本，或运行「爆款内容流水线」</p></div>
            <div class="guide-step"><i>2</i><p><b>沉淀：</b>在结果下方点「保存素材」，以后可以继续复用</p></div>
            <div class="guide-step"><i>3</i><p><b>出片：</b>点「做成视频」，文案会自动带入视频工厂</p></div>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><b>📋 最近动态</b></div>
          <div class="card-b" style="padding-top:6px">
            ${acts.length ? acts.slice(0,5).map(a => `
              <div class="act-item"><div class="ico">${a.ico}</div><div><div class="t">${esc(a.txt)}</div><div class="tm">${a.time}</div></div></div>
            `).join('') : '<div class="empty" style="padding:26px">还没有动态</div>'}
          </div>
        </div>
      </div>
    </div>`;
  pg.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}

/* ================= 智能体对话 ================= */
let curAgentId = null, chatBusy = false;

function renderChat(){
  const pg = $('#pg-chat');
  if (!pg.dataset.built){
    pg.innerHTML = `
    <div class="chat-layout">
      <div class="card col-agents">
        <div class="card-h"><b>🤖 AI员工列表</b><button class="btn sm primary" id="btnNewAgent">＋ 新建</button></div>
        <div class="agent-scroll" id="agentList"></div>
      </div>
      <div class="card col-chat">
        <div class="chat-head" id="chatHead"></div>
        <div class="chat-msgs" id="chatMsgs"></div>
        <div class="chat-inputbar">
          <textarea id="chatInput" class="ta" placeholder="给AI员工下指令…（Enter 发送，Shift+Enter 换行）"></textarea>
          <button class="btn primary" id="btnSend">发送</button>
        </div>
      </div>
    </div>`;
    pg.dataset.built = '1';
    $('#btnNewAgent').onclick = newAgentModal;
    $('#btnSend').onclick = sendMsg;
    $('#chatInput').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
  }
  if (!curAgentId || !S.agents.find(a => a.id === curAgentId)) curAgentId = S.agents[0] ? S.agents[0].id : null;
  renderAgentList();
  renderMsgs();
}

function renderAgentList(){
  const el = $('#agentList');
  if (!S.agents.length) { el.innerHTML = '<div class="empty">点右上角"＋ 新建"创建你的AI员工</div>'; return; }
  el.innerHTML = S.agents.map(a => {
    const chat = S.chats[a.id] || {messages:[]};
    const last = chat.messages.length ? chat.messages[chat.messages.length-1].content.slice(0, 26) : a.desc;
    return `<div class="agent-item ${a.id===curAgentId?'active':''}" data-id="${a.id}">
      <div class="a-ava">${a.emoji || '🤖'}</div>
      <div class="a-info"><b>${esc(a.name)}</b><span>${esc(last)}</span></div>
      ${a.builtin ? '' : `<button class="ibtn a-del" data-del="${a.id}" title="删除">🗑</button>`}
    </div>`;
  }).join('');
  el.querySelectorAll('.agent-item').forEach(item => {
    item.onclick = e => {
      const del = e.target.closest('[data-del]');
      if (del) {
        const id = del.dataset.del;
        confirmBox('删除该智能体及其聊天记录？', () => {
          S.agents = S.agents.filter(a => a.id !== id);
          delete S.chats[id];
          if (curAgentId === id) curAgentId = S.agents[0] ? S.agents[0].id : null;
          save(); renderAgentList(); renderMsgs(); toast('已删除');
        });
        return;
      }
      curAgentId = item.dataset.id;
      renderAgentList(); renderMsgs();
    };
  });
}

function renderMsgs(){
  const head = $('#chatHead'), msgs = $('#chatMsgs');
  const agent = S.agents.find(a => a.id === curAgentId);
  if (!agent) {
    head.innerHTML = '<div class="ch-l"><b>智能体对话</b></div>';
    msgs.innerHTML = '<div class="empty">还没有AI员工，点左侧「＋ 新建」创建一个吧</div>';
    return;
  }
  head.innerHTML = `
    <div class="ch-l">
      <div class="a-ava" style="width:38px;height:38px;border-radius:12px;background:#eef0ff;display:flex;align-items:center;justify-content:center;font-size:19px">${agent.emoji || '🤖'}</div>
      <div><b>${esc(agent.name)}</b><span>${esc(agent.desc || '自定义智能体')} · ${isLive() ? '真实AI' : '演示模式'}</span></div>
    </div>
    <button class="btn ghost sm" id="btnClearChat">清空记录</button>`;
  $('#btnClearChat').onclick = () => confirmBox('清空与该智能体的聊天记录？', () => {
    S.chats[agent.id] = {messages:[]}; save(); renderMsgs(); toast('已清空');
  });
  const chat = S.chats[agent.id] = S.chats[agent.id] || {messages:[]};
  if (!chat.messages.length) {
    msgs.innerHTML = `
      <div class="msg ai">
        <div class="ava">${agent.emoji || '🤖'}</div>
        <div class="bubble">
          <b>你好，我是${esc(agent.name)} 👋</b><br>
          <span style="color:#7a8095;font-size:12.5px">${esc(agent.desc || '随时听候差遣')}</span>
          <div class="try-list">${(agent.try || ['随便聊点什么']).map(t => `<span class="try-chip">${esc(t)}</span>`).join('')}</div>
        </div>
      </div>`;
    msgs.querySelectorAll('.try-chip').forEach(c => c.onclick = () => {
      $('#chatInput').value = c.textContent; $('#chatInput').focus();
    });
    return;
  }
  msgs.innerHTML = chat.messages.map((m, i) => `
    <div class="msg ${m.role === 'user' ? 'user' : 'ai'}">
      <div class="ava">${m.role === 'user' ? '我' : (agent.emoji || '🤖')}</div>
      <div>
        <div class="bubble">${m.role === 'user' ? esc(m.content).replace(/\n/g,'<br>') : md(m.content)}</div>
        ${m.role === 'assistant' && m.content ? `<div class="msg-tools">
          <button data-chat-action="copy" data-mi="${i}">复制</button>
          <button data-chat-action="save" data-mi="${i}">保存素材</button>
          <button data-chat-action="video" data-mi="${i}">做成视频</button>
        </div>` : ''}
      </div>
    </div>`).join('');
  msgs.onclick = e => {
    const b = e.target.closest('[data-chat-action]');
    if (!b) return;
    const m = chat.messages[+b.dataset.mi];
    if (!m || m.role !== 'assistant') return;
    const title = `${agent.name} · ${smartTitle(m.content)}`;
    if (b.dataset.chatAction === 'copy') copyText(m.content);
    if (b.dataset.chatAction === 'save') saveTextAsset({cat:'AI生成', title, content:m.content, source:'chat'});
    if (b.dataset.chatAction === 'video') sendToVideo(m.content, title, 'chat');
  };
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendMsg(){
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text || chatBusy) return;
  const agent = S.agents.find(a => a.id === curAgentId);
  if (!agent) return;
  input.value = '';
  chatBusy = true;
  $('#btnSend').disabled = true;

  const chat = S.chats[agent.id] = S.chats[agent.id] || {messages:[]};
  chat.messages.push({role:'user', content:text});

  const msgs = $('#chatMsgs');
  msgs.insertAdjacentHTML('beforeend', `
    <div class="msg user"><div class="ava">我</div><div class="bubble">${esc(text).replace(/\n/g,'<br>')}</div></div>
    <div class="msg ai" id="curMsg"><div class="ava">${agent.emoji || '🤖'}</div>
      <div class="bubble"><span class="dots"><span></span><span></span><span></span></span></div></div>`);
  msgs.scrollTop = msgs.scrollHeight;

  const aiMsg = {role:'assistant', content:''};
  chat.messages.push(aiMsg);
  const bubble = $('#curMsg .bubble');
  let usedDemo = false;

  try {
    if (isLive()) {
      const apiMsgs = [
        {role:'system', content: agent.prompt || '你是一个乐于助人的AI助手。'},
        ...chat.messages.slice(0, -1).map(m => ({role: m.role, content: m.content}))
      ];
      await callLLM(apiMsgs, {onDelta: d => {
        aiMsg.content += d;
        bubble.innerHTML = md(aiMsg.content);
        msgs.scrollTop = msgs.scrollHeight;
      }});
    } else {
      throw new Error('DEMO');
    }
  } catch(e) {
    if (e.message !== 'DEMO' && isLive()) {
      bubble.innerHTML = `<span class="demo-tag">⚠️ API调用失败：${esc(e.message)}，已降级为演示回复</span><br>`;
    } else {
      bubble.innerHTML = '';
    }
    usedDemo = true;
    const reply = demoReply(agent, text);
    for (const ch of reply) {
      aiMsg.content += ch;
      bubble.innerHTML = md(aiMsg.content);
      msgs.scrollTop = msgs.scrollHeight;
      await sleep(9);
    }
  }

  $('#curMsg').removeAttribute('id');
  save();
  bump('msg', 1);
  if (!S.stats.minutes) S.stats.minutes = 0;
  S.stats.minutes += 2; save();
  logAct('💬', `与「${agent.name}」对话：${text.slice(0, 18)}${text.length > 18 ? '…' : ''}${usedDemo ? '（演示）' : ''}`);
  addTask('chat', `${agent.name}：${smartTitle(text)}`, usedDemo ? '演示回复' : '真实 AI 回复');
  chatBusy = false;
  $('#btnSend').disabled = false;
  renderMsgs();
  input.focus();
}

function newAgentModal(){
  modal('新建智能体', `
    <div class="fld"><label>名称</label><input id="naName" class="inp" placeholder="如：直播话术专家"></div>
    <div class="fld"><label>头像 Emoji</label><input id="naEmoji" class="inp" value="🤖" maxlength="4"></div>
    <div class="fld"><label>一句话职责</label><input id="naDesc" class="inp" placeholder="如：直播间逼单话术随叫随到"></div>
    <div class="fld"><label>系统提示词（它的"人设"）</label>
      <textarea id="naPrompt" class="ta" rows="4" placeholder="告诉它它是谁、擅长什么、输出格式是什么…"></textarea></div>`,
    `<button class="btn ghost" onclick="closeModal()">取消</button><button class="btn primary" id="naOk">创建</button>`);
  $('#naOk').onclick = () => {
    const name = $('#naName').value.trim();
    if (!name) { toast('请填写名称', 'warn'); return; }
    const a = {
      id: uid(), name,
      emoji: $('#naEmoji').value.trim() || '🤖',
      desc: $('#naDesc').value.trim() || '自定义智能体',
      prompt: $('#naPrompt').value.trim() || '你是一个乐于助人的AI助手。',
      builtin: false
    };
    S.agents.push(a);
    curAgentId = a.id;
    save(); closeModal();
    logAct('🤖', `创建了智能体「${name}」`);
    renderAgentList(); renderMsgs(); toast('创建成功，开始差遣它吧');
  };
}

/* ================= 工作流 ================= */
function renderFlow(){
  const pg = $('#pg-flow');
  pg.innerHTML = `
    <div class="card">
      <div class="card-h"><b>⚙️ 我的工作流</b><button class="btn primary sm" id="btnNewFlow">＋ 新建工作流</button></div>
      <div class="card-b">
        <div id="flowList" class="flow-grid"></div>
      </div>
    </div>`;
  $('#btnNewFlow').onclick = () => flowModal();
  const list = $('#flowList');
  if (!S.flows.length) {
    list.innerHTML = '<div class="empty" style="grid-column:1/-1">还没有工作流，点右上角新建一条流水线</div>';
    return;
  }
  list.innerHTML = S.flows.map(f => `
    <div class="flow-card">
      <div class="fc-h"><b>${esc(f.name)}</b><span class="bdg ${f.runs ? 'b-primary' : 'b-gray'}">已运行 ${f.runs} 次</span></div>
      <p class="fc-desc">${esc(f.desc || '')}</p>
      <div class="fc-steps">
        ${f.steps.map((s, i) => `<span class="fc-step"><i>${i+1}</i>${esc(s.name)}</span>`).join('<span class="fc-arrow">→</span>')}
      </div>
      <div class="fc-btns">
        <button class="btn primary sm" data-run="${f.id}">▶ 运行</button>
        <button class="btn ghost sm" data-edit="${f.id}">编辑</button>
        <button class="btn danger sm" data-del="${f.id}">删除</button>
      </div>
    </div>`).join('');
  list.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    const id = b.dataset.run || b.dataset.edit || b.dataset.del;
    if (b.dataset.run) runFlowModal(id);
    else if (b.dataset.edit) flowModal(id);
    else confirmBox('删除该工作流？', () => {
      S.flows = S.flows.filter(x => x.id !== id);
      save(); renderFlow(); toast('已删除');
    });
  };
}

function flowModal(id){
  const f = id ? S.flows.find(x => x.id === id) : null;
  let steps = f ? JSON.parse(JSON.stringify(f.steps)) : [{name:'', prompt:''}];
  const m = modal(f ? '编辑工作流' : '新建工作流', `
    <div class="fld"><label>工作流名称</label><input id="wfName" class="inp" value="${f ? esc(f.name) : ''}" placeholder="如：小红书笔记流水线"></div>
    <div class="fld"><label>描述</label><input id="wfDesc" class="inp" value="${f ? esc(f.desc) : ''}" placeholder="一句话说明这条流水线干什么"></div>
    <div class="fld"><label>步骤（按顺序执行，上一步输出自动带入下一步）</label><div id="wfSteps"></div></div>
    <button class="btn ghost sm" id="wfAddStep">＋ 添加步骤</button>`,
    `<button class="btn ghost" onclick="closeModal()">取消</button><button class="btn primary" id="wfOk">保存</button>`);

  function drawSteps(){
    $('#wfSteps').innerHTML = steps.map((s, i) => `
      <div class="step-editor">
        <div class="se-h"><span>步骤 ${i+1}</span>
          ${steps.length > 1 ? `<button class="ibtn" data-si="${i}" title="删除步骤">🗑</button>` : ''}</div>
        <div class="row2" style="margin-bottom:8px">
          <input class="inp se-name" data-si="${i}" value="${esc(s.name)}" placeholder="步骤名，如：生成标题">
        </div>
        <textarea class="ta se-prompt" data-si="${i}" rows="2" placeholder="该步骤的指令（提示词）">${esc(s.prompt)}</textarea>
      </div>`).join('');
    $$('#wfSteps .se-name').forEach(el => el.oninput = () => steps[+el.dataset.si].name = el.value);
    $$('#wfSteps .se-prompt').forEach(el => el.oninput = () => steps[+el.dataset.si].prompt = el.value);
    $$('#wfSteps [data-si].ibtn').forEach(b => b.onclick = () => {
      steps.splice(+b.dataset.si, 1); drawSteps();
    });
  }
  drawSteps();
  $('#wfAddStep').onclick = () => { steps.push({name:'', prompt:''}); drawSteps(); };
  $('#wfOk').onclick = () => {
    const name = $('#wfName').value.trim();
    const valid = steps.filter(s => s.name.trim() && s.prompt.trim());
    if (!name) { toast('请填写名称', 'warn'); return; }
    if (!valid.length) { toast('至少需要1个完整步骤', 'warn'); return; }
    if (f) {
      f.name = name; f.desc = $('#wfDesc').value.trim(); f.steps = valid;
    } else {
      S.flows.push({id: uid(), name, desc: $('#wfDesc').value.trim(), steps: valid, runs: 0});
      logAct('⚙️', `创建了工作流「${name}」`);
    }
    save(); closeModal(); renderFlow(); toast('已保存');
  };
}

async function runFlowModal(id){
  const f = S.flows.find(x => x.id === id);
  if (!f) return;
  modal('运行：' + esc(f.name), `
    <div class="fld"><label>输入主题 / 素材</label>
      <textarea id="rfInput" class="ta" rows="2" placeholder="例如：30岁转行做自媒体"></textarea></div>
    <div id="rfSteps"></div>
    <p class="note">${isLive() ? '🟢 当前为真实AI模式，每步都会调用大模型' : '🟡 当前为演示模式，输出为内置模板。去「系统设置」接入AI后即为真实内容'}</p>`,
    `<button class="btn ghost" onclick="closeModal()">关闭</button>`);
  const inp = $('#rfInput');
  inp.focus();
  let running = false;
  inp.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doRun(); } };
  // 提示：加一个运行按钮
  $('#rfSteps').insertAdjacentHTML('beforebegin',
    `<button class="btn primary block" id="rfRun" style="margin-bottom:14px">▶ 开始运行（${f.steps.length}步）</button>`);
  $('#rfRun').onclick = doRun;

  async function doRun(){
    if (running) return;
    const topic = inp.value.trim();
    if (!topic) { toast('请先输入主题', 'warn'); return; }
    running = true;
    $('#rfRun').disabled = true;
    $('#rfRun').textContent = '运行中…';
    const box = $('#rfSteps');
    box.innerHTML = f.steps.map((s, i) => `
      <div class="run-step-card" id="rs${i}">
        <div class="rs-h"><span class="spin"></span>${i+1}. ${esc(s.name)}</div>
        <div class="rs-out" style="color:#9aa0b4">等待执行…</div>
      </div>`).join('');
    let prev = '';
    const outputs = [];
    for (let i = 0; i < f.steps.length; i++) {
      const s = f.steps[i];
      const card = $('#rs' + i);
      const out = card.querySelector('.rs-out');
      out.textContent = '';
      let content = '';
      try {
        if (isLive()) {
          const msgs = [
            {role:'system', content: s.prompt},
            {role:'user', content: (i === 0 ? ('主题：' + topic) : ('主题：' + topic + '\n\n上一步「' + f.steps[i-1].name + '」的输出：\n' + prev))}
          ];
          await callLLM(msgs, {onDelta: d => { content += d; out.textContent = content; out.parentElement.scrollTop = 1e5; }});
        } else {
          throw new Error('DEMO');
        }
      } catch(e) {
        content = demoStep(s.name, i === 0 ? topic : topic + ' · ' + f.steps[i-1].name);
        for (const ch of content) { out.textContent += ch; await sleep(4); }
      }
      if (!content) content = '（本步骤无输出）';
      outputs.push(`【${s.name}】\n${content}`);
      prev = content;
      card.classList.add('done');
      card.querySelector('.rs-h').innerHTML = `✅ ${i+1}. ${esc(s.name)}`;
    }
    f.runs = (f.runs || 0) + 1;
    bump('run', 1);
    S.stats.minutes += 8; save();
    logAct('⚙️', `运行工作流「${f.name}」：${topic.slice(0, 16)}`);
    const combined = outputs.join('\n\n' + '─'.repeat(20) + '\n\n');
    addTask('flow', `${f.name}：${smartTitle(topic)}`, `${f.steps.length} 个步骤`);
    $('#rfRun').outerHTML = `<div class="result-actions" id="rfActions">
      <button class="btn ghost" id="rfCopy">📋 复制结果</button>
      <button class="btn ghost" id="rfSave">📚 保存素材</button>
      <button class="btn primary" id="rfVideo">🎬 做成视频</button>
    </div>`;
    $('#rfCopy').onclick = () => copyText(combined);
    $('#rfSave').onclick = () => saveTextAsset({cat:'工作流结果', title:`${f.name} · ${smartTitle(topic)}`, content:combined, source:'workflow'});
    $('#rfVideo').onclick = () => sendToVideo(prev, `${f.name} · ${smartTitle(topic)}`, 'workflow');
    running = false;
  }
}
