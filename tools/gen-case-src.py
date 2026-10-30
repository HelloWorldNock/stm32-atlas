#!/usr/bin/env python3
"""生成 app/ui/data/case-src.js —— 江协教程工程的源码快照。

教程源码是 GBK 编码，这里统一转成 UTF-8 的 JS 模块，供案例页的
「源码」面板展示。生成物是纯数据，不需要在运行期读文件。

用法：
    python tools/gen-case-src.py <STM32Project-有注释版 目录>   # 生成
    python tools/gen-case-src.py --dump                        # 打印案例 main.c（调试用）
教程源码不入库，目录用位置参数或环境变量 STM32_CASE_SRC 指定。
"""

import json
import os
import pathlib
import sys

ROOT = pathlib.Path(
    os.environ.get("STM32_CASE_SRC", "")
    if (len(sys.argv) > 1 and sys.argv[1].startswith("--")) or len(sys.argv) <= 1
    else sys.argv[1]
)
if str(ROOT) in ("", "."):
    sys.exit("用法：python tools/gen-case-src.py <STM32Project-有注释版 目录>（或设置 STM32_CASE_SRC）")
OUT = pathlib.Path(__file__).resolve().parent.parent / "app" / "ui" / "data" / "case-src.js"

# 案例 id → (教程工程目录, 需要展示的文件)
CASES = {
    "led-blink": ("3-1 LED闪烁", ["User/main.c"]),
    "led-flow": ("3-2 LED流水灯", ["User/main.c"]),
    "buzzer": ("3-3 蜂鸣器", ["User/main.c"]),
    "key-led": (
        "3-4 按键控制LED",
        ["User/main.c", "Hardware/LED.c", "Hardware/LED.h", "Hardware/Key.c", "Hardware/Key.h"],
    ),
    "light-buzzer": (
        "3-5 光敏传感器控制蜂鸣器",
        ["User/main.c", "Hardware/LightSensor.c", "Hardware/Buzzer.c", "Hardware/Buzzer.h"],
    ),
    "encoder": (
        "5-2 旋转编码器计次",
        ["User/main.c", "Hardware/Encoder.c", "Hardware/Encoder.h", "Hardware/OLED.c"],
    ),
    "timer-int": (
        "6-1 定时器定时中断",
        ["User/main.c", "User/stm32f10x_it.c", "Hardware/OLED.c"],
    ),
    "pwm-breath": (
        "6-3 PWM驱动LED呼吸灯",
        ["User/main.c", "Hardware/PWM.c", "Hardware/PWM.h", "Hardware/OLED.c"],
    ),
    "servo": (
        "6-4 PWM驱动舵机",
        [
            "User/main.c",
            "Hardware/PWM.c",
            "Hardware/PWM.h",
            "Hardware/Servo.c",
            "Hardware/Servo.h",
            "Hardware/Key.c",
            "Hardware/Key.h",
            "Hardware/OLED.c",
        ],
    ),
    "adc-pot": (
        "7-1 AD单通道",
        ["User/main.c", "Hardware/AD.c", "Hardware/AD.h", "Hardware/OLED.c"],
    ),
    "uart-echo": (
        "9-2 串口发送+接收",
        ["User/main.c", "Hardware/Serial.c", "Hardware/Serial.h", "User/stm32f10x_it.c", "Hardware/OLED.c"],
    ),
    "spi-flash": (
        "11-1 软件SPI读写W25Q64",
        [
            "User/main.c",
            "Hardware/MySPI.c",
            "Hardware/MySPI.h",
            "Hardware/W25Q64.c",
            "Hardware/W25Q64.h",
            "Hardware/OLED.c",
        ],
    ),
    "rtc-clock": ("12-2 实时时钟", ["User/main.c", "Hardware/OLED.c"]),
    "chip-id": ("15-2 读取芯片ID", ["User/main.c", "Hardware/OLED.c"]),
}


def read(path: pathlib.Path) -> str:
    raw = path.read_bytes()
    for enc in ("utf-8", "gbk"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = raw.decode("utf-8", errors="replace")
    if text.startswith("\ufeff"):
        text = text[1:]
    return text.replace("\r\n", "\n").replace("\r", "\n")


def main() -> int:
    if "--dump" in sys.argv:
        wanted = [a for a in sys.argv[1:] if not a.startswith("-")]
        chunks = []
        for case_id, (folder, files) in CASES.items():
            if wanted and case_id not in wanted:
                continue
            path = ROOT / folder / "User" / "main.c"
            chunks.append(f"\n===== {case_id}  ({folder}) =====\n" + read(path))
        text = "".join(chunks)
        if "--out" in sys.argv:
            dest = pathlib.Path(sys.argv[sys.argv.index("--out") + 1])
            dest.write_text(text, encoding="utf-8")
            print(f"写出 {dest}")
        else:
            print(text)
        return 0

    sources = {}
    missing = []
    for case_id, (folder, files) in CASES.items():
        for rel in files:
            path = ROOT / folder / pathlib.Path(*rel.split("/"))
            if not path.exists():
                missing.append(f"{folder}/{rel}")
                continue
            sources[f"{folder}/{rel}"] = read(path)

    if missing:
        print("[warn] 缺失文件：")
        for m in missing:
            print("  -", m)

    body = json.dumps(sources, ensure_ascii=False, indent=0)
    # JSON 每行一个 key，但值里有换行；这里让输出仍然是合法 JS 对象字面量
    js = (
        "/* 由 tools/gen-case-src.py 生成，请勿手改。\n"
        "   江协教程工程源码快照（GBK → UTF-8），键为「工程目录/相对路径」。 */\n"
        f"export const SOURCES = {body};\n\n"
        "export function caseSources(folder, files) {\n"
        "  return (files || [])\n"
        "    .map(rel => ({ path: rel, text: SOURCES[folder + \"/\" + rel] }))\n"
        "    .filter(f => typeof f.text === \"string\");\n"
        "}\n"
    )
    OUT.write_text(js, encoding="utf-8")
    total = sum(len(v) for v in sources.values())
    print(f"写出 {OUT.relative_to(OUT.parents[3])}：{len(sources)} 个文件，{total} 字符")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
