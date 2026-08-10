#!/usr/bin/env python3
"""Extract both .xlsx into docs/data/tft-sheets.json as a live model.

Every cell keeps whatever it actually holds, a formula stays a formula,
a literal stays a literal, plus the styling that makes the sheet
readable. The browser renders the grid and evaluates the formulas, so
the workbook can be edited and recalculated rather than just looked at.

    python3 tools/render_sheets.py
"""

import json
import pathlib

import openpyxl
from openpyxl.utils import get_column_letter

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = ROOT / "docs" / "files"
OUT = ROOT / "docs" / "data" / "tft-sheets.json"

WORKBOOKS = [
    ("16 Traits", "tft-set-16-traits.xlsx"),
    ("Damage model", "tft-damage-calculator.xlsx"),
]


def argb(colour):
    if colour is None:
        return None
    rgb = getattr(colour, "rgb", None)
    if not isinstance(rgb, str) or len(rgb) != 8 or rgb[:2] == "00":
        return None
    return "#" + rgb[2:]


def style_of(cell):
    s = {}
    if cell.fill is not None and cell.fill.patternType:
        bg = argb(cell.fill.fgColor)
        if bg and bg.lower() != "#ffffff":
            s["bg"] = bg
    if cell.font is not None:
        fg = argb(cell.font.color)
        if fg and fg.lower() != "#000000":
            s["fg"] = fg
        if cell.font.bold:
            s["b"] = 1
    align = getattr(cell.alignment, "horizontal", None)
    if align in ("center", "right", "left"):
        s["a"] = align
    fmt = cell.number_format or ""
    if "%" in fmt:
        s["p"] = 1                      # render as a percentage
    return s


def sheet_model(ws, styles, index):
    merges = []
    covered = set()
    for rng in ws.merged_cells.ranges:
        merges.append([rng.min_row, rng.min_col,
                       rng.max_row - rng.min_row + 1,
                       rng.max_col - rng.min_col + 1])
        for r in range(rng.min_row, rng.max_row + 1):
            for c in range(rng.min_col, rng.max_col + 1):
                if (r, c) != (rng.min_row, rng.min_col):
                    covered.add((r, c))

    cells = {}
    max_row = max_col = 0
    for row in ws.iter_rows():
        for cell in row:
            st = style_of(cell)
            has_value = cell.value not in (None, "")
            if not has_value and not st:
                continue
            max_row = max(max_row, cell.row)
            max_col = max(max_col, cell.column)
            rec = {}
            v = cell.value
            # Array formulas arrive as an object rather than a string.
            text = getattr(v, "text", None)
            if isinstance(text, str):
                v = text
            if isinstance(v, str) and v.startswith("="):
                rec["f"] = v[1:]
            elif has_value:
                rec["v"] = v if isinstance(v, (int, float, str, bool)) else str(v)
            if st:
                key = json.dumps(st, sort_keys=True)
                if key not in index:
                    index[key] = len(styles)
                    styles.append(st)
                rec["s"] = index[key]
            if rec:
                cells[f"{cell.row},{cell.column}"] = rec

    if not max_row:
        return None

    cols = []
    for c in range(1, max_col + 1):
        dim = ws.column_dimensions.get(get_column_letter(c))
        w = getattr(dim, "width", None) if dim else None
        cols.append(round((w or 9) * 7.2 + 6))

    return {
        "name": ws.title,
        "rows": max_row,
        "cols": max_col,
        "widths": cols,
        "merges": merges,
        "covered": [f"{r},{c}" for r, c in sorted(covered)],
        "cells": cells,
    }


def main():
    styles, index = [], {}
    books = []
    for label, fname in WORKBOOKS:
        wb = openpyxl.load_workbook(FILES / fname, data_only=False)
        sheets = []
        for ws in wb.worksheets:
            m = sheet_model(ws, styles, index)
            if m:
                sheets.append(m)
                formulas = sum(1 for c in m["cells"].values() if "f" in c)
                print(f"  {label} / {ws.title}: {len(m['cells'])} cells, {formulas} formulas")
        books.append({"label": label, "file": fname, "sheets": sheets})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"books": books, "styles": styles},
                              ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB, {len(styles)} styles)")


if __name__ == "__main__":
    main()
