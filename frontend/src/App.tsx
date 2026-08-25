import { useMemo, useState } from 'react'

import { DashboardPage } from './pages/DashboardPage'
import { EmployeeWorkspace } from './pages/EmployeeWorkspace'
import { ModulePlaceholder, type ModuleDefinition } from './pages/ModulePlaceholder'
import { WorkflowPage } from './pages/WorkflowPage'

export type PageKey =
  | 'home'
  | 'agent'
  | 'assistant'
  | 'brain'
  | 'design'
  | 'workflow'
  | 'accounts'
  | 'assets'
  | 'matrix'
  | 'storyboard'
  | 'digital-human'
  | 'trend'
  | 'creative-video'
  | 'publisher'
  | 'tasks'
  | 'keyword'
  | 'company-leads'
  | 'search-history'
  | 'customer'
  | 'chats'
  | 'contacts'

interface NavItem {
  key: PageKey
  label: string
  icon?: string
}

interface NavGroup {
  label?: string
  icon?: string
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    items: [
      { key: 'home', label: '首页', icon: '⌂' },
      { key: 'agent', label: 'Agent', icon: '◉' },
      { key: 'assistant', label: 'AI 大模型助手', icon: '▦' },
      { key: 'brain', label: 'AI 企业大脑', icon: '♟' },
      { key: 'design', label: 'AI 智能设计', icon: '✣' },
    ],
  },
  {
    label: 'AI 智能创作',
    icon: '◐',
    items: [
      { key: 'accounts', label: '账号矩阵' },
      { key: 'assets', label: '素材管家' },
      { key: 'matrix', label: '短视频矩阵' },
      { key: 'storyboard', label: '多场景剪辑' },
      { key: 'digital-human', label: '数字人 IP' },
      { key: 'trend', label: '一键追爆' },
      { key: 'creative-video', label: '创意视频' },
      { key: 'publisher', label: '本地发布管家' },
    ],
  },
  {
    label: '自动化中心',
    icon: '⌁',
    items: [
      { key: 'workflow', label: '自动工作流' },
      { key: 'tasks', label: '任务中心' },
    ],
  },
  {
    label: 'AI 搜索获客',
    icon: '⌕',
    items: [
      { key: 'keyword', label: '关键词拓客' },
      { key: 'company-leads', label: '企业获客' },
      { key: 'search-history', label: '搜索记录' },
    ],
  },
  {
    label: 'AI 智能客服',
    icon: '♧',
    items: [
      { key: 'customer', label: '智能获客' },
      { key: 'chats', label: '聊天记录' },
      { key: 'contacts', label: '联系列表' },
    ],
  },
]

function module(
  key: PageKey,
  title: string,
  subtitle: string,
  eyebrow: string,
  accent: string,
  features: ModuleDefinition['features'],
): ModuleDefinition {
  return { key, title, subtitle, eyebrow, accent, features }
}

const moduleDefinitions: Partial<Record<PageKey, ModuleDefinition>> = {
  assistant: module('assistant', 'AI 大模型助手', '统一调用多个大模型完成问答、写作、分析与资料处理。', 'MODEL HUB', '#5b78f6', [
    { title: '多模型对话', description: '按任务选择合适的模型与上下文。', icon: 'AI' },
    { title: '提示词模板', description: '沉淀企业常用任务模板。', icon: '文' },
    { title: '对话资产', description: '把有效答案保存为可复用成果。', icon: '存' },
  ]),
  brain: module('brain', 'AI 企业大脑', '把企业知识、流程和经验沉淀成 AI 员工可以调用的业务大脑。', 'KNOWLEDGE', '#6c5be7', [
    { title: '企业知识库', description: '集中管理制度、产品和业务资料。', icon: '库' },
    { title: '知识检索', description: '为 Agent 提供有来源的上下文。', icon: '搜' },
    { title: '权限空间', description: '控制不同员工可以读取的内容。', icon: '权' },
  ]),
  design: module('design', 'AI 智能设计', '快速生成品牌海报、封面、配图和营销视觉。', 'AI DESIGN', '#8358ea', [
    { title: '营销海报', description: '从文案生成多尺寸宣传图。', icon: '图' },
    { title: '封面设计', description: '生成适配不同平台的内容封面。', icon: '封' },
    { title: '品牌模板', description: '统一颜色、字体和品牌元素。', icon: '模' },
  ]),
  workflow: module('workflow', '自动工作流', '将重复业务拆成可复用步骤，让多个 Agent 和技能自动协作。', 'WORKFLOW', '#7257e8', [
    { title: '流程编排', description: '通过步骤、条件和输入输出组织任务。', icon: '流' },
    { title: '自动运行', description: '按计划、事件或人工触发运行。', icon: '启' },
    { title: '运行记录', description: '查看每一步输入、输出和失败原因。', icon: '记' },
  ]),
  accounts: module('accounts', '账号矩阵', '统一管理抖音、小红书、快手、视频号等内容账号。', 'ACCOUNT MATRIX', '#3e91df', [
    { title: '账号管理', description: '集中查看平台、状态和账号标签。', icon: '号' },
    { title: '授权状态', description: '管理平台授权和账号有效期。', icon: '授' },
    { title: '矩阵分组', description: '按品牌、地区和业务线管理账号。', icon: '组' },
  ]),
  assets: module('assets', '素材管家', '沉淀文案、图片、视频和企业素材，为内容生产提供统一资产库。', 'ASSET CENTER', '#398fd2', [
    { title: '内容素材', description: '统一保存 Agent 和工作流产出。', icon: '素' },
    { title: '分类标签', description: '按主题、平台和使用状态检索。', icon: '签' },
    { title: '跨模块流转', description: '将素材送往剪辑、数字人和发布任务。', icon: '转' },
  ]),
  matrix: module('matrix', '短视频矩阵', '围绕一个内容主题批量生产、管理和发布多账号短视频。', 'VIDEO MATRIX', '#31a79b', [
    { title: '矩阵内容', description: '一份主题生成多平台内容版本。', icon: '视' },
    { title: '发布计划', description: '按账号和时间安排发布任务。', icon: '排' },
    { title: '数据总览', description: '汇总播放、互动和转化数据。', icon: '数' },
  ]),
  storyboard: module('storyboard', '多场景剪辑', '配置多个画面场景、字幕风格和素材，快速形成竖版视频。', 'STORYBOARD', '#5479e7', [
    { title: '场景编排', description: '按脚本添加、排序和删除画面场景。', icon: '景' },
    { title: '字幕风格', description: '选择多种字幕模板和强调方式。', icon: '字' },
    { title: '画面素材', description: '为每个场景配置图片、视频和转场。', icon: '画' },
  ]),
  'digital-human': module('digital-human', '数字人 IP', '管理数字人形象、声音与口播视频生成任务。', 'DIGITAL HUMAN', '#7a55dd', [
    { title: '数字人形象', description: '创建和管理企业数字人角色。', icon: '人' },
    { title: '声音克隆', description: '管理授权声音和口播音色。', icon: '声' },
    { title: '口播生成', description: '将文案、形象和声音组合成视频。', icon: '播' },
  ]),
  trend: module('trend', '一键追爆', '从热点内容中提取结构与卖点，快速生成适合自身业务的版本。', 'TREND REMIX', '#8b4de2', [
    { title: '热点发现', description: '按平台和主题发现高潜内容。', icon: '热' },
    { title: '结构拆解', description: '分析钩子、节奏、画面和转化点。', icon: '拆' },
    { title: '内容复刻', description: '结合自身产品生成原创表达。', icon: '创' },
  ]),
  'creative-video': module('creative-video', '创意视频', '接入视频生成模型，将提示词或素材转换为创意短片。', 'CREATIVE VIDEO', '#d95191', [
    { title: '文生视频', description: '从文字描述生成视频片段。', icon: '文' },
    { title: '图生视频', description: '让图片产生镜头运动和变化。', icon: '图' },
    { title: '生成任务', description: '统一查看进度、成本与失败原因。', icon: '任' },
  ]),
  publisher: module('publisher', '本地发布管家', '在合规授权范围内管理内容发布计划与本地发布任务。', 'PUBLISHER', '#436dd8', [
    { title: '发布队列', description: '按平台和账号安排待发布内容。', icon: '队' },
    { title: '内容检查', description: '发布前检查比例、标题和敏感词。', icon: '检' },
    { title: '结果记录', description: '记录发布状态与平台返回信息。', icon: '录' },
  ]),
  tasks: module('tasks', '任务中心', '统一跟踪所有 Agent、工作流与生成任务的运行状态。', 'TASK CENTER', '#4d72dc', [
    { title: '运行任务', description: '查看排队、运行和等待验收的任务。', icon: '运' },
    { title: '失败重试', description: '定位失败步骤并重新执行。', icon: '重' },
    { title: '成本统计', description: '汇总模型、工具和生成服务成本。', icon: '费' },
  ]),
  keyword: module('keyword', '关键词拓客', '按平台、关键词和互动行为沉淀潜在客户线索。', 'KEYWORD LEADS', '#4d77df', [
    { title: '采集规则', description: '配置平台、关键词和采集范围。', icon: '采' },
    { title: '线索筛选', description: '按意向、互动和标签筛选用户。', icon: '筛' },
    { title: '触达任务', description: '在授权边界内创建后续跟进任务。', icon: '触' },
  ]),
  'company-leads': module('company-leads', '企业获客', '按城市、行业和关键词查找企业并形成可跟进的线索库。', 'BUSINESS LEADS', '#536fdd', [
    { title: '企业搜索', description: '按地区、行业和关键词检索企业。', icon: '企' },
    { title: '线索入库', description: '保存联系人、电话、地址和来源。', icon: '入' },
    { title: '跟进状态', description: '记录负责人、意向和下一步动作。', icon: '跟' },
  ]),
  'search-history': module('search-history', '搜索记录', '保存关键词、企业和渠道搜索任务及其结果。', 'SEARCH HISTORY', '#5870d4', [
    { title: '历史任务', description: '查看执行过的搜索条件。', icon: '历' },
    { title: '结果回溯', description: '追踪每条线索的搜索来源。', icon: '源' },
    { title: '再次执行', description: '复用条件并获取最新结果。', icon: '再' },
  ]),
  customer: module('customer', '智能获客', '将内容互动、搜索线索和客服会话统一进入客户跟进流程。', 'CUSTOMER GROWTH', '#4a86db', [
    { title: '线索汇聚', description: '统一接收各渠道潜在客户。', icon: '汇' },
    { title: '意向判断', description: '根据对话与行为判断客户意向。', icon: '判' },
    { title: '跟进建议', description: '为销售生成下一步沟通建议。', icon: '议' },
  ]),
  chats: module('chats', '聊天记录', '集中查看客服会话、Agent 回复和人工接管记录。', 'CONVERSATIONS', '#4f7ed5', [
    { title: '会话列表', description: '按渠道、客户和状态筛选对话。', icon: '聊' },
    { title: 'AI 回复', description: '根据知识库生成可审核回复。', icon: '答' },
    { title: '人工接管', description: '高风险或高价值会话转给人工。', icon: '转' },
  ]),
  contacts: module('contacts', '联系列表', '管理客户资料、标签、来源和跟进状态。', 'CONTACTS', '#4b75cd', [
    { title: '客户档案', description: '统一保存联系方式与业务信息。', icon: '客' },
    { title: '客户标签', description: '按来源、意向和行业分类。', icon: '标' },
    { title: '跟进记录', description: '记录每次沟通与下一步计划。', icon: '记' },
  ]),
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeLabel = useMemo(() => {
    if (activePage === 'home') return '首页'
    if (activePage === 'agent') return 'Agent 智能体'
    return moduleDefinitions[activePage]?.title ?? '超级员工'
  }, [activePage])

  function navigate(page: PageKey) {
    setActivePage(page)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeModule = moduleDefinitions[activePage]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><span>✦</span></div>
          <div><strong>熠企超级员工</strong><span>AI 企业智能体系统</span></div>
        </div>

        <nav className="sidebar-nav" aria-label="系统功能导航">
          {navigation.map((group, groupIndex) => (
            <div className="nav-group" key={group.label ?? `base-${groupIndex}`}>
              {group.label && <div className="nav-group-title"><span>{group.icon}</span><b>{group.label}</b><i>⌄</i></div>}
              {group.items.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={`nav-item ${group.label ? 'nav-item-child' : ''} ${activePage === item.key ? 'nav-item-active' : ''}`}
                  onClick={() => navigate(item.key)}
                >
                  {item.icon && <i>{item.icon}</i>}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-account">
          <div>创</div>
          <span><strong>创始人工作区</strong><small>企业管理员</small></span>
          <i>⌄</i>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" aria-label="关闭菜单" onClick={() => setSidebarOpen(false)} />}

      <div className="app-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" type="button" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="topbar-page-name">{activeLabel}</span>
          </div>
          <div className="topbar-meta">
            <span>到期时间：2027-09-18 10:33:26</span>
            <span>剩余点数：<b>12,234.30</b></span>
            <button type="button" title="帮助">?</button>
            <button type="button" title="通知">♢<i /></button>
            <span className="feedback-chip">工单反馈</span>
          </div>
        </header>

        {activePage === 'home' && <DashboardPage onNavigate={navigate} />}
        {activePage === 'agent' && <EmployeeWorkspace />}
        {activePage === 'workflow' && <WorkflowPage />}
        {activeModule && activePage !== 'workflow' && <ModulePlaceholder module={activeModule} onNavigate={navigate} />}
      </div>
    </div>
  )
}

export default App
