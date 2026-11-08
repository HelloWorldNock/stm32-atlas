#!/usr/bin/env python3
"""扫描 `模块资料/` 生成前端索引 `app/ui/data/materials.js`。

资料本身不打包进 exe：页面只认这份元数据，桌面壳再按相对路径打开真实文件。
模块的中英文名称/摘要/标签/关联在下面的 MODULES 里手工维护，其余（文件数、
体积、目录树）由脚本扫描得到。

用法：
    python tools/gen-materials.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "模块资料"
OUT = ROOT / "app" / "ui" / "data" / "materials.js"

# 扩展名 → 类别，决定图标、排序与详情页的分组
KINDS: list[tuple[str, set[str]]] = [
    ("pdf", {".pdf"}),
    ("img", {".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp", ".svg"}),
    ("doc", {".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md", ".rtf", ".csv"}),
    ("pcb", {".schdoc", ".schlib", ".pcbdoc", ".pcblib", ".prjpcb", ".intlib", ".ddb", ".sch", ".brd"}),
    ("prog", {".c", ".h", ".s", ".asm", ".inc", ".uvproj", ".uvprojx", ".uvopt", ".uvoptx",
              ".hex", ".bin", ".axf", ".elf", ".sct", ".ld", ".mk", ".a", ".lib", ".ioc"}),
    ("tool", {".exe", ".msi", ".bat", ".cmd", ".jar"}),
    ("pack", {".zip", ".rar", ".7z", ".tar", ".gz", ".tgz"}),
]
EXT_KIND = {ext: kind for kind, exts in KINDS for ext in exts}
KIND_ORDER = {kind: i for i, (kind, _) in enumerate(KINDS)}
KIND_ORDER["other"] = len(KINDS)

MAX_CHILDREN = 80      # 单层最多列出多少条，其余只报数量
EXPAND_TO = 2          # 从模块往下展开两层（模块 → 资源 → 资源里的条目）
SKIP_NAMES = {"thumbs.db", "desktop.ini", ".ds_store"}


# ---------------------------------------------------------------- 编辑区
# id 进路由（#/materials/<id>），code 显示在卡片角标，p/cases/workflows/kb 关联现有条目。
MODULES: dict[str, dict] = {
    "1-STM32F103C8T6核心板": {
        "id": "core",
        "code": "CORE",
        "icon": "chip",
        "p": "gpio",
        "name": ("STM32F103C8T6 核心板", "STM32F103C8T6 core board"),
        "summary": (
            "最小系统板的完整资料：原理图、板卡尺寸图、F103x8B 数据手册，PC13 闪烁与 RTC 两套测试工程，"
            "外加 40 多个网络收集的参考例程（CAN、FATFS、FreeRTOS、USB、uCOS 等）。",
            "Everything for the minimal system board: schematic, board dimensions, the F103x8B datasheet, "
            "blink and RTC test projects, plus 40+ reference examples (CAN, FATFS, FreeRTOS, USB, uCOS…).",
        ),
        "tags": ["核心板", "最小系统", "原理图", "PCB", "数据手册", "测试工程", "参考例程"],
        "cases": ["led-blink", "rtc-clock", "chip-id"],
        "workflows": ["wf.clock-init", "wf.gpio-output", "wf.rtc"],
        "kb": ["f103c8t6", "pin-map"],
    },
    "2-STLINK下载器": {
        "id": "stlink",
        "code": "STLINK",
        "icon": "drive",
        "p": None,
        "name": ("ST-LINK V2 下载器", "ST-LINK V2 programmer"),
        "summary": (
            "ST-LINK V2 的使用说明，含接线、驱动安装与下载配置。",
            "ST-LINK V2 manual covering wiring, driver install and download settings.",
        ),
        "tags": ["下载器", "ST-LINK", "SWD", "调试"],
        "cases": [],
        "workflows": [],
        "kb": [],
    },
    "3-有源蜂鸣器": {
        "id": "buzzer",
        "code": "BUZZER",
        "icon": "pulse",
        "p": "gpio",
        "name": ("有源蜂鸣器模块", "Active buzzer module"),
        "summary": (
            "有源蜂鸣器模块的原理图与实物图：S8550 三极管开关，控制端低电平导通、高电平停止，"
            "自带振荡源所以不需要 PWM 频率。",
            "Schematic and photo of the active buzzer module: an S8550 switch turns it on at a low level. "
            "It oscillates internally, so no drive frequency is needed.",
        ),
        "tags": ["蜂鸣器", "有源", "发声", "开关量"],
        "cases": ["buzzer"],
        "workflows": ["wf.gpio-output"],
        "kb": [],
    },
    "4-光敏电阻传感器": {
        "id": "ldr",
        "code": "LDR",
        "icon": "spark",
        "p": "adc",
        "name": ("光敏电阻传感器模块", "Photoresistor sensor module"),
        "summary": (
            "光敏电阻模块的 3 线制与 4 线制两种版本：使用说明图、原理图、尺寸图、参考例程与 51 测试程序。",
            "Photoresistor module in both 3-wire and 4-wire versions: usage notes, schematic, dimensions, "
            "sample code and an 8051 test project.",
        ),
        "tags": ["光敏电阻", "光照", "模拟量", "3线制", "4线制", "51例程"],
        "cases": ["light-buzzer"],
        "workflows": ["wf.adc-poll"],
        "kb": ["adc-basics"],
    },
    "5-热敏电阻传感器": {
        "id": "ntc",
        "code": "NTC",
        "icon": "pulse",
        "p": "adc",
        "name": ("热敏电阻传感器模块", "Thermistor sensor module"),
        "summary": (
            "热敏电阻模块的使用说明、原理图与测试程序，测试程序里还带了串口调试软件。",
            "Thermistor module: usage notes, schematic and test projects, with a serial terminal bundled in.",
        ),
        "tags": ["热敏电阻", "温度", "模拟量", "NTC", "51例程"],
        "cases": [],
        "workflows": ["wf.adc-poll"],
        "kb": ["adc-basics"],
    },
    "6-反射式红外传感器": {
        "id": "ir-reflect",
        "code": "TCRT5000",
        "icon": "target",
        "p": "gpio",
        "name": ("反射式红外传感器模块", "Reflective IR sensor module"),
        "summary": (
            "TCRT5000 反射式（寻迹）传感器：器件手册、模块说明书、电路图与 51 测试程序。",
            "TCRT5000 reflective (line-tracking) sensor: device datasheet, module manual, circuit diagram "
            "and an 8051 test project.",
        ),
        "tags": ["红外", "反射式", "寻迹", "TCRT5000", "开关量"],
        "cases": [],
        "workflows": ["wf.gpio-input"],
        "kb": [],
    },
    "7-对射式红外传感器": {
        "id": "ir-slot",
        "code": "ITR9606",
        "icon": "arrows",
        "p": "gpio",
        "name": ("对射式红外传感器模块", "Slotted IR (interrupter) module"),
        "summary": (
            "对射式红外测速模块，宽槽与窄槽两种版本各含说明书、电路图和 51 测试程序，另附 ITR9606 手册。",
            "Slotted IR speed module in wide-slot and narrow-slot versions, each with manual, circuit "
            "diagram and 8051 test project, plus the ITR9606 datasheet.",
        ),
        "tags": ["红外", "对射式", "测速", "ITR9606", "宽槽", "窄槽"],
        "cases": [],
        "workflows": ["wf.gpio-input", "wf.exti-button"],
        "kb": [],
    },
    "8-OLED显示屏": {
        "id": "oled",
        "code": "OLED",
        "icon": "grid",
        "p": "i2c",
        "name": ("0.96 寸 OLED 显示屏", "0.96″ OLED display"),
        "summary": (
            "0.96 寸 OLED 全套资料：规格书与驱动芯片手册、4/6/7 针结构图与 I²C、SPI 接口原理图、"
            "C51 / STM32 / Arduino 等 19 个测试工程、反白显示资料和取字模工具。",
            "Full 0.96″ OLED kit: specs and driver-IC datasheet, 4/6/7-pin layouts and I²C/SPI schematics, "
            "19 test projects (C51, STM32, Arduino…), inverse-display notes and a font-extraction tool.",
        ),
        "tags": ["OLED", "显示屏", "I2C", "SPI", "取字模", "例程"],
        "cases": [],
        "workflows": [],
        "kb": [],
    },
    "9-TB6612电机驱动": {
        "id": "tb6612",
        "code": "TB6612",
        "icon": "zap",
        "p": "tim",
        "name": ("TB6612 电机驱动模块", "TB6612 motor driver module"),
        "summary": (
            "TB6612FNG 双路电机驱动：数据手册与模块使用说明，配合 PWM 与方向引脚控制两路直流电机。",
            "TB6612FNG dual motor driver: datasheet and module notes; two DC motors driven by PWM "
            "plus direction pins.",
        ),
        "tags": ["电机驱动", "TB6612", "PWM", "正反转", "双路"],
        "cases": [],
        "workflows": ["wf.tim-pwm"],
        "kb": [],
    },
    "10-SG90舵机": {
        "id": "sg90",
        "code": "SG90",
        "icon": "gauge",
        "p": "tim",
        "name": ("SG90 9G 舵机", "SG90 9G servo"),
        "summary": (
            "SG90 9G 舵机资料：模块使用说明，以及两篇讲舵机原理与 PWM 控制的文档。",
            "SG90 9G servo: module notes plus two documents on servo principles and PWM control.",
        ),
        "tags": ["舵机", "SG90", "PWM", "角度控制"],
        "cases": ["servo"],
        "workflows": ["wf.tim-pwm"],
        "kb": ["timer-pwm"],
    },
    "11-旋转编码器": {
        "id": "encoder",
        "code": "ENC",
        "icon": "shuffle",
        "p": "gpio",
        "name": ("旋转编码器模块", "Rotary encoder module"),
        "summary": (
            "旋转编码器模块的使用说明图。",
            "A single usage diagram for the rotary encoder module.",
        ),
        "tags": ["旋转编码器", "正交编码", "A/B相", "人机输入"],
        "cases": ["encoder"],
        "workflows": ["wf.gpio-input", "wf.exti-button"],
        "kb": [],
    },
    "12-CH340 USB转串口": {
        "id": "ch340",
        "code": "CH340",
        "icon": "terminal",
        "p": "usart",
        "name": ("CH340 USB 转串口模块", "CH340 USB-to-serial module"),
        "summary": (
            "CH340G USB 转串口模块：原理图、V4.0 说明文档与 CH341SER 驱动安装包。",
            "CH340G USB-to-serial module: schematic, V4.0 notes and the CH341SER driver package.",
        ),
        "tags": ["USB转串口", "CH340", "CH341SER", "驱动", "串口"],
        "cases": ["uart-echo"],
        "workflows": ["wf.usart-poll", "wf.usart-irq"],
        "kb": ["usart-frame"],
    },
    "13-MPU6050 陀螺仪加速度计": {
        "id": "mpu6050",
        "code": "MPU6050",
        "icon": "activity",
        "p": "i2c",
        "name": ("MPU6050 陀螺仪加速度计", "MPU6050 gyro & accelerometer"),
        "summary": (
            "MPU6050 六轴模块：MPU-6000/6050 产品规格书与寄存器手册、模块原理图与实物图，51 与 Arduino 测试程序。",
            "MPU6050 six-axis module: MPU-6000/6050 product spec and register map, schematic and photo, "
            "8051 and Arduino test projects.",
        ),
        "tags": ["MPU6050", "陀螺仪", "加速度计", "I2C", "姿态"],
        "cases": [],
        "workflows": [],
        "kb": [],
    },
    "14-W25QXX Flash闪存": {
        "id": "w25qxx",
        "code": "W25QXX",
        "icon": "drive",
        "p": "spi",
        "name": ("W25QXX SPI Flash", "W25QXX SPI flash"),
        "summary": (
            "W25Q 系列 SPI Flash：原理图与尺寸图，W25Q16 到 W25Q256 各容量的数据手册，"
            "以及示例 hex 与测试工程压缩包。",
            "W25Q SPI flash family: schematic and package drawing, datasheets from W25Q16 to W25Q256, "
            "sample hex files and test project archives.",
        ),
        "tags": ["Flash", "W25Q", "SPI", "存储", "数据手册"],
        "cases": ["spi-flash"],
        "workflows": ["wf.spi-flash", "wf.flash-param"],
        "kb": [],
    },
}


# ---------------------------------------------------------------- 扫描
def kind_of(name: str) -> str:
    return EXT_KIND.get(Path(name).suffix.lower(), "other")


def is_skipped(name: str) -> bool:
    low = name.lower()
    return low in SKIP_NAMES or name.startswith("~$") or name.startswith(".")


def walk(path: Path):
    """统计子树里的文件数、体积与类别分布（跳过临时文件）。"""
    files = size = 0
    kinds: dict[str, int] = {}
    stack = [path]
    while stack:
        cur = stack.pop()
        try:
            entries = list(cur.iterdir())
        except OSError:
            continue
        for entry in entries:
            if is_skipped(entry.name):
                continue
            try:
                if entry.is_dir():
                    stack.append(entry)
                elif entry.is_file():
                    kind = kind_of(entry.name)
                    files += 1
                    size += entry.stat().st_size
                    kinds[kind] = kinds.get(kind, 0) + 1
            except OSError:
                continue
    return files, size, kinds


def file_node(path: Path, rel: str) -> dict:
    try:
        size = path.stat().st_size
    except OSError:
        size = 0
    return {"name": path.name, "path": rel, "size": size, "kind": kind_of(path.name)}


def dir_node(path: Path, rel: str, depth: int) -> dict:
    files, size, kinds = walk(path)
    node = {"name": path.name, "path": rel, "dir": True, "files": files, "size": size, "kinds": kinds}
    if depth >= EXPAND_TO:
        return node

    entries = sorted(path.iterdir(), key=lambda p: p.name.lower())
    dirs = [e for e in entries if e.is_dir() and not is_skipped(e.name)]
    plain = [e for e in entries if e.is_file() and not is_skipped(e.name)]
    plain.sort(key=lambda e: (KIND_ORDER[kind_of(e.name)], e.name.lower()))
    dirs.sort(key=lambda e: e.name.lower())

    kids = [file_node(e, f"{rel}/{e.name}") for e in plain]
    kids += [dir_node(e, f"{rel}/{e.name}", depth + 1) for e in dirs]
    node["children"] = kids[:MAX_CHILDREN]
    if len(kids) > MAX_CHILDREN:
        node["more"] = len(kids) - MAX_CHILDREN
    return node


def module_no(dirname: str) -> int:
    match = re.match(r"^(\d+)", dirname)
    return int(match.group(1)) if match else 999


def build() -> tuple[list[dict], list[str]]:
    problems: list[str] = []
    if not SRC.is_dir():
        raise SystemExit(f"找不到资料目录：{SRC}")

    dirs = sorted((d for d in SRC.iterdir() if d.is_dir() and not is_skipped(d.name)),
                  key=lambda d: module_no(d.name))
    out: list[dict] = []
    seen: set[str] = set()

    for directory in dirs:
        meta = MODULES.get(directory.name)
        if meta is None:
            problems.append(f"未在 MODULES 里登记：{directory.name}")
            meta = {
                "id": re.sub(r"[^a-z0-9]+", "-", str(module_no(directory.name))).strip("-") or "module",
                "code": str(module_no(directory.name)),
                "icon": "folder",
                "p": None,
                "name": (directory.name, directory.name),
                "summary": ("资料目录。", "Reference folder."),
                "tags": [],
                "cases": [],
                "workflows": [],
                "kb": [],
            }
        if meta["id"] in seen:
            problems.append(f"id 重复：{meta['id']}（{directory.name}）")
            meta = {**meta, "id": f"{meta['id']}-{module_no(directory.name)}"}
        seen.add(meta["id"])

        files, size, kinds = walk(directory)
        resources = [
            dir_node(e, f"{directory.name}/{e.name}", 1)
            if e.is_dir()
            else file_node(e, f"{directory.name}/{e.name}")
            for e in sorted(directory.iterdir(), key=lambda p: (p.is_file() is False, p.name.lower()))
            if not is_skipped(e.name)
        ]
        resources.sort(key=lambda r: (KIND_ORDER.get(r.get("kind", ""), -1) if not r.get("dir") else 50))

        out.append({
            "id": meta["id"],
            "no": module_no(directory.name),
            "dir": directory.name,
            "code": meta["code"],
            "icon": meta["icon"],
            "p": meta["p"],
            "name": {"zh": meta["name"][0], "en": meta["name"][1]},
            "summary": {"zh": meta["summary"][0], "en": meta["summary"][1]},
            "tags": meta["tags"],
            "cases": meta["cases"],
            "workflows": meta["workflows"],
            "kb": meta["kb"],
            "files": files,
            "size": size,
            "kinds": kinds,
            "resources": resources,
        })

    known = {d.name for d in dirs}
    for name in MODULES:
        if name not in known:
            problems.append(f"MODULES 里的目录不存在：{name}")
    return out, problems


# ---------------------------------------------------------------- 输出
def dump(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=1)


def main() -> int:
    modules, problems = build()
    stats = {
        "modules": len(modules),
        "files": sum(m["files"] for m in modules),
        "size": sum(m["size"] for m in modules),
    }

    body = ",\n".join(dump(m) for m in modules)
    text = (
        "/* 由 tools/gen-materials.py 生成，请勿手改。\n"
        "   资料本体不进包：这里只有目录元数据，桌面壳按 path 打开真实文件。*/\n\n"
        f"export const MATERIAL_MODULES = [\n{body}\n];\n\n"
        "export const MATERIAL_MAP = Object.fromEntries(MATERIAL_MODULES.map(m => [m.id, m]));\n\n"
        f"export const MATERIAL_STATS = {dump(stats)};\n"
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8", newline="\n")

    rel = OUT.relative_to(ROOT)
    mib = stats["size"] / 1048576
    print(f"{rel}: {stats['modules']} 个模块 / {stats['files']} 个文件 / {mib:.1f} MB")
    for problem in problems:
        print(f"  ! {problem}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
