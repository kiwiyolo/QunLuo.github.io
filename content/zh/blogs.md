---
title: 博客与笔记
date: 2024-05-19
type: landing

design:
  spacing: '4rem'

sections:
  - block: markdown
    content:
      title: 发布指南
      text: |-
        - **每日实验记**：在 `content/post/daily-notes/` 下新增 Markdown（或运行 `hugo new post/daily-notes/<slug>/index.md`）。  
        - **长文博客**：存放于 `content/Blog/`，聚焦项目复盘与科普。  
        - 若需中文版本，可在 `content/zh/post/...` 中创建对应条目。  
        - 在前言中设置 `comments: false/true` 可覆盖默认评论区行为。
    design:
      columns: '1'

  - block: collection
    id: daily
    content:
      title: 每日实验记
      filters:
        folders:
          - post/daily-notes
      sort_by: date
      order: desc
    design:
      view: card
      columns: 2

  - block: collection
    id: essays
    content:
      title: 博客合集
      filters:
        folders:
          - Blog
      sort_by: date
      order: desc
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
---

