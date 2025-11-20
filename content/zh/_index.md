---
title: ""
date: 2022-10-24
type: landing

design:
  spacing: "5rem"

sections:
  - block: resume-biography-3
    id: overview
    content:
      username: admin
      text: |-
        <p><strong>水文 × 人工智能 × 开放科学。</strong> 关注青藏高原流域的径流预测、遥感数据自动化与可解释神经算子，让模型与实地观测在双语记录中实时对话。</p>
        <ul class="ql-highlight-metrics">
          <li>6 套流域级 AI 模型</li>
          <li>40+ 奖项/荣誉</li>
          <li>3 件软件著作权/实用新型</li>
          <li>每日双语研究记录</li>
        </ul>
        <p>
          <a class="btn btn-primary" href="/zh/post/daily-notes/">今日实验记</a>
          <a class="btn btn-outline-primary" href="/zh/blogs/">长文博客</a>
        </p>
      button:
        text: 下载简历
        url: uploads/CV_QunLuo.pdf
    design:
      css_class: hero
      background:
        color: black
        image:
          filename: stacked-peaks.svg
          filters:
            brightness: 0.6
          size: cover
          position: center
          parallax: false

  - block: markdown
    id: focus
    content:
      title: 研究主线与追踪
      text: |-
        <div class="ql-panels">
          <section class="ql-panel">
            <h3>流域智能</h3>
            <p>融合物理与机器学习（CNN/LSTM、PINNs、图网络）的洪水预警、降尺度与不确定性估计。</p>
          </section>
          <section class="ql-panel">
            <h3>自动化工具链</h3>
            <p>构建可复现的数据工厂：SWMM/MODFLOW 批量化、遥感质控自动化、GPU 实验流水线。</p>
          </section>
          <section class="ql-panel">
            <h3>社区情报</h3>
            <p>聚合开放数据、会议动态与科学新闻，方便合作者快速切入。</p>
          </section>
          <section class="ql-panel">
            <h3>影响力雷达</h3>
            <p>指标跟踪：覆盖流域、响应时间、可复现度、开源采用情况。</p>
          </section>
        </div>
    design:
      columns: '1'

  - block: collection
    id: daily
    content:
      title: 每日实验记
      subtitle: 记录当天实验、外业、阅读或代码调优的即时要点。
      filters:
        folders:
          - post/daily-notes
      count: 4
      sort_by: date
      order: desc
    design:
      view: card
      columns: 2

  - block: markdown
    id: science-news
    content:
      title: 科研快讯
      text: |-
        <p class="ql-section-lead">从公开 API 实时抓取气候、水文与遥感新闻，刷新即可获取最新动态。</p>
        {{< latest_science_news id="science-feed-zh" limit="4" >}}
    design:
      columns: '1'

  - block: markdown
    id: open-source
    content:
      title: 开源仓库
      text: |-
        <p class="ql-section-lead">GitHub 公开仓库自动更新，用作模型、数据集与可视化工具的实时列表。</p>
        {{< github_repos id="github-wall-zh" limit="12" >}}
    design:
      columns: '1'

  - block: markdown
    id: knowledge-map
    content:
      title: 知识目录与统计
      text: |-
        <p class="ql-section-lead">快速浏览所有栏目，实时查看数量与最新更新时间，掌握研究节奏。</p>
        {{< info_matrix >}}
    design:
      columns: '1'

  - block: collection
    id: blog
    content:
      title: 博客与项目记录
      subtitle: 深度解析、旅行笔记与项目复盘。
      filters:
        folders:
          - Blog
          - post
      count: 6
      sort_by: date
      order: desc
    design:
      view: article-grid
      fill_image: false
      columns: 3

  - block: markdown
    id: contact
    content:
      title: 保持联系
      text: |-
        <p class="ql-section-lead">欢迎科研合作、项目咨询，或订阅双语更新。</p>
        <div class="ql-contact-card">
          <div class="ql-panel">
            <h3>邮箱</h3>
            <p><a href="mailto:18098503078@163.com">18098503078@163.com</a></p>
          </div>
          <div class="ql-panel">
            <h3>订阅</h3>
            <p><a href="/zh/blogs/">博客</a> · <a href="/zh/post/daily-notes/">每日记录</a> · <a href="https://github.com/QunLuo" target="_blank" rel="noopener">GitHub</a></p>
          </div>
        </div>
    design:
      columns: '1'
---


