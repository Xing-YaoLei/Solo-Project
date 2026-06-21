from PIL import Image, ImageDraw, ImageFont
import os

output_dir_photos = "assets/photos"
output_dir_traj = "assets/trajectories"

os.makedirs(output_dir_photos, exist_ok=True)
os.makedirs(output_dir_traj, exist_ok=True)

bg_color_intact = (46, 125, 50)
bg_color_damaged = (198, 40, 40)
bg_color_trajectory = (22, 33, 62)
text_color = (255, 255, 255)
sub_text_color = (200, 200, 200)

try:
    font_large = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 48)
    font_medium = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 24)
    font_small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
except:
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()

photo_items = [
    {"id": "photo_01", "name": "奶茶完好", "status": "intact", "desc": "奶茶一杯，包装完好", "emoji": "�"},
    {"id": "photo_02", "name": "玻璃瓶损坏", "status": "damaged", "desc": "玻璃瓶装饮料，瓶身有裂痕", "emoji": "🍾💔"},
    {"id": "photo_03", "name": "蛋糕盒完好", "status": "intact", "desc": "蛋糕盒完好无损，封条完整", "emoji": "🎂"},
    {"id": "photo_04", "name": "水果包装损坏", "status": "damaged", "desc": "生鲜水果，外包装有压痕", "emoji": "🍎💔"},
    {"id": "photo_05", "name": "信封损坏", "status": "damaged", "desc": "文件快递，信封角部折痕", "emoji": "✉️💔"},
]

for item in photo_items:
    img = Image.new('RGB', (600, 400), color=bg_color_intact if item["status"] == "intact" else bg_color_damaged)
    draw = ImageDraw.Draw(img)

    draw.text((300, 100), item["emoji"], fill=text_color, font=font_large, anchor="mm")

    draw.text((300, 200), item["name"], fill=text_color, font=font_large, anchor="mm")

    draw.text((300, 270), item["desc"], fill=sub_text_color, font=font_medium, anchor="mm")

    status_text = "完好 INTACT" if item["status"] == "intact" else "损坏 DAMAGED"
    draw.text((300, 340), status_text, fill=text_color, font=font_small, anchor="mm")

    filename = f'{item["id"]}_{item["status"]}.png'
    filepath = os.path.join(output_dir_photos, filename)
    img.save(filepath)
    print(f"Created: {filepath}")

trajectory_items = [
    {"id": "traj_normal_01", "name": "正常轨迹-骑手A", "status": "normal"},
    {"id": "traj_abnormal_01", "name": "异常轨迹-骑手A", "status": "abnormal"},
    {"id": "traj_normal_02", "name": "正常轨迹-骑手B", "status": "normal"},
    {"id": "traj_abnormal_02", "name": "异常轨迹-骑手B", "status": "abnormal"},
]

for item in trajectory_items:
    img = Image.new('RGB', (800, 500), color=bg_color_trajectory)
    draw = ImageDraw.Draw(img)

    draw.text((400, 40), item["name"], fill=text_color, font=font_medium, anchor="mm")

    map_color = (30, 45, 80)
    road_color = (60, 80, 120)
    for i in range(5):
        y = 100 + i * 70
        draw.line([(80, y), (720, y)], fill=road_color, width=3)
    for i in range(7):
        x = 100 + i * 100
        draw.line([(x, 80), (x, 420)], fill=road_color, width=3)

    if item["status"] == "normal":
        line_color = (78, 204, 163)
        points = [
            (120, 380),
            (250, 380),
            (250, 240),
            (450, 240),
            (450, 170),
            (650, 170),
            (650, 100),
            (720, 100),
        ]
    else:
        line_color = (233, 69, 96)
        points = [
            (120, 380),
            (200, 380),
            (200, 300),
            (350, 300),
            (350, 200),
            (280, 200),
            (280, 130),
            (500, 130),
            (500, 200),
            (620, 200),
            (620, 350),
            (720, 350),
        ]

    draw.line(points, fill=line_color, width=4)

    for i, (x, y) in enumerate(points):
        if i == 0:
            draw.ellipse([x-10, y-10, x+10, y+10], fill=(78, 204, 163))
            draw.text((x, y+25), "起点", fill=(78, 204, 163), font=font_small, anchor="mm")
        elif i == len(points) - 1:
            draw.ellipse([x-10, y-10, x+10, y+10], fill=(255, 200, 87))
            draw.text((x, y+25), "终点", fill=(255, 200, 87), font=font_small, anchor="mm")
        else:
            draw.ellipse([x-5, y-5, x+5, y+5], fill=line_color)

    status_text = "正常 NORMAL" if item["status"] == "normal" else "异常 ABNORMAL"
    draw.text((400, 460), status_text, fill=line_color, font=font_small, anchor="mm")

    filename = f'{item["id"]}.png'
    filepath = os.path.join(output_dir_traj, filename)
    img.save(filepath)
    print(f"Created: {filepath}")

print("\nAll assets generated!")
