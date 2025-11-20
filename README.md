# Qun Luo | Hydro-AI Notebook

This repository hosts a customized Hugo (HugoBlox) site that tracks research, daily bilingual notes, open-source activity, and curated science news.

## Highlights

- 🎨 **New layout + color system** — custom SCSS gradients, stat cards, and panel grids keep sections well defined.
- 🌐 **Bilingual (EN/中文) routing** — `/` serves English, `/zh/` serves simplified Chinese with translated landing, blog, and log pages (shortcodes now require explicit `id=` parameters to guarantee stable DOM targets).
- 🗒️ **Daily Lab Notes** — dedicated section (`content/post/daily-notes/`) for quick experiment updates, mirrored in Chinese when needed.
- 📰 **Live science feed** — `latest_science_news` shortcode pulls from a configurable public API endpoint (default: Spaceflight News).
- 💻 **GitHub repo wall** — `github_repos` shortcode lists every public repository dynamically via the GitHub API.
- 🧭 **Knowledge directory panel** — `{{< info_matrix >}}` shows counts & last update timestamps for each major section, mirroring references like blog.kimbell.top.
- 💬 **Utterances comments** — automatically enabled on posts/projects; set `comments: false` per page to opt out.
- ⚙️ **CI/CD ready** — GitHub Actions workflow builds and deploys to the `gh-pages` branch and can be triggered manually or on schedule.

## Content Model

| Section | Location | Notes |
| --- | --- | --- |
| Homepage | `content/_index.md` & `content/zh/_index.md` | Controls hero, highlights, news, repo wall, contact block. |
| Daily Lab Notes | `content/post/daily-notes/` | One folder per day (`hugo new post/daily-notes/<slug>/index.md`). |
| Blogs | `content/Blog/` | Long-form essays; mirror under `content/zh/Blog/` if you need translations. |
| Projects | `content/project/` | Displayed on `/projects` and `/zh/projects`. |
| Publications | `content/publication/` and `content/zh/publication/` | Uses citation view. |

## Updating Content

1. **Daily note**
   ```bash
   hugo new post/daily-notes/2024-11-20-fieldtrip/index.md
   ```
   Fill the Markdown file; add `translationKey` if you plan to add a Chinese counterpart at `content/zh/post/daily-notes/...`.

2. **Blog post**
   ```bash
   hugo new Blog/my-new-post/index.md
   ```
   Include images/audio under the same folder. Optional `comments: false` disables Utterances for that page.

3. **Science feed endpoint**
   - Change `integrations.news_endpoint` in `config/_default/params.yaml`.

4. **GitHub username/topic filter**
   - Update `profile.github_username` and `integrations.repo_topic_filter` in the same params file.

5. **Directory/stats panel**
   - The homepage drops in `{{< info_matrix >}}`. To customize sections or translations, edit `layouts/shortcodes/info_matrix.html`.

## Local Development

```bash
hugo server -D
```

Visit `http://localhost:1313/` (English) or `http://localhost:1313/zh/` (Chinese). Live reload picks up SCSS/shortcode changes automatically.

## Deploying to GitHub Pages

1. **Repository settings**
   - Set default branch to `main`.
   - Enable Pages → “Deploy from branch” → `gh-pages` and `/` directory (GitHub will create it on first deployment).

2. **Secrets (optional)**
   - The bundled workflow only needs the default `GITHUB_TOKEN`. Add other secrets if you integrate extra APIs.

3. **Workflow**
   - File: `.github/workflows/deploy.yml`
   - Triggered on every push to `main`, manual dispatch, and a nightly cron (`02:00 UTC`) to refresh the science/news widgets.
   - Steps: checkout → install Hugo → `hugo mod tidy` → `hugo --minify` → publish to `gh-pages` via `peaceiris/actions-gh-pages`.

4. **Manual deployment**
   ```bash
   hugo --minify
   npx gh-pages -d public
   ```
   (Only needed if you want to bypass Actions.)

## Troubleshooting

- **Rate-limited GitHub API** — unauthenticated requests allow ~60 calls/hour. Add a lightweight proxy or cache if needed.
- **News source offline** — replace the endpoint with another JSON/RSS API under `params.integrations.news_endpoint`.
- **Comments repo mismatch** — Utterances posts issues in `QunLuo/QunLuo.github.io`. Update `layouts/partials/hooks/body-end/comments.html` if you fork this project.

Enjoy the automation! Open an issue if you hit a bug or want to extend the workflow.***
