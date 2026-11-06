"""生成安卓启动图标（各密度 PNG + 自适应图标前景）。

用法：python tools/gen-android-icon.py
输出：android/app/res/mipmap-*/ic_launcher.png、ic_launcher_fg.png
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
RES = os.path.join(ROOT, "android", "app", "res")
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
SS = 8  # 超采样倍数

BG = (11, 17, 32, 255)      # #0B1120 与 --bg 一致
FG = (34, 197, 94, 255)     # #22C55E 与 --accent 一致


def draw(px, with_bg):
    n = px * SS
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def X(v):
        return v * n

    if with_bg:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=X(0.22), fill=BG)

    # 芯片本体（描边）
    d.rounded_rectangle(
        [X(0.30), X(0.30), X(0.70), X(0.70)],
        radius=X(0.06), outline=FG, width=max(1, int(X(0.036))),
    )
    # 内核
    d.rounded_rectangle(
        [X(0.435), X(0.435), X(0.565), X(0.565)],
        radius=X(0.022), fill=FG,
    )
    # 12 根引脚
    w = max(1, int(X(0.028)))
    for t in (0.40, 0.50, 0.60):
        d.line([X(0.235), X(t), X(0.30), X(t)], fill=FG, width=w)
        d.line([X(0.70), X(t), X(0.765), X(t)], fill=FG, width=w)
        d.line([X(t), X(0.235), X(t), X(0.30)], fill=FG, width=w)
        d.line([X(t), X(0.70), X(t), X(0.765)], fill=FG, width=w)

    return img.resize((px, px), Image.LANCZOS)


def main():
    for density, px in SIZES.items():
        out = os.path.join(RES, "mipmap-" + density)
        os.makedirs(out, exist_ok=True)
        draw(px, True).save(os.path.join(out, "ic_launcher.png"))
        # 自适应图标前景要留出安全区：108dp 画布，内容居中
        draw(px, False).save(os.path.join(out, "ic_launcher_fg.png"))
        print("wrote", out)


if __name__ == "__main__":
    main()
