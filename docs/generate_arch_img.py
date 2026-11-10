from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 750
img = Image.new("RGBA", (W, H), (15, 23, 42, 255))
draw = ImageDraw.Draw(img)

# Background subtle grid / glow
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill=(30, 41, 59, 120), width=1)
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill=(30, 41, 59, 120), width=1)

# Header badge
badge_rect = [60, 40, 460, 75]
draw.rounded_rectangle(badge_rect, radius=18, fill=(4, 224, 97, 30), outline=(4, 224, 97, 255), width=2)
draw.ellipse([80, 52, 92, 64], fill=(4, 224, 97, 255))
draw.text((105, 48), "ЭТАП 1: АРХИТЕКТУРА И SDD СОГЛАСОВАНЫ", fill=(4, 224, 97, 255))

# Title
draw.text((60, 95), "Avito AI-Buddy: Архитектура системы и SDD-спецификации", fill=(255, 255, 255, 255))
draw.text((60, 130), "Hack&Change 2026 • ИИ-наставник для стажёров • Glassy Liquid UI + MCP", fill=(148, 163, 184, 255))

# 4 Columns of Architecture Flow
boxes = [
    {"title": "1. Client (Glassy UI)", "sub": "React 19 + TypeScript\nZustand + Zod\nFramer Motion Glass\n< 200ms latency", "color": (0, 170, 255, 255), "x": 60},
    {"title": "2. Backend API", "sub": "FastAPI (Async)\nRBAC Middleware\nClickstream Logger\nSSE Streaming", "color": (150, 94, 235, 255), "x": 340},
    {"title": "3. MCP Core", "sub": "Model Context Protocol\nAbsence Tool (Отгулы)\nAccess Tool (SPT/k8s)\nPlaybook RAG Tool", "color": (4, 224, 97, 255), "x": 620},
    {"title": "4. Avito Services", "sub": "Absence System Mock\nIAM & Jira ServiceDesk\nSQLite / Postgres\nRedis State Mock", "color": (255, 82, 82, 255), "x": 900},
]

for b in boxes:
    x = b["x"]
    # Outer card
    draw.rounded_rectangle([x, 175, x + 240, 360], radius=16, fill=(30, 41, 59, 200), outline=b["color"], width=2)
    # Header of card
    draw.rounded_rectangle([x, 175, x + 240, 225], radius=16, fill=b["color"])
    draw.text((x + 15, 190), b["title"], fill=(255, 255, 255, 255))
    draw.text((x + 15, 240), b["sub"], fill=(226, 232, 240, 255))

# Arrows between cards
for x in [305, 585, 865]:
    draw.polygon([(x, 260), (x + 25, 267), (x, 275)], fill=(4, 224, 97, 255))

# Bottom row: Specifications
specs = [
    ("SDD-01 Architecture", "Clean Architecture, стек Авито, Docker", 60),
    ("SDD-02 Dialog & Intents", "FSM диалогов, слот-филлинг отгула", 285),
    ("SDD-03 MCP Tool Schemas", "6 JSON-RPC инструментов сервисов", 510),
    ("SDD-04 RBAC & Security", "Роли: стажер/бадди/лид, без ПДн", 735),
    ("SDD-05 Product Metrics", "-45% рутины ментора, A/B пилот", 960),
]

for title, desc, x in specs:
    draw.rounded_rectangle([x, 395, x + 180, 520], radius=12, fill=(15, 23, 42, 230), outline=(71, 85, 105, 200), width=1)
    draw.text((x + 10, 410), title, fill=(56, 189, 248, 255))
    draw.text((x + 10, 445), desc, fill=(148, 163, 184, 255))

# Value Metrics Card
draw.rounded_rectangle([60, 550, 1140, 680], radius=16, fill=(30, 41, 59, 220), outline=(4, 224, 97, 180), width=1)
draw.text((80, 570), "Бизнес-ценность для Авито (Hack&Change 2026):", fill=(4, 224, 97, 255))
draw.text((80, 605), "• Экономия 22-26 часов наставника на одного стажера (сокращение повторяющейся рутины на 45%).\n• Сокращение времени получения доступов и первого коммита стажера с 7 до 3.5 дней.\n• Автоматизация кадровых процедур (отгулы, дей-оффы) и прозрачный трекинг чек-листа в режиме 24/7.", fill=(241, 245, 249, 255))

out_dir = "C:/Users/Alexandro/.gemini/antigravity/scratch/avito-ai-buddy/docs"
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "stage1_architecture.png")
img.save(out_path, "PNG")
print("Saved image to:", out_path)
