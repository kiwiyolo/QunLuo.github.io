---
title: Blog
summary: Essays and research notes
type: section

cascade:
  - _target:
      kind: page
    params:
      show_breadcrumb: true

sections:
  - block: collection
    id: blog-list
    content:
      title: Blog Entries
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
