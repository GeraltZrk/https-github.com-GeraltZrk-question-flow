import styles from "./page.module.css";

const steps = [
  {
    number: "01",
    title: "上传",
    copy: "最多 5 张乱序截图。先冻结 OCR 证据区，再运行 Question Compiler。",
  },
  {
    number: "02",
    title: "只处理阻断项",
    copy: "Evidence Critic 标出冲突、缺页和错拼；用户只做必要决定。",
  },
  {
    number: "03",
    title: "构建与导出",
    copy: "代码逐题门禁，计算 NPV，并生成 Index / Q13_NPV / Sources。",
  },
];

const lanes = [
  ["技术 A · AI", "Evidence、CaseIR、Compiler、Critic"],
  ["技术 B · UI", "三步界面、Review、SourceCrop、状态徽标"],
  ["技术 C · Runtime", "Resolution、逐题门禁、NPV_V1、XLSX"],
];

export default function Home() {
  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <div className={styles.eyebrow}>
          <span className={styles.liveDot} aria-hidden="true" />
          Hackathon starter repository
        </div>
        <h1>QuestionFlow AI</h1>
        <p className={styles.tagline}>把混乱截图编译成可验证的 Excel</p>
        <p className={styles.summary}>
          AI 负责跨图重建与证据审计；代码负责状态门禁、NPV 和 Excel；
          用户只处理真正无法确定的问题。
        </p>
        <div className={styles.badges} aria-label="项目状态">
          <span>Next.js 16</span>
          <span>TypeScript</span>
          <span>2× Multimodal AI</span>
          <span>NPV_V1 only</span>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="flow-title">
        <div className={styles.sectionHeading}>
          <p>Product flow</p>
          <h2 id="flow-title">用户始终只看到三步</h2>
        </div>
        <div className={styles.stepGrid}>
          {steps.map((step) => (
            <article className={styles.stepCard} key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="lanes-title">
        <div className={styles.sectionHeading}>
          <p>Team lanes</p>
          <h2 id="lanes-title">三个人可以同时开工</h2>
        </div>
        <div className={styles.laneList}>
          {lanes.map(([title, copy]) => (
            <div className={styles.lane} key={title}>
              <strong>{title}</strong>
              <span>{copy}</span>
            </div>
          ))}
        </div>
      </section>

      <aside className={styles.rule}>
        <span>Hard rule</span>
        <strong>No evidence, no formula.</strong>
        <p>READY 只表示规则门禁通过；用户最终确认后才允许导出。</p>
      </aside>

      <footer className={styles.footer}>
        <span>仓库骨架已就绪</span>
        <code>npm run check</code>
      </footer>
    </main>
  );
}
