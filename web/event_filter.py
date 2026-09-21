"""
Event Filter  (web edition – self-contained)
=============================================
"""

from __future__ import annotations
import re, html, hashlib
from dataclasses import dataclass, field


@dataclass
class CalendarEvent:
    uid: str
    dtstart: str
    dtend: str
    summary: str
    description: str
    location: str
    color: str
    category: str
    module_codes: list[str] = field(default_factory=list)
    group_labels: list[str] = field(default_factory=list)


_MODULE_CODE_RE = re.compile(r"(MIN\d{5}|MYAMI\d+|MSANGS\w+)", re.IGNORECASE)
_GROUP_RE       = re.compile(r"(?:M1\s+Info\s+gr\.|M2\s+AMIS\s+grp)\s*([A-Z0-9]+)", re.IGNORECASE)

# Regex to extract room/location from the description HTML.
# Room lines look like: "AMPHI B - DESCARTES (160 / 85) [Amphithéâtre]"
#                   or:  "G207 - GERMAIN (MASTER) [CARTABLE NUMERIQUE ]"
#                   or:  "103 - BUFFON [CARTABLE NUMERIQUE ]"
# They always contain a dash between room id and building name.
# Module lines like "MIN17212-Simulation [MIN17212]" should NOT match.
_ROOM_RE = re.compile(
    r"<br\s*/?>[\s\r\n]*"
    r"([A-Z0-9][A-Za-z0-9 ]*\s+-\s+[A-Z][A-Za-z0-9 /().,'\-\u2013&;#]+\[.+?\])",
)

# Keywords that indicate an exam / evaluation event (always included)
_EXAM_KEYWORDS = [
    "examen", "partiel", "contrôle", "controle",
    "épreuve", "epreuve", "ct ", "ct\n",
    "ds ", "ds\n", "soutenance", "rattrapage",
    "exam", "evaluation", "évaluation",
    "jury", "résultat", "resultat",
]

COLORS = {
    "CM":      "#27AE60",
    "TD":      "#E91E63",
    "TP":      "#2196F3",
    "EXAM":    "#FF5722",
    "DEFAULT": "#9E9E9E",
}


def _is_exam_event(raw: dict) -> bool:
    """Return True if the event looks like an exam / evaluation."""
    text = (
        (raw.get("title") or "")
        + " " + raw.get("description", "")
        + " " + (raw.get("eventCategory") or "")
    ).lower()
    return any(kw in text for kw in _EXAM_KEYWORDS)


def _extract_module_codes(text: str) -> list[str]:
    return list({m.upper() for m in _MODULE_CODE_RE.findall(text)})

def _extract_group_numbers(text: str) -> list[str]:
    return [group.upper() for group in _GROUP_RE.findall(text)]


def _extract_module_names(raw: dict, text: str) -> dict[str, str]:
    """Return module codes and names, preferring CELCAT's structured field."""
    module_names: dict[str, str] = {}
    for label in raw.get("modules") or []:
        clean = _clean_html(label)
        match = _MODULE_CODE_RE.search(clean)
        if not match:
            continue
        code = match.group(1).upper()
        name = re.sub(rf"^{re.escape(code)}\s*[-–]\s*", "", clean, flags=re.IGNORECASE)
        module_names[code] = name or code
    for code in _extract_module_codes(text):
        module_names.setdefault(code, code)
    return module_names

def _extract_location(desc_raw: str) -> str:
    """Extract the room / location line from CELCAT description HTML."""
    m = _ROOM_RE.search(desc_raw)
    if m:
        loc = _clean_html(m.group(1))
        # Skip if it's actually a module line (contains a module code)
        if _MODULE_CODE_RE.search(loc):
            return ""
        return loc
    return ""


def _clean_html(raw: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", raw, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text).strip()

def _event_category(raw: dict) -> str:
    cat = raw.get("eventCategory", "")
    if cat:
        return cat.strip()
    desc = raw.get("description", "") + " " + (raw.get("title") or "")
    for token in ("CM", "TD Cartable Numérique", "TD", "TP"):
        if token in desc:
            return token.split()[0]
    return "OTHER"

def _build_uid(raw: dict) -> str:
    eid = raw.get("id", "")
    if eid:
        return f"{eid}@celcat.uvsq.fr"
    blob = (raw.get("start", "") + raw.get("description", "")).encode()
    return hashlib.md5(blob).hexdigest() + "@celcat.uvsq.fr"


def filter_events(
    raw_events: list[dict],
    modules: dict,
    include_exams: bool = True,
    include_all: bool = False,
) -> list[CalendarEvent]:
    """
    Filter raw CELCAT events.

    ``modules`` may be empty when ``include_all`` is enabled.

    When *include_exams* is True, events that look like exams / evaluations
    are **always** included regardless of module selection.
    """
    enrolled_codes = {code.upper() for code in modules}
    kept: list[CalendarEvent] = []
    seen: set[str] = set()

    for raw in raw_events:
        desc_raw  = raw.get("description", "")
        title_raw = raw.get("title", "") or ""
        all_text  = f"{title_raw} {desc_raw}"

        is_exam = include_exams and _is_exam_event(raw)

        module_names = _extract_module_names(raw, all_text)
        codes = list(module_names)
        matching_codes = codes if include_all else [c for c in codes if c in enrolled_codes]

        # Keep the event if it matches enrolled modules OR is an exam
        if not include_all and not matching_codes and not is_exam:
            continue

        category = _event_category(raw)
        if is_exam and not category.startswith("Exam"):
            # Override category for exam events
            category_display = category  # keep original for description
            cat_raw = (raw.get("eventCategory") or "").strip()
            if cat_raw:
                category = cat_raw
            # If the category doesn't already say exam, prepend it
            title_lower = (title_raw + " " + cat_raw).lower()
            for kw in _EXAM_KEYWORDS:
                if kw.strip() in title_lower:
                    break

        # Group filtering for TD / TP (but NOT for exams – exams always pass)
        if not include_all and not is_exam and (category.startswith("TD") or category.startswith("TP")):
            group_nums = _extract_group_numbers(all_text)
            if group_nums:
                match = False
                for code in matching_codes:
                    expected = modules.get(code, {}).get("td_group")
                    if expected is not None and str(expected).upper() in group_nums:
                        match = True
                        break
                if not match:
                    continue

        desc_clean     = _clean_html(desc_raw)
        location_clean = _extract_location(desc_raw)
        if not location_clean:
            location_raw = raw.get("location", "") or ""
            location_clean = _clean_html(location_raw)

        # Build summary
        if matching_codes:
            primary_code = matching_codes[0]
            mod_name = modules.get(primary_code, {}).get("name", module_names.get(primary_code, primary_code))
            summary  = f"{category} - {mod_name} - {primary_code}"
        elif include_all or is_exam:
            summary = _clean_html(title_raw) if title_raw else category
        else:
            continue

        color = raw.get("backgroundColor", "")
        if not color:
            if is_exam:
                color = COLORS["EXAM"]
            else:
                color = COLORS.get(category, COLORS["DEFAULT"])

        uid = _build_uid(raw)

        # Description lines
        desc_lines: list[str] = [category]
        if location_clean:
            desc_lines.append(location_clean)
        for code in (matching_codes or codes):
            mname = modules.get(code, {}).get("name", module_names.get(code, code))
            desc_lines.append(f"{code}-{mname} [{code}]")
        groups_raw = raw.get("groups", [])
        if isinstance(groups_raw, list):
            for g in groups_raw:
                if isinstance(g, str):
                    desc_lines.append(_clean_html(g))
        elif isinstance(groups_raw, str):
            desc_lines.append(_clean_html(groups_raw))
        if len(desc_lines) <= 2 + max(len(matching_codes), 1):
            for line in desc_clean.split("\n"):
                if "M1 Info" in line or "M2 AMIS" in line:
                    desc_lines.append(line.strip())
                    break

        ics_description = "\\n".join(desc_lines)

        dedup = f"{raw.get('start','')}|{raw.get('end','')}|{summary}"
        if dedup in seen:
            continue
        seen.add(dedup)

        kept.append(CalendarEvent(
            uid=uid,
            dtstart=raw.get("start", ""),
            dtend=raw.get("end", ""),
            summary=summary,
            description=ics_description,
            location=location_clean,
            color=color,
            category=category,
            module_codes=matching_codes or codes,
            group_labels=[_clean_html(g) for g in (groups_raw if isinstance(groups_raw, list) else [groups_raw]) if isinstance(g, str)],
        ))

    kept.sort(key=lambda e: e.dtstart)
    return kept
