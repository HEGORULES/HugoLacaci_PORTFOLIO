#!/usr/bin/env python3
"""Render the .xlsx sheets to HTML that looks like the workbook.

Fill colours, font colours, bold, merged cells, column widths, borders
and number formats are read from the file, so what the site shows is
the spreadsheet itself rather than a retyped version of its numbers.

    python3 tools/render_sheets.py
"""

import html
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
    """openpyxl hands back an RGB string, a theme index, or an error repr."""
    if colour is None:
        return None
    rgb = getattr(colour, "rgb", None)
    if not isinstance(rgb, str) or len(rgb) != 8:
        return None
    if rgb[:2] == "00":
        return None
    return "#" + rgb[2:]


def cell_text(cell, fmt):
    v = cell.value
    if v is None:
        return ""
    if isinstance(v, str):
        return v
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        if "%" in (fmt or ""):
            pct = v * 100
            return (f"{pct:.0f}" if abs(pct % 1) < 0.005 else f"{pct:.1f}") + "%"
        if isinstance(v, float):
            if abs(v % 1) < 1e-9:
                return str(int(v))
            return f"{v:.2f}".rstrip("0").rstrip(".")
        return str(v)
    return str(v)


def render(ws, ws_formulas):
    # Which cells are swallowed by a merge, and what each anchor spans.
    covered, spans = set(), {}
    for rng in ws.merged_cells.ranges:
        anchor = (rng.min_row, rng.min_col)
        spans[anchor] = (rng.max_row - rng.min_row + 1, rng.max_col - rng.min_col + 1)
        for r in range(rng.min_row, rng.max_row + 1):
            for c in range(rng.min_col, rng.max_col + 1):
                if (r, c) != anchor:
                    covered.add((r, c))

    max_row, max_col = 0, 0
    for row in ws.iter_rows():
        for cell in row:
            if cell.value not in (None, "") or argb(cell.fill.fgColor if cell.fill else None):
                max_row = max(max_row, cell.row)
                max_col = max(max_col, cell.column)
    if not max_row:
        return ""

    cols = []
    for c in range(1, max_col + 1):
        dim = ws.column_dimensions.get(get_column_letter(c))
        width = getattr(dim, "width", None) if dim else None
        cols.append(f'<col style="width:{round((width or 9) * 7.2 + 6)}px">')

    out = [f'<table class="xl"><colgroup>{"".join(cols)}</colgroup><tbody>']
    for r in range(1, max_row + 1):
        out.append("<tr>")
        for c in range(1, max_col + 1):
            if (r, c) in covered:
                continue
            cell = ws.cell(row=r, column=c)
            fmt = cell.number_format
            text = cell_text(cell, fmt)

            styles = []
            fill = argb(cell.fill.fgColor) if cell.fill and cell.fill.patternType else None
            if fill and fill.lower() not in ("#ffffff",):
                styles.append(f"background:{fill}")
            fcol = argb(cell.font.color) if cell.font else None
            if fcol and fcol.lower() not in ("#000000",):
                styles.append(f"color:{fcol}")
            if cell.font and cell.font.bold:
                styles.append("font-weight:700")
            align = getattr(cell.alignment, "horizontal", None)
            if align in ("center", "right", "left"):
                styles.append(f"text-align:{align}")
            elif isinstance(cell.value, (int, float)) and not isinstance(cell.value, bool):
                styles.append("text-align:right")

            attrs = ""
            if (r, c) in spans:
                rs, cs = spans[(r, c)]
                if rs > 1:
                    attrs += f' rowspan="{rs}"'
                if cs > 1:
                    attrs += f' colspan="{cs}"'
            if styles:
                attrs += f' style="{";".join(styles)}"'

            # Show the underlying formula on hover, so the model stays visible.
            f = ws_formulas.cell(row=r, column=c).value
            if isinstance(f, str) and f.startswith("="):
                attrs += f' title="{html.escape(f, quote=True)}"'
                attrs += ' class="xl-f"'

            out.append(f"<td{attrs}>{html.escape(text)}</td>")
        out.append("</tr>")
    out.append("</tbody></table>")
    return "".join(out)


def main():
    books = []
    for label, fname in WORKBOOKS:
        wb_v = openpyxl.load_workbook(FILES / fname, data_only=True)
        wb_f = openpyxl.load_workbook(FILES / fname, data_only=False)
        sheets = []
        for ws in wb_v.worksheets:
            markup = render(ws, wb_f[ws.title])
            if markup:
                sheets.append({"name": ws.title, "html": markup})
                print(f"  {label} / {ws.title}: {len(markup) // 1024} KB")
        books.append({"label": label, "file": fname, "sheets": sheets})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(books, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
