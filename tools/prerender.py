"""Bake the programme cards, dates and Google event data into site/index.html.

Run after any change to CONFIG in site/app.js:
    python3 tools/prerender.py

Why: the cards are drawn by app.js when the page loads. Search engines don't
always run that code, so this writes the same markup straight into the HTML,
plus structured data so Google can list the camps as events. It also writes
robots.txt and sitemap.xml.

When the domain changes, update SITE_URL here (and the canonical/og tags in
index.html), then run it again.
"""
import functools
import http.server
import json
import re
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

SITE_URL = "https://envolleyball.netlify.app"
ROOT = Path(__file__).resolve().parent.parent / "site"
INDEX = ROOT / "index.html"


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *a: None
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def money(price):
    m = re.fullmatch(r"£([\d,]+)(?:\.\d+)?", (price or "").strip())
    return m.group(1).replace(",", "") if m else None


def jsonld(config):
    org = {
        "@type": "SportsOrganization",
        "@id": SITE_URL + "/#org",
        "name": "England North Volleyball",
        "url": SITE_URL + "/",
        "logo": SITE_URL + "/img/logo-white.png",
        "email": config["email"],
        "sport": "Volleyball",
        "areaServed": "England",
        "sameAs": ["https://www.instagram.com/engnorthvolleyball/"],
    }
    graph = [org]
    for p in config["programmes"]:
        if not p.get("sortDate") or not p.get("endDate"):
            continue  # no confirmed dates, so not an event yet
        ev = {
            "@type": "SportsEvent",
            "name": f"{p['title']} {p['sortDate'][:4]}",
            "description": p.get("blurb", ""),
            "startDate": p["sortDate"],
            "endDate": p["endDate"],
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "sport": "Volleyball",
            "image": SITE_URL + "/" + (p.get("img") or "img/hero.jpg"),
            "url": f"{SITE_URL}/#programmes",
            "organizer": {"@id": SITE_URL + "/#org"},
        }
        if p.get("where"):
            ev["location"] = {"@type": "Place", "name": p["where"], "address": p["where"]}
        amount = money(p.get("price"))
        if amount:
            ev["offers"] = {
                "@type": "Offer",
                "price": amount,
                "priceCurrency": "GBP",
                "availability": "https://schema.org/InStock",
                "url": f"{SITE_URL}/#register",
            }
        graph.append(ev)
    data = {"@context": "https://schema.org", "@graph": graph}
    body = json.dumps(data, ensure_ascii=False, indent=1).replace("</", "<\\/")
    return f'<script type="application/ld+json">\n{body}\n</script>'


def put(html, key, content):
    pat = re.compile(rf"(<!--pre:{key}-->).*?(<!--/pre:{key}-->)", re.S)
    if not pat.search(html):
        raise SystemExit(f"marker pre:{key} missing from index.html")
    return pat.sub(lambda m: m.group(1) + content + m.group(2), html)


def main():
    html = INDEX.read_text()
    # clear old baked content first so app.js renders from scratch
    for key in ("alert", "cards", "date-list", "select", "jsonld"):
        html = put(html, key, "")
    INDEX.write_text(html)

    httpd = serve()
    url = f"http://127.0.0.1:{httpd.server_address[1]}/index.html"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path="/usr/bin/google-chrome")
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url)
        page.wait_for_selector("#cards > *")
        parts = {
            "alert": page.inner_html("#alert"),
            "cards": page.inner_html("#cards"),
            "date-list": page.inner_html("#date-list"),
            "select": page.inner_html("#programme-select"),
        }
        config = page.evaluate("CONFIG")
        browser.close()
    httpd.shutdown()
    if errors:
        raise SystemExit("page errors: " + "; ".join(errors))

    strip = lambda s: re.sub(r"<!--/?pre:[\w-]+-->", "", s)
    for key, content in parts.items():
        html = put(html, key, strip(content))
    html = put(html, "jsonld", jsonld(config))
    INDEX.write_text(html)

    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    pages = ["/", "/privacy.html"]
    urls = "".join(f"  <url><loc>{SITE_URL}{p}</loc></url>\n" for p in pages)
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n"
    )
    print("prerendered:", ", ".join(f"{k} {len(v)}b" for k, v in parts.items()),
          "| events:", html.count('"SportsEvent"'))


if __name__ == "__main__":
    main()
