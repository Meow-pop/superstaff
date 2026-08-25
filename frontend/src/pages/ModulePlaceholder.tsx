import type { PageKey } from '../App'

export interface ModuleDefinition {
  key: PageKey
  title: string
  subtitle: string
  eyebrow: string
  accent: string
  features: Array<{ title: string; description: string; icon: string }>
}

interface ModulePlaceholderProps {
  module: ModuleDefinition
  onNavigate: (page: PageKey) => void
}

export function ModulePlaceholder({ module, onNavigate }: ModulePlaceholderProps) {
  return (
    <main className="module-placeholder-page">
      <section className="module-page-header" style={{ '--module-accent': module.accent } as React.CSSProperties}>
        <div>
          <span className="page-breadcrumb">首页 / {module.title}</span>
          <h1>{module.title}</h1>
          <p>{module.subtitle}</p>
        </div>
        <button type="button" className="module-header-button" onClick={() => onNavigate('agent')}>
          交给 Agent 执行
        </button>
      </section>

      <section className="module-overview-card">
        <div className="module-overview-title">
          <div><span>{module.eyebrow}</span><h2>模块工作台</h2></div>
          <small>界面骨架已对齐 · 业务能力逐步接入</small>
        </div>
        <div className="module-feature-grid">
          {module.features.map((feature) => (
            <article key={feature.title}>
              <i>{feature.icon}</i>
              <div><h3>{feature.title}</h3><p>{feature.description}</p></div>
              <span>→</span>
            </article>
          ))}
        </div>
      </section>

      <section className="module-table-card">
        <div className="module-table-toolbar">
          <div><button className="toolbar-primary" type="button">＋ 新建任务</button><button type="button">批量操作</button></div>
          <div><input aria-label="搜索任务" placeholder="搜索任务名称" /><button type="button">查询</button></div>
        </div>
        <div className="module-table-head"><span>任务名称</span><span>执行对象</span><span>状态</span><span>更新时间</span><span>操作</span></div>
        <div className="module-table-empty"><i>◇</i><strong>暂无运行记录</strong><p>该模块将在后续里程碑接入真实执行服务。</p></div>
      </section>
    </main>
  )
}
