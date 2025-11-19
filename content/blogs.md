---
title: 'Blogs & Notes'
date: 2024-05-19
type: landing

design:
  spacing: '4rem'

sections:
  - block: markdown
    content:
      title: Publishing Playbook
      text: |-
        - **Daily Lab Notes** → add Markdown files under `content/post/daily-notes/` (or use `hugo new post/daily-notes/<slug>/index.md`).  
        - **Long-form Blogs** live in `content/Blog/` for curated essays, travel notes, and tutorials.  
        - Keep bilingual parity by adding a Chinese translation in `content/zh/post/...` when ready.  
        - Use `comments: false` (or `true`) in front matter to override the default Utterances comment block.
    design:
      columns: '1'

  - block: collection
    id: daily
    content:
      title: Daily Lab Notes
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
      title: Essays & Research Blogs
      filters:
        folders:
          - Blog
      sort_by: date
      order: desc
    design:
      view: article-grid
      fill_image: false
      columns: 3
---
