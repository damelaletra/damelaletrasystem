# -*- coding: utf-8 -*-
import os, json

os.makedirs('api', exist_ok=True)
with open('api/index.js', 'w', encoding='utf-8') as f:
    f.write('import app from "../server.js";\nexport default app;\n')

vercel_config = {
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/css/(.*)", "destination": "/public/css/$1" },
    { "source": "/js/(.*)", "destination": "/public/js/$1" },
    { "source": "/provider.html", "destination": "/public/provider.html" },
    { "source": "/admin.html", "destination": "/public/admin.html" },
    { "source": "/(.*)", "destination": "/public/index.html" }
  ]
}

with open('vercel.json', 'w', encoding='utf-8') as f:
    json.dump(vercel_config, f, indent=2)

print("vercel.json and api/index.js written strictly without BOM!")
