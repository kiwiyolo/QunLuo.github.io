# LUO Qun · 罗群

Source for [qunluo-kiwi.com](https://qunluo-kiwi.com/), the personal website of LUO Qun.

## Content

- Home: the original illustrated community with eight existing destinations and seven new destinations marked as developing.
- Biography: the original photo-and-profile component with verified personal information.
- Research: water quality, precipitation nowcasting, runoff change, and seasonal sea surface temperature forecasting.
- Publications: verified journal articles and a conference abstract, with DOI links.
- Blog: the author's research reflections.
- Contact, subscription, and research resources.

## Preserve the original design

Keep the illustrated city, its eight navigation targets and hover behaviour, the original theme, page icons, six project cards, publication thumbnails, research gallery, and Closeread research story. Update personal text, verified research figures, and destination links within those components; do not replace the layout with a different homepage design.

The city artwork and building assets are retained from the existing site framework. The research gallery shows figures from the author's research presentations, with links to the corresponding publications; these figures are distinct from the site's decorative navigation artwork.

## Build and publish

Install Quarto 1.10.18, then run:

```sh
quarto render
```

The output is written to `_site/`. The GitHub Actions workflow renders the website and publishes it to the `gh-pages` branch. GitHub Pages serves that branch using the domain in `CNAME`.

The render list in `_quarto.yml` deliberately includes only published pages. Local drafts, documentation, research source files, and backend code are not pages.

The subscription and blog interaction features use the existing Supabase backend and Cloudflare Turnstile configuration. Backend functions are maintained separately under `supabase/`.

Subscription confirmation retains gateway JWT verification and validates a signed, expiring email token. `assets/supabase-public.json` contains only the project's public `anon` browser key. Never put management tokens, service-role keys, email-provider keys, or signing secrets in website assets.

Navigation uses icons with labels on hover or keyboard focus. The language icon switches directly to the equivalent English or Chinese page. Seven new map crops and destinations are listed in `scripts/community.json`; Life uses the beach umbrella, and Interstellar uses the pier.

The map character uses transparent running frames rendered from a Kirito 3D fan model by すがき（すがきれもん）. See `assets/character/ATTRIBUTION.md`. Original model files and textures are not distributed. Motion stops outside the map and respects reduced-motion preferences.

Blog interactions belong to individual posts. For a new post, include the matching `_includes/turnstile-head.html` in the header and `_includes/turnstile-blog.html` after the body (use the `-zh` editions for Chinese). The post-render step places the component inside the article. Keep `blog/index.qmd` free of these includes; both languages share one canonical post slug in the backend.

## Maintenance

Edit the Quarto source files, not the generated HTML. Keep the owner-only planner link in the navigation; the planner is a separate application.

Only publish personal facts supported by the author's materials or the original publication. Keep original CVs, admission documents, application identifiers, and private research data out of this repository.

## Licence

See [LICENSE](LICENSE) for the website code. Referenced publications and third-party software retain their own licences.
