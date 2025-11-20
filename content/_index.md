---
# Leave the homepage title empty to use the site title
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
        <p><strong>Hydrology × AI × Open Science.</strong> I build data-informed runoff forecasts for the Qinghai–Tibet Plateau, automate remote-sensing pipelines, and prototype interpretable neural operators so we can move between models and field notes quickly.</p>
        <ul class="ql-highlight-metrics">
          <li>6+ basin-scale AI models</li>
          <li>40+ awards & fellowships</li>
          <li>3 patents / software copyrights</li>
          <li>Daily bilingual research logs</li>
        </ul>
        <p>
          <a class="btn btn-primary" href="/post/daily-notes/">Daily Lab Notes</a>
          <a class="btn btn-outline-primary" href="/blogs/">Long-form Blog</a>
        </p>
      button:
        text: Download CV
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
      title: Research Threads & Trackers
      text: |-
        <div class="ql-panels">
          <section class="ql-panel">
            <h3>Watershed Intelligence</h3>
            <p>Hybrid physics–ML pipelines (CNN/LSTM, PINNs, graph NNs) for flash flood early warning, precipitation downscaling, and uncertainty-aware runoff estimation.</p>
          </section>
          <section class="ql-panel">
            <h3>Automation & Tooling</h3>
            <p>Reproducible data factories: SWMM/MODFLOW automation, automated QC for satellite products, and GPU workflows for basin-scale experiments.</p>
          </section>
          <section class="ql-panel">
            <h3>Community Signals</h3>
            <p>Aggregating open datasets, conferences, and science news feeds so collaborators can jump in quickly.</p>
          </section>
          <section class="ql-panel">
            <h3>Impact Radar</h3>
            <p>Tracking KPIs: operational basins covered, minutes saved, reproducibility score, and open-source adoption ratio.</p>
          </section>
        </div>
    design:
      columns: '1'

  - block: collection
    id: daily
    content:
      title: Daily Lab Notes
      subtitle: Rapid snippets for experiments, fieldwork, paper reading, or code regressions.
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
      title: Latest Science Watch
      text: |-
        <p class="ql-section-lead">A live feed of climate, hydrology, and earth-observation headlines pulled from public APIs. Refresh to fetch the newest stories.</p>
        {{< latest_science_news id="science-feed-en" limit="4" >}}
    design:
      columns: '1'

  - block: markdown
    id: open-source
    content:
      title: Open Source Stack
      text: |-
        <p class="ql-section-lead">Every public GitHub repository updates automatically. Use this as a living changelog of models, datasets, and visualization utilities.</p>
        {{< github_repos id="github-wall-en" limit="12" >}}
    design:
      columns: '1'

  - block: markdown
    id: knowledge-map
    content:
      title: Knowledge Directory & Stats
      text: |-
        <p class="ql-section-lead">Browse every major collection—counts update automatically so you always know where work is happening.</p>
        {{< info_matrix >}}
        {{< directory_stats >}}
    design:
      columns: '1'

  - block: collection
    id: blog
    content:
      title: Feature Posts & Project Logs
      subtitle: In-depth explainers, travel notes, and retrospectives.
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
      title: Connect & Collaborate
      text: |-
        <p class="ql-section-lead">Reach out for collaborations, policy partnerships, or to subscribe to the bilingual newsletter.</p>
        <div class="ql-contact-card">
          <div class="ql-panel">
            <h3>Rapid Contact</h3>
            <p>Email: <a href="mailto:18098503078@163.com">18098503078@163.com</a></p>
            <p>Wechat/Signal available upon request.</p>
          </div>
          <div class="ql-panel">
            <h3>Stay in the Loop</h3>
            <p><a href="/blogs/">Blog archive</a> · <a href="/post/daily-notes/">Daily notes</a> · <a href="https://github.com/QunLuo" target="_blank" rel="noopener">GitHub</a></p>
          </div>
        </div>
    design:
      columns: '1'
---
