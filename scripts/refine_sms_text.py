# -*- coding: utf-8 -*-
import os

# 1. Update stateMachine.js to avoid SMS emoji encoding issues (??) and refine language
with open("src/core/stateMachine.js", "r", encoding="utf-8") as f:
    code = f.read()

# Replace emoji with clean text for SMS
code = code.replace(
    'Perfecto. Te conecto con ${provider.name} ahora: 📞 ${provider.phone}.\\n` +',
    'Perfecto. Te conecto con ${provider.name} ahora: Tel. ${provider.phone}.\\n` +'
)

with open("src/core/stateMachine.js", "w", encoding="utf-8") as f:
    f.write(code)

print("stateMachine.js refined for clean SMS carrier formatting!")
