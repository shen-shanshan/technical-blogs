# technical-blogs

Source of my personal technical blog, published at <https://shen-shanshan.github.io/technical-blogs>.

The site template is ported from [vllm-project.github.io](https://github.com/vllm-project/vllm-project.github.io) (Jekyll + [Minima](https://github.com/jekyll/minima)).

## Local development

1. Install `jekyll` and `bundler` by running `gem install jekyll bundler`.
2. `bundle install` to install the necessary gems.
3. `rm ./Gemfile.lock` if you meet gem error.
4. `bundle exec jekyll serve` to compile and start the server, then open <http://localhost:4000/technical-blogs/>.

## Writing a blog post

Add a Markdown file named `_posts/YYYY-MM-DD-your-blog-name.md` with front matter like:

```markdown
---
layout: post
title: "Your Blog Title"
author: "Shanshan Shen"
summary: "A concise description for SEO."
math: true # optional, enables MathJax
---

Content here.
```

Some notes:
- The blogpost will only show when its date is in the past.
- Put figures under `assets/figures/your-blog-name/`. Because the site is served under `/technical-blogs`, always reference them through `relative_url` instead of a bare `/assets/...` path, e.g. `![alt]({{ '/assets/figures/your-blog-name/xxx.png' | relative_url }})`.

The site is automatically built and deployed by GitHub Actions (`.github/workflows/pages-deploy.yml`) when `master` is pushed to. Pull requests only run the build as a check.

## LaTeX Math

The blog supports LaTeX math via [MathJax](https://docs.mathjax.org/en/latest/index.html).

It can be enabled by adding `math: true` to the document frontmatter. It has been configured to support the standard LaTeX style math notation, i.e.:

```latex
$ inline math $
```

```latex
$$
math block
$$
```

## GitHub Flavored Admonitions

The blog supports GitHub flavored admonitions via [jekyll-gfm-admonition](https://github.com/Helveg/jekyll-gfm-admonitions). It supports the following syntax:

```markdown
> [!NOTE]
> Highlights information that users should take into account, even when skimming.

> [!TIP]
> Optional information to help a user be more successful.

> [!IMPORTANT]
> Crucial information necessary for users to succeed.

> [!WARNING]
> Critical content demanding immediate user attention due to potential risks.

> [!CAUTION]
> Negative potential consequences of an action.
```

## Theme customization

The theme is [Minima](https://github.com/jekyll/minima). To customise anything from this theme, see [Overriding theme defaults](https://jekyllrb.com/docs/themes/#overriding-theme-defaults). Custom styles live in `_sass/minima/custom-styles.scss`, and extra `<head>` content in `_includes/custom-head.html`.
