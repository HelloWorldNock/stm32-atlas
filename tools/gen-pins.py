#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从江协教程附带的《STM32F103C8T6引脚定义.xlsx》生成 app/ui/data/pins.js。

只依赖标准库（zipfile + xml.etree），因为 xlsx 本质是个 zip。
运行：python tools/gen-pins.py
"""
import json
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = r"<采集源>\参考文档\STM32F103C8T6引脚定义.xlsx"
OUT = os.path.join(ROOT, "app", "ui", "data", "pins.js")

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# 复用功能里出现的名字 -> 本站的外设 id（PERIPHERALS 里的 id）
PERIPH_RULES = [
    (re.compile(r"^ADC12?_IN\d+$"), "adc"),
    (re.compile(r"^TIM\d+_"), "tim"),
    (re.compile(r"^USART\d+_"), "usart"),
    (re.compile(r"^SPI\d+_"), "spi"),
    (re.compile(r"^I2C\d+_"), "i2c"),
    (re.compile(r"^CAN_"), None),
    (re.compile(r"^USB"), None),
    (re.compile(r"^(JTMS|JTCK|JTDI|JTDO|NJTRST|SWDIO|SWCLK|TRACESWO)$"), "gpio"),
    (re.compile(r"^WKUP$"), "exti"),
    (re.compile(r"^TAMPER"), "rtc"),
    (re.compile(r"^OSC32?_"), "rcc"),
    (re.compile(r"^MCO$"), "rcc"),
]


def read_sheet(path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall(NS + "si"):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))
    sheet = sorted(n for n in z.namelist() if n.startswith("xl/worksheets/sheet"))[0]
    root = ET.fromstring(z.read(sheet))
    rows = []
    for row in root.iter(NS + "row"):
        cells = {}
        for c in row.findall(NS + "c"):
            ref = c.get("r") or ""
            col = re.match(r"([A-Z]+)", ref).group(1)
            v = c.find(NS + "v")
            val = v.text if v is not None else ""
            if c.get("t") == "s" and val != "":
                val = shared[int(val)]
            else:
                inner = c.find(NS + "is")
                if inner is not None:
                    val = "".join(t.text or "" for t in inner.iter(NS + "t"))
            cells[col] = (val or "").strip()
        rows.append(cells)
    return rows


def periphs_of(tokens):
    out = []
    for token in tokens:
        for rx, pid in PERIPH_RULES:
            if rx.match(token):
                if pid and pid not in out:
                    out.append(pid)
                break
    return out


def classify(name, gpio):
    if name.startswith("VSS") or name.startswith("VDD") or name == "VBAT":
        return "power"
    if name == "NRST":
        return "reset"
    if name == "BOOT0":
        return "boot"
    if name.startswith("OSC"):
        return "osc"
    if re.match(r"^P[A-C]\d+", gpio or name):
        return "io"
    return "other"


def main():
    rows = read_sheet(SRC)
    pins = []
    for cells in rows[2:]:  # 跳过两行表头
        no = cells.get("A", "")
        if not re.match(r"^\d+$", no):
            continue
        name = cells.get("B", "").replace("  ", " ").strip()
        typ = cells.get("C", "").strip()
        level = cells.get("D", "").strip()
        gpio = cells.get("E", "").strip()
        alt = cells.get("F", "").strip()
        remap = cells.get("G", "").strip()
        alt_list = [t for t in alt.split("/") if t]
        remap_list = [t for t in remap.split("/") if t]
        port = ""
        bit = None
        deffn = gpio
        # xlsx 的“复用功能”列有时直接写功能名（PA13 写的是 JTMS/SWDIO），
        # 这时端口名要从“引脚名称”列里取，功能名并入 altList。
        m = re.match(r"^(P[ABC])(\d+)$", gpio or "")
        if not m:
            m = re.match(r"^(P[ABC])(\d+)", name)
            for token in gpio.split("/"):
                if token and token != (m.group(1) + m.group(2) if m else None) and token not in alt_list:
                    alt_list.insert(0, token)
        if m:
            port, bit = m.group(1)[1], int(m.group(2))
            deffn = m.group(1) + m.group(2)
        pins.append({
            "no": int(no),
            "name": name,
            "type": typ,
            "level": level,
            "gpio": deffn if port else "",
            "alt": alt,
            "remap": remap,
            "altList": alt_list,
            "remapList": remap_list,
            "port": port,
            "bit": bit,
            "kind": classify(name, deffn if port else ""),
            "periphs": periphs_of(alt_list + remap_list),
        })
    pins.sort(key=lambda p: p["no"])
    assert len(pins) == 48, "期望 48 个引脚，实际 %d" % len(pins)

    header = (
        "// 生成文件，请勿手工编辑：python tools/gen-pins.py\n"
        "// 数据来源：江协《STM32 入门教程》参考文档 —— STM32F103C8T6引脚定义.xlsx\n"
        "// kind: power | reset | boot | osc | io | other；periphs 取自复用/重定义功能里的外设名\n"
        "// altList / remapList 按“/”拆开；port + bit 仅 GPIO 引脚有\n\n"
    )
    body = "export const PINS = " + json.dumps(pins, ensure_ascii=False, indent=1) + ";\n\n"
    body += "export const PIN_MAP = Object.fromEntries(PINS.map(p => [p.name, p]));\n\n"
    body += "export const PIN_BY_GPIO = Object.fromEntries(PINS.filter(p => p.gpio).map(p => [p.gpio, p]));\n\n"
    body += ("export const PIN_SOURCE = {\n"
             "  file: \"STM32F103C8T6引脚定义.xlsx\",\n"
             "  from: \"江协《STM32 入门教程》参考文档\",\n"
             "  rows: PINS.length\n"
             "};\n")
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(header + body)
    print("wrote %s (%d pins)" % (OUT, len(pins)))
    kinds = {}
    for p in pins:
        kinds[p["kind"]] = kinds.get(p["kind"], 0) + 1
    print("kinds:", kinds)
    print("gpio pins:", sum(1 for p in pins if p["gpio"]))


if __name__ == "__main__":
    sys.exit(main())
