"""Inline CSS, JS and fonts into one self-contained HTML file.

Usage: python3 tools/build.py
Output: dist/token-intelligence-layer-deck.html
"""

import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "dist" / "token-intelligence-layer-deck.html"


def inline_fonts(css: str) -> str:
    def repl(m: re.Match) -> str:
        data = base64.b64encode((SRC / m.group(1)).read_bytes()).decode()
        return f'url("data:font/ttf;base64,{data}")'

    return re.sub(r'url\("(fonts/[^"]+)"\)', repl, css)


def main() -> None:
    html = (SRC / "index.html").read_text(encoding="utf-8")
    css = inline_fonts((SRC / "styles.css").read_text(encoding="utf-8"))
    js = (SRC / "deck.js").read_text(encoding="utf-8")

    html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}\n</style>")
    html = html.replace('<script src="deck.js"></script>', f"<script>\n{js}\n</script>")
    assert "styles.css" not in html and "deck.js" not in html

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
