from PIL import Image, ImageDraw
import os

W, H = 1200, 750
img = Image.new("RGBA", (W, H), (6, 9, 17, 255))
draw = ImageDraw.Draw(img)

# Background subtle grid
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill=(30, 41, 59, 100), width=1)
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill=(30, 41, 59, 100), width=1)

# Header badge
badge_rect = [60, 36, 560, 72]
draw.rounded_rectangle(badge_rect, radius=18, fill=(4, 224, 97, 30), outline=(4, 224, 97, 255), width=2)
draw.ellipse([80, 48, 92, 60], fill=(4, 224, 97, 255))
draw.text((105, 45), "АРХИТЕКТУРА LIQUID GLASS + HYBRID AI + MCP", fill=(4, 224, 97, 255))

# Title
draw.text((60, 88), "Avito AI-Buddy: Оптическая и системная архитектура (SDD)", fill=(255, 255, 255, 255))
draw.text((60, 122), "Hack&Change 2026 • Liquid Glass 6-Tier Elevation (1920x1080 & Mobile) • Gemini 2.5 + RAG + AST", fill=(148, 163, 184, 255))

# 4 Columns of Architecture Flow
boxes = [
    {"title": "1. Liquid Glass UI", "sub": "React 19 + TS + Tailwind v4\n6-Tier Glass Elevation\n1920x1080 & 375px Mobile\nCommand Palette (Ctrl+K)\nToast Hub & 5-Level XP", "color": (0, 170, 255, 255), "x": 60},
    {"title": "2. FastAPI Core", "sub": "Clean Architecture API\nMulti-Persona RBAC\nAST & Pygments Compiler\nCode Review Sandbox\nPrometheus /metrics", "color": (150, 94, 235, 255), "x": 340},
    {"title": "3. Hybrid AI & MCP", "sub": "Gemini 2.5 Flash SDK\nPlaybook RAG (16 Guides)\nDeep Cognitive Engine\n7 MCP Tools (Absence,\nAccess, 1:1, Lead Metrics)", "color": (4, 224, 97, 255), "x": 620},
    {"title": "4. Avito Services", "sub": "Absence System & Calendar\nIAM & Jira ServiceDesk\nChecklist Auto-Save State\nClickstream Event Bus\nSecurity Guardrails (КИ)", "color": (255, 82, 82, 255), "x": 900},
]

for b in boxes:
    x = b["x"]
    draw.rounded_rectangle([x, 168, x + 240, 365], radius=16, fill=(22, 32, 50, 220), outline=b["color"], width=2)
    draw.rounded_rectangle([x, 168, x + 240, 216], radius=16, fill=b["color"])
    draw.text((x + 15, 184), b["title"], fill=(255, 255, 255, 255))
    draw.text((x + 15, 230), b["sub"], fill=(226, 232, 240, 255))

# Arrows between cards
for x in [305, 585, 865]:
    draw.polygon([(x, 260), (x + 25, 267), (x, 275)], fill=(4, 224, 97, 255))

# Bottom row: Specifications
specs = [
    ("SDD-01 Architecture", "Liquid Glass UI, Dual UX,\nFastAPI, Docker Compose", 60),
    ("SDD-02 Hybrid AI", "Gemini 2.5 + 16 RAG гайдов,\nSmart Slot-Filling Guard", 285),
    ("SDD-03 MCP & Code", "7 MCP схем + AST/Compiler\nPre-flight Code Review", 510),
    ("SDD-04 RBAC & Security", "3 персоны (Стажёр/Бадди/\nЛид), защита ПДн и КИ", 735),
    ("SDD-05 Product Metrics", "-45% рутины, Time to PR\n2.4 дня, Offer Score 82", 960),
]

for title, desc, x in specs:
    draw.rounded_rectangle([x, 395, x + 180, 520], radius=12, fill=(15, 23, 42, 235), outline=(71, 85, 105, 200), width=1)
    draw.text((x + 10, 410), title, fill=(56, 189, 248, 255))
    draw.text((x + 10, 445), desc, fill=(148, 163, 184, 255))

# Value Metrics Card
draw.rounded_rectangle([60, 550, 1140, 690], radius=16, fill=(22, 32, 50, 230), outline=(4, 224, 97, 190), width=1)
draw.text((80, 568), "Ключевые архитектурные преимущества Avito AI-Buddy (Hack&Change 2026):", fill=(4, 224, 97, 255))
draw.text((80, 602), (
    "• Liquid Glass Dual-Ergonomics: 6 уровней стекла (backdrop-blur, specular highlights), 1920x1080 без скролл-ловушек + MobileNavBar (>=44px).\n"
    "• Реальная песочница код-ревью: AST/Compiler валидация + детекция SQL-инъекций, Race Conditions, N+1 и 10 золотых правил ZBP.\n"
    "• Гибридный ИИ для 3 ролей: Gemini 2.5 Flash + 16 инженерных гайдов Playbook RAG + Deep Cognitive Engine (112 тестов, 87% покрытие)."
), fill=(241, 245, 249, 255))

out_dirs = [
    "C:/Users/Alexandro/avito-ai-buddy/docs",
    "C:/Users/Alexandro/.gemini/antigravity/scratch/avito-ai-buddy/docs"
]
for d in out_dirs:
    if os.path.exists(os.path.dirname(d)):
        os.makedirs(d, exist_ok=True)
        p = os.path.join(d, "stage1_architecture.png")
        img.save(p, "PNG")
        print("Saved image to:", p)
