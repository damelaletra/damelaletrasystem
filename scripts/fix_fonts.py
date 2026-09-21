# -*- coding: utf-8 -*-
import os, json

# 1. Update CSS to include Google Fonts (Outfit & Plus Jakarta Sans) with full Spanish diacritics
css_path = "public/css/style.css"
if os.path.exists(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()

    font_import = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');\n\n"
    if "@import" not in css:
        css = font_import + css

    css = css.replace(
        '--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
        '--font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n  --font-heading: "Outfit", sans-serif;'
    )
    
    css = css.replace(
        '.brand-title {',
        '.brand-title {\n  font-family: var(--font-heading);'
    )
    css = css.replace(
        '.hero-title {',
        '.hero-title {\n  font-family: var(--font-heading);'
    )

    with open(css_path, "w", encoding="utf-8") as f:
        f.write(css)
    print("2. style.css updated with Outfit & Plus Jakarta Sans font families.")

# 2. Add Google Fonts link to HTML files
for html_file in ["public/index.html", "public/admin.html", "public/provider.html"]:
    if os.path.exists(html_file):
        with open(html_file, "r", encoding="utf-8") as f:
            html = f.read()
        
        font_link = '''  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n'''
        
        if "fonts.googleapis.com" not in html:
            html = html.replace('<link rel="stylesheet" href="/css/style.css">', font_link + '  <link rel="stylesheet" href="/css/style.css">')
            with open(html_file, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"3. {html_file} updated with Google Fonts preconnect & link.")
