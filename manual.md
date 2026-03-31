# Manual (Source vs. Deployed Site)

Current -->  gh-pa

> ### GitHub Pages 最终“显示哪一份 img/ 、 content/ …” 不取决于 main 里有没有这些目录 ，而是取决于你在仓库 Settings → Pages 里配置的“发布源”（Source）。
>
> 决定显示哪个的规则
>
> - 如果 Pages Source 选的是 gh-pages 分支（root 或 /docs）
>   - 线上展示的是 gh-pages 分支里对应路径的文件 （例如 img/... 、 content/... ）。
>   - main 分支同名目录不会被用来对外展示。
> - 如果 Pages Source 选的是 main 分支 + /docs （或旧式直接从 main root 部署）
>   - 线上展示的是 main 分支对应目录里的文件 （通常是 docs/ 目录内的静态站点）。
>   - 此时 gh-pages 分支即使有文件，也不会影响页面展示。
> - 如果你用 GitHub Actions 的 “Deploy to GitHub Pages” 新流程
>
> Pages 展示的是 workflow 生成的 artifact（内部仍会落到 Pages 的发布源），核心依然是“Pages Source 指向哪里”
>
> #### 用 main 和 gh-pages 两个分支（你说的“两个库”本质是 同一个 repo 的两个分支 ）的核心原因是： 把“源代码/可编辑内容”和“构建产物/可部署静态文件”彻底分离 ，避免互相污染、也方便自动化部署。
>
> 为什么要分 main / gh-pages
>
> - main 放源文件 ： .qmd 、 \_quarto.yml 、 content/ 、 blog/ 、 img/ （原始素材）、样式文件、workflow 等，适合协作、review、长期维护。
> - gh-pages 放构建结果 ： index.html 、 content/\*.html 、 site\_libs/ 、 search.json 、 sitemap.xml 等，给 GitHub Pages 直接拿来“静态托管”。
> - 分离的好处
>   - main 变更清晰：你只在源文件上改，不会被大量自动生成的 HTML/依赖文件淹没 diff。
>   - gh-pages 可随时重建：产物坏了就重新 render 再发布，不影响源历史。
>   - repo 不容易膨胀：产物体积通常很大，放在单独分支更可控。
>     怎么管理区分（推荐的规则）
> - 唯一编辑入口：只改 main
>   - 日常只在 G:\lq\personal\_website\_kiwi\QunLuo.github.io 里编辑并 git commit 到 main 。
>   - 不要手工在 gh-pages 分支里改 HTML（除非紧急救火且你知道后果）。
> - gh-pages 只由流水线生成
>   - 你已经有 .github/workflows/publish.yml ，它会在 main push 后自动把产物发布到 gh-pages 。
>   - 这样 gh-pages 变成“只读产物分支”，你只管改源、push，部署交给 Actions。
> - 目录层面怎么理解
>   - QunLuo.github.io/ ：源（对应 main ）
>   - QunLuo.github.io-gh-pages/ ：本地的一份“gh-pages 将要包含的内容”的输出目录（不建议把它合进 main 提交）
>     避免搞混的操作习惯
> - 永远在源目录执行 git 操作（commit/push）：
>   - cd G:\lq\personal\_website\_kiwi\QunLuo.github.io
>   - git status 确认你在 main 分支
> - 想看线上最终效果，就去看 gh-pages 分支内容或 Pages 网址；不要把产物当源来改。
> - 如果你确实需要“手动发布”（例如 Actions 不可用），才临时把 QunLuo.github.io-gh-pages 强推到远端 gh-pages ，并把它当作一次性的发布动作。
>   一句话总结： main 是你写作/开发的工作区；gh-pages 是机器生成的发布区 。只要你坚持“只改 main、gh-pages 自动生成”，就不会乱。

## 1. Project Overview

- This repository is a Quarto website project. You edit source content in `G:\lq\personal_website_kiwi\QunLuo.github.io` and deploy the rendered static site to GitHub Pages.
- There are two local directories involved:
  - `QunLuo.github.io/`: the editable source project (Quarto `.qmd`, styles, images, extensions, and workflow config).
  - `QunLuo.github.io-gh-pages/`: a built static website output (HTML, JS/CSS bundles, search indices, etc.). This matches what ends up in the remote `gh-pages` branch.
- GitHub Pages URL patterns:
  - Project site (repo Pages): `https://<owner>.github.io/<repo>/`
    - For this repo name, expected: `https://kiwiyolo.github.io/QunLuo.github.io/`
  - User/organization site (special repo `<owner>.github.io`): `https://<owner>.github.io/`
- The source config currently sets:
  - `website.site-url: https://kiwiyolo.github.io/QunLuo.github.io/` in `_quarto.yml`.

## 2. Directory Trees

### 2.1 `QunLuo.github.io/` (source project)

```text
QunLuo.github.io/
├─ .github/
│  └─ workflows/
│     └─ publish.yml
├─ _extensions/
│  ├─ mcanouil/iconify/...
│  ├─ qmd-lab/closeread/...
│  └─ quarto-ext/fontawesome/...
├─ _freeze/
│  ├─ blog/...
│  ├─ content/...
│  └─ site_libs/...
├─ blog/
│  ├─ index.qmd
│  ├─ 4rs.qmd
│  ├─ awesome-pkm.qmd
│  ├─ closeread-cheatsheet.qmd
│  ├─ consequences-notetaking.qmd
│  ├─ dissertation-journal.qmd
│  ├─ half-a-year-of-reading.qmd
│  ├─ microblogging.qmd
│  ├─ notetaking-part1.qmd
│  ├─ notetaking-part2.qmd
│  ├─ project-management.qmd
│  ├─ quartose.qmd
│  ├─ sketchnoting-beginners.qmd
│  └─ img/
│     ├─ book-covers/...
│     └─ (many image assets used in posts)
├─ content/
│  ├─ about.qmd
│  ├─ contact.qmd
│  ├─ datasets.qmd
│  ├─ illustrations.qmd
│  ├─ open-science.qmd
│  ├─ privacy.qmd
│  ├─ project.qmd
│  ├─ publications.qmd
│  ├─ shrews.qmd
│  └─ talks.qmd
├─ data/
│  ├─ al_data.rds
│  └─ al_fitted.rds
├─ img/
│  ├─ icons/...
│  ├─ illustrations/...
│  └─ (site-wide images)
├─ README.md
├─ Website.Rproj
├─ _quarto.yml
├─ closeread.css
├─ custom.scss
├─ favicon.ico
├─ icon-position.R
└─ index.qmd
```

Notes:

- `_freeze/` is Quarto’s frozen execution/output cache (because `_quarto.yml` sets `execute.freeze: auto`). It can become large.
- `_extensions/` contains Quarto extensions used by the site (iconify, closeread, fontawesome).

### 2.2 `QunLuo.github.io-gh-pages/` (rendered output)

```text
QunLuo.github.io-gh-pages/
├─ .nojekyll
├─ index.html
├─ sitemap.xml
├─ robots.txt
├─ search.json
├─ listings.json
├─ blog/
│  ├─ index.html
│  ├─ notetaking-part1.html
│  ├─ notetaking-part2.html
│  ├─ quartose.html
│  ├─ microblogging.html
│  └─ (other posts as .html)
├─ content/
│  ├─ about.html
│  ├─ contact.html
│  └─ (other pages as .html)
├─ img/
│  └─ (copied static assets)
└─ site_libs/
   ├─ bootstrap/...
   ├─ clipboard/...
   ├─ kePrint-0.0.1/...
   ├─ lightable-0.0.1/...
   ├─ quarto-html/...
   ├─ quarto-listing/...
   ├─ quarto-nav/...
   └─ quarto-search/...
```

Notes:

- `index.html` shows it was generated by Quarto (`<meta name="generator" content="quarto-1.9.36">`).
- `site_libs/` contains bundled runtime dependencies used by Quarto output.

## 3. Key Files and What to Edit

### 3.1 Site configuration

- Source: `_quarto.yml`
  - Produces: affects site-wide output (navigation, metadata, base URLs).
  - Typical edits:
    - `website.title`, `website.navbar`, `website.page-footer`
    - `website.site-url` (important for correct links on GitHub Pages)
  - Gotchas:
    - For project pages (`/<repo>/`), `site-url` should include the repo segment, otherwise links/search/sitemap can be wrong.
    - `execute.freeze: auto` means rendered caches can be committed unless you manage them carefully.

### 3.2 Home page

- Source: `index.qmd`
  - Output: `QunLuo.github.io-gh-pages/index.html`
  - Typical edits:
    - Update hero text, images under `img/`, and navigation links.
  - Gotchas:
    - This file includes an HTML block with links like `content/about.qmd`. Quarto resolves these during rendering, but you should keep the paths consistent and avoid hardcoding `.html` in source unless you mean it.

### 3.3 Blog posts

- Source: `blog/*.qmd`
  - Output: `QunLuo.github.io-gh-pages/blog/<same-slug>.html`
    - Example: `blog/notetaking-part1.qmd` → `blog/notetaking-part1.html`
  - Observed front matter pattern (example from `blog/notetaking-part1.qmd`):
    - `title`, `description`, `date`, optional `image`, `categories: [...]`
  - Images:
    - Many posts reference images under `blog/img/...` (relative paths used in posts).
  - Gotchas:
    - Keep file names stable: the output `.html` name is derived from the source file name.
    - If a post uses executed code blocks, freezing and caches can impact reproducibility and repo size.

### 3.4 Static pages

- Source: `content/*.qmd`
  - Output: `QunLuo.github.io-gh-pages/content/<same-name>.html`
    - Example: `content/about.qmd` → `content/about.html`
  - Typical edits:
    - Update page content, icons, and references to `../img/...` assets.
  - Gotchas:
    - Many pages use `format.html.toc: false` or custom classes. Preserve these if you rely on existing styling.

### 3.5 Styling

- Source:
  - `custom.scss` (Quarto theme in `_quarto.yml`)
  - `closeread.css`
  - `blog/` and `content/` may also contain inline HTML/CSS blocks.
- Output:
  - Styles get compiled and included in HTML output. Some libraries/styles appear in `QunLuo.github.io-gh-pages/site_libs/...`.
- Gotchas:
  - When changing theme variables, rebuild to confirm no layout regressions.

### 3.6 Assets (images, data)

- Source:
  - `img/` (site-wide images)
  - `blog/img/` (blog-specific images)
  - `data/*.rds` (data files used by some posts/pages)
- Output:
  - Copied into `QunLuo.github.io-gh-pages/img/...` and related asset paths.
- Gotchas:
  - Large binary files can bloat git history quickly (especially `gh-pages` artifacts and images).

## 4. Content Workflow (Editing + Writing Logs)

### 4.1 Adding a new blog post

- Create a new file in `blog/`:
  - Use a stable slug-like filename: `blog/<topic-or-date>-<slug>.qmd` (avoid spaces).
- Add YAML front matter (match existing pattern):

```yaml
---
title: "Your Post Title"
description: "One-line summary for previews/search"
date: 2026-03-31
categories: [Category1, Category2]
---
```

- Put post images under `blog/img/<post-slug>/...` (recommended convention) and reference them with relative paths.
- Link the post from `blog/index.qmd` if you maintain a manual listing there (check how the current listing is defined).

### 4.2 Updating static pages

- Edit the relevant file in `content/` (e.g., `content/about.qmd`).
- Keep icon references consistent (most pages use icons under `img/icons/`).
- Rebuild and verify the corresponding output HTML under `QunLuo.github.io-gh-pages/content/...`.

### 4.3 Dev Log convention (no extra files created)

- Recommended lightweight convention:
  - Keep a running “dev log” section in commit messages using a consistent prefix, e.g.:
    - `log: ...` for worklog-style commits
    - `content: ...` for writing edits
    - `style: ...` for CSS/theme edits
    - `deploy: ...` for deployment changes
  - For longer notes, add a dated block at the bottom of `README.md` under a “Dev Notes” heading (if you want notes versioned with the repo), but avoid storing secrets/tokens.

## 5. Build & Deploy

### 5.1 Current deployment configuration (GitHub Actions)

- Workflow file: `.github/workflows/publish.yml`
- Triggers:
  - On push to `main`
  - Manual trigger via `workflow_dispatch`
- What it does:
  - Checks out the repo
  - Sets up R
  - Installs R packages: `rmarkdown`, `knitr`, `tidyverse`, `quartose`, `kableExtra`
  - Sets up Quarto
  - Publishes to the `gh-pages` branch using `quarto-dev/quarto-actions/publish@v2` and `GITHUB_TOKEN`
- Expected result:
  - The remote `gh-pages` branch is updated with the rendered site.

### 5.2 Deployment approach A: Let GitHub Actions build and publish

- Edit source in `QunLuo.github.io/`
- Commit and push to `main`
- GitHub Actions runs and updates `gh-pages`

Ensure repo Pages settings:

```
cd G:\lq\personal_website_kiwi\QunLuo.github.io

git status
git add -A
git commit -m "content: update icon\"

git remote set-url origin https://github.com/kiwiyolo/QunLuo.github.io.git
git push -u origin main
```

### 5.3 Deployment approach B: Manually push `QunLuo.github.io-gh-pages/` to `gh-pages`

Use this if you already have the rendered output and want to publish it directly.

PowerShell example (will overwrite remote `gh-pages` contents):

```powershell
cd G:\lq\personal_website_kiwi\QunLuo.github.io-gh-pages

git init
git checkout -B gh-pages
git add -A
git commit -m "Deploy site"

git remote remove origin 2>$null
git remote add origin https://github.com/kiwiyolo/QunLuo.github.io.git

git push -f origin HEAD:gh-pages
```

### 5.4 Local rendering (optional)

- If `quarto` is not available on your machine (e.g., PowerShell says it cannot find the command), install Quarto first.
- Typical local build commands:

```powershell
cd G:\lq\personal_website_kiwi\QunLuo.github.io
quarto render
```

Quarto output may appear in a `_site/` directory depending on project settings (do not assume it exists unless you render locally).

## 6. Common Tasks & Troubleshooting

### 6.1 Fixing broken links (site-url / base URL)

- Symptom: links work locally but break on GitHub Pages, or search/sitemap points to wrong URLs.
- Check `_quarto.yml`:
  - `website.site-url` should match your Pages base URL:
    - Project site: `https://kiwiyolo.github.io/QunLuo.github.io/`
    - User site: `https://kiwiyolo.github.io/`
- Re-render and redeploy after changing `site-url`.

### 6.2 SSH: “Permission denied (publickey)”

- Meaning: your local SSH key is not authorized for the GitHub account.
- Fast workaround: use HTTPS + a Personal Access Token (PAT) for pushing.
- SSH fix path:
  - Add your public key to GitHub (Settings → SSH and GPG keys).
  - Verify with:

```powershell
ssh -T git@github.com
```

### 6.3 Repo size and large output artifacts

- `QunLuo.github.io-gh-pages/` and `QunLuo.github.io/_freeze/` can both get large.
- Recommended:
  - Keep source edits in `main`.
  - Deploy built output to `gh-pages` (via Actions) instead of committing bulky rendered files to `main`.
  - Be cautious with adding large binaries (images, `.rds`, etc.) without a plan.

## 7. Appendix: Mapping Table

| Source (editable)           | Output (deployed)            |
| --------------------------- | ---------------------------- |
| `index.qmd`                 | `index.html`                 |
| `content/about.qmd`         | `content/about.html`         |
| `blog/notetaking-part1.qmd` | `blog/notetaking-part1.html` |

