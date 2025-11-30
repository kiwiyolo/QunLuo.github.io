---
title: 项目
date: 2024-05-19
type: landing

design:
  spacing: '5rem'

sections:
  - block: collection
    content:
      title: 代表性项目
      text: 精选水文与遥感相关项目，涵盖 AI 模型、实地部署与可视化工具。
      filters:
        folders:
          - project
    design:
      view: article-grid
      fill_image: false
      columns: 3

  - block: markdown
    content:
      title: 目录与统计
      text: |
        {{< directory_stats >}}
    design:
      columns: '1'

  - block: markdown
    content:
      title: 开源仓库
      text: |
        {{< github_repos id="github-projects-zh" limit="12" >}}
    design:
      columns: '1'
---


