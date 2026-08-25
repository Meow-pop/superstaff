import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [html, app, app2] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'app.js'), 'utf8'),
  readFile(resolve(root, 'app2.js'), 'utf8'),
]);

new Function(app2);

const context = vm.createContext({console, setTimeout, clearTimeout, AbortController});
vm.runInContext(`${app}\n;globalThis.__test = { defaultState, normalizeState, toVideoScript };`, context);
const { defaultState, normalizeState, toVideoScript } = context.__test;

const migrated = normalizeState({settings:{model:'demo-model'}, stats:{msg:3}});
if (migrated.settings.apiBase !== '' || migrated.settings.model !== 'demo-model') {
  throw new Error('旧数据迁移未补齐设置默认值');
}
if (!Array.isArray(migrated.tasks) || migrated.stats.video !== 0) {
  throw new Error('旧数据迁移未补齐 v0.2 字段');
}
if (!toVideoScript('1. 30岁转行做自媒体。').startsWith('30岁')) {
  throw new Error('视频文案清理错误地移除了正文数字');
}
if (!Array.isArray(defaultState().tasks)) throw new Error('默认状态缺少任务列表');

const expectedPages = ['dash', 'chat', 'flow', 'video', 'acct', 'cust', 'asset', 'set'];
for (const page of expectedPages) {
  if (!html.includes(`id="pg-${page}"`)) throw new Error(`缺少页面：${page}`);
}

const requiredFlow = ['saveTextAsset', 'sendToVideo', 'renderVideo', 'renderAsset'];
for (const name of requiredFlow) {
  if (!app.includes(name) && !app2.includes(name)) throw new Error(`缺少主流程能力：${name}`);
}

if (html.indexOf('app.js') > html.indexOf('app2.js')) {
  throw new Error('脚本加载顺序错误：app.js 必须先于 app2.js');
}

console.log('Smoke test passed: 页面、脚本和内容生产主流程均存在。');
