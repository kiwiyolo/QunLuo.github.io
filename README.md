# LUO Qun · 罗群

Source for [qunluo-kiwi.com](https://qunluo-kiwi.com/), the personal website of LUO Qun.

## Content

- Home and biography: Earth system science, hydrology, and interpretable AI.
- Research: water quality, precipitation nowcasting, runoff change, and seasonal sea surface temperature forecasting.
- Publications: verified journal articles and a conference abstract, with DOI links.
- Blog: the author's research reflections.
- Contact, subscription, and research resources.

## Build and publish

Install Quarto 1.10.18, then run:

```sh
quarto render
```

The output is written to `_site/`. The GitHub Actions workflow renders the website and publishes it to the `gh-pages` branch. GitHub Pages serves that branch using the domain in `CNAME`.

The render list in `_quarto.yml` deliberately includes only published pages. Local drafts, documentation, research source files, and backend code are not pages.

The subscription and blog interaction features use the existing Supabase backend and Cloudflare Turnstile configuration. Backend functions are maintained separately under `supabase/`.

## Maintenance

Edit the Quarto source files, not the generated HTML. Keep the owner-only planner link in the navigation; the planner is a separate application.

Only publish personal facts supported by the author's materials or the original publication. Keep original CVs, admission documents, application identifiers, and private research data out of this repository.

## Licence

See [LICENSE](LICENSE) for the website code. Referenced publications and third-party software retain their own licences.
