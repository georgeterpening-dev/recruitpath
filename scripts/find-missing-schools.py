#!/usr/bin/env python3
"""
find-missing-schools.py

Carefully compares CSV school names against DB school names using
multiple normalization strategies to avoid false positives.
"""

import re
import json

CSV_PATH = "/home/ubuntu/upload/RecruitPathDatabase-Sheet1.csv"
DB_NAMES_PATH = "/tmp/db-schools-updated.txt"

# ─── Normalization ─────────────────────────────────────────────────────────────

def normalize(name):
    """Aggressive normalization for comparison."""
    n = name.lower().strip()
    # Expand abbreviations
    n = re.sub(r'\bst\.\s*', 'saint ', n)
    n = re.sub(r'\bst\b', 'saint', n)
    n = re.sub(r'\bmt\.\s*', 'mount ', n)
    n = re.sub(r'\bmt\b', 'mount', n)
    n = re.sub(r'\bft\.\s*', 'fort ', n)
    n = re.sub(r'\bft\b', 'fort', n)
    n = re.sub(r'\b&\b', 'and', n)
    # Remove common suffixes that vary
    n = re.sub(r'\buniversity\b', 'univ', n)
    n = re.sub(r'\bcollege\b', 'coll', n)
    # Remove punctuation
    n = re.sub(r'[^a-z0-9 ]', ' ', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

def normalize_strict(name):
    """Strict normalization - just lowercase + strip punctuation."""
    n = name.lower().strip()
    n = re.sub(r'[^a-z0-9 ]', ' ', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

# ─── Load DB names ─────────────────────────────────────────────────────────────
with open(DB_NAMES_PATH) as f:
    db_names = [l.strip() for l in f if l.strip()]

db_norm_map = {}  # normalized -> original
for name in db_names:
    db_norm_map[normalize(name)] = name
    db_norm_map[normalize_strict(name)] = name

# ─── Load CSV schools ──────────────────────────────────────────────────────────
def parse_csv_line(line):
    """Simple CSV parser handling quoted fields."""
    result = []
    current = ""
    in_quotes = False
    for ch in line:
        if ch == '"':
            in_quotes = not in_quotes
        elif ch == ',' and not in_quotes:
            result.append(current)
            current = ""
        else:
            current += ch
    result.append(current)
    return result

csv_schools = {}  # raw name -> list of rows
csv_order = []

with open(CSV_PATH, encoding='utf-8') as f:
    for line in f:
        line = line.rstrip('\n\r')
        if not line.strip():
            continue
        row = parse_csv_line(line)
        raw_name = row[0].strip() if row else ""
        if not raw_name:
            continue
        if raw_name not in csv_schools:
            csv_schools[raw_name] = []
            csv_order.append(raw_name)
        csv_schools[raw_name].append(row)

print(f"CSV unique schools: {len(csv_schools)}")
print(f"DB schools: {len(db_names)}")

# ─── Find missing schools ──────────────────────────────────────────────────────
missing = []
matched = []

for raw_name in csv_order:
    norm = normalize(raw_name)
    norm_strict = normalize_strict(raw_name)
    
    # Check both normalizations
    if norm in db_norm_map or norm_strict in db_norm_map:
        db_match = db_norm_map.get(norm) or db_norm_map.get(norm_strict)
        matched.append((raw_name, db_match))
    else:
        # Try partial matching - check if key words match
        csv_words = set(norm.split())
        best_match = None
        best_score = 0
        for db_norm, db_orig in db_norm_map.items():
            db_words = set(db_norm.split())
            # Remove common words
            common_stop = {'univ', 'coll', 'of', 'the', 'and', 'at', 'in', 'for'}
            csv_sig = csv_words - common_stop
            db_sig = db_words - common_stop
            if not csv_sig:
                continue
            intersection = csv_sig & db_sig
            score = len(intersection) / max(len(csv_sig), len(db_sig))
            if score > best_score:
                best_score = score
                best_match = db_orig
        
        if best_score >= 0.6:
            matched.append((raw_name, f"FUZZY({best_score:.2f}): {best_match}"))
        else:
            missing.append(raw_name)

print(f"\nMatched: {len(matched)}")
print(f"Missing: {len(missing)}")

print(f"\n{'='*60}")
print(f"MISSING SCHOOLS ({len(missing)}):")
print(f"{'='*60}")
for name in missing:
    rows = csv_schools[name]
    head_row = next((r for r in rows if 'head' in (r[7] if len(r) > 7 else '').lower()), rows[0])
    division = head_row[3].strip() if len(head_row) > 3 else ''
    conference = head_row[4].strip() if len(head_row) > 4 else ''
    print(f"  {name!r:60s} | {division} | {conference}")

print(f"\n{'='*60}")
print(f"FUZZY/AMBIGUOUS MATCHES (review these):")
print(f"{'='*60}")
for csv_name, db_name in matched:
    if 'FUZZY' in str(db_name):
        print(f"  CSV: {csv_name!r:50s} → DB: {db_name}")

# ─── Build JSON output for seed script ────────────────────────────────────────
def get_athletics_domain(url):
    if not url:
        return ""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.replace('www.', '')
    except:
        return ""

output = []
for raw_name in missing:
    rows = csv_schools[raw_name]
    head_row = next((r for r in rows if 'head' in (r[7] if len(r) > 7 else '').lower()), rows[0])
    
    # Handle rows that might have shifted columns (quoted commas)
    # Find the email column by looking for @ sign
    email_col = 8
    questionnaire_col = 10
    athletics_col = 14
    
    # Try to find the right columns
    for i, cell in enumerate(head_row):
        if '@' in cell and '.' in cell and i > 5:
            email_col = i
            break
    
    for i, cell in enumerate(head_row):
        if 'armssoftware' in cell or 'questionnaire' in cell or 'jumpforward' in cell:
            questionnaire_col = i
            break
    
    for i, cell in enumerate(head_row):
        if 'http' in cell and i > questionnaire_col:
            athletics_col = i
            break
    
    coach_email = head_row[email_col].strip() if len(head_row) > email_col else ''
    questionnaire_url = head_row[questionnaire_col].strip() if len(head_row) > questionnaire_col else ''
    athletics_url = head_row[athletics_col].strip() if len(head_row) > athletics_col else ''
    
    # Validate URLs
    if not athletics_url.startswith('http'):
        athletics_url = ''
    if not questionnaire_url.startswith('http'):
        questionnaire_url = ''
    
    all_coaches = []
    for r in rows:
        # Find email for this coach
        c_email = ''
        for i, cell in enumerate(r):
            if '@' in cell and '.' in cell and i > 5:
                c_email = cell.strip()
                break
        
        first = r[5].strip() if len(r) > 5 else ''
        last = r[6].strip() if len(r) > 6 else ''
        title = r[7].strip() if len(r) > 7 else ''
        
        # Handle quoted title (e.g., "Recruiting Coordinator, Assistant Coach")
        if title.startswith('"'):
            title = title.strip('"')
        
        if first or last:
            all_coaches.append({
                'firstName': first,
                'lastName': last,
                'title': title,
                'email': c_email,
            })
    
    division_raw = head_row[3].strip() if len(head_row) > 3 else ''
    # Normalize division
    division_map = {
        'NCAA D1': 'D1',
        'NCAA DI': 'D1',
        'NCAA D2': 'D2',
        'NCAA DII': 'D2',
        'NCAA D3': 'D3',
        'NCAA DIII': 'D3',
        'NAIA': 'NAIA',
        'NJCAA': 'CC',
        'CCCAA': 'CC',
        'CC': 'CC',
    }
    division = division_map.get(division_raw, division_raw)
    
    head_coach_name = f"{head_row[5].strip()} {head_row[6].strip()}".strip() if len(head_row) > 6 else ''
    
    output.append({
        'name': raw_name,
        'division': division,
        'conference': head_row[4].strip() if len(head_row) > 4 else '',
        'coachName': head_coach_name,
        'coachEmail': coach_email,
        'coachTitle': head_row[7].strip().strip('"') if len(head_row) > 7 else '',
        'athleticsDomain': get_athletics_domain(athletics_url),
        'athleticsWebsiteUrl': athletics_url,
        'recruitingQuestionnaireUrl': questionnaire_url,
        'coaches': all_coaches,
    })

with open('/home/ubuntu/recruitpath/scripts/missing-schools.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"\nWrote {len(output)} missing schools to scripts/missing-schools.json")
