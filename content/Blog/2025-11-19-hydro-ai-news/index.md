---
title: 'Science Sprint · 2025-11-19'
summary: Sentinel-1 flood kernels, NOAA GPT-4o river pilots, and my own Plateau operator benchmarks.
date: 2025-11-19T18:30:00+08:00
authors:
  - admin
categories:
  - research-diary
tags:
  - hydro-ai
  - remote-sensing
  - daily-note
featured:
  url: featured.jpg
  alt_text: 'Hydrology x AI dashboard'
  caption: 'Daily dashboard snapshot'
translationKey: blog-2025-11-19
---

> 快速示范：下面这篇是我在 Cursor 里写的一篇“今日科学速记”。根据自己的信息替换内容，然后推送即可。

## 1. Sentinel-1 flood kernels open-sourced

- ESA 的 AI for Earth 团队今天把 *FloodSentry v2* kernels 开源到了 GitHub（MIT License），能把 Sentinel-1 的双极化信息直接转换成 10m 分辨率的淹没几率栅格。
- 我 fork 了一份，并加上了青藏高原 6 个示范流域的配置。只需要 6GB 显存即可跑完整条推理链，非常适合离线预警。

## 2. NOAA × GPT-4o river pilot

- NOAA 宣布本月启动 GPT-4o 助理试点计划，用大语言模型解释 GFS/RAP/NWM 的不确定性。
- 我用他们的 `river-qna` API 做了一个双语 prompt 样例，接入到本站的 Daily Lab Notes，以便访客可以查看解释。

## 3. 自己的实验

- 在 Plateau operator 上把 SWAT 的基线 `NSE=0.71` 提升到 `0.76`，关键是加了 `DEM slope^0.5` 作为注意力 bias。
- 明天准备把这个 bias 写成一个可复用的 PyTorch 模块，然后上传到 `kiwiyolo/hydro-ops`.

## 4. TODO & 分享

- [ ] 写一篇更长的遥感指南，把 FloodSentry v2 的参数讲清楚  
- [ ] 整合 NOAA API 的 prompt，使其支持中文输出  
- [ ] 更新 GitHub Actions 缓存策略，减少部署时间

若你也想写日常速记：使用 `hugo new Blog/<slug>/index.md` 生成模板，把 `date/title/summary` 改一改，再 push 即可。

