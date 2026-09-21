# -*- coding: utf-8 -*-
with open("server.js", "r", encoding="utf-8") as f:
    code = f.read()

# Ensure export default app is present for Vercel Serverless
if "export default app" not in code:
    code += "\nexport default app;\n"

with open("server.js", "w", encoding="utf-8") as f:
    f.write(code)

print("server.js updated with export default app for Vercel serverless compatibility!")
