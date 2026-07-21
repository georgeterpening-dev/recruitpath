#!/usr/bin/env python3
"""
Find duplicate schools in the RecruitPath database.
Uses fuzzy matching to identify schools listed under different name formats.
"""
import json
import re
from difflib import SequenceMatcher

with open('/home/ubuntu/recruitpath/scripts/all-schools-db.json') as f:
    schools = json.load(f)

print(f"Total schools in DB: {len(schools)}")

def normalize(name):
    """Normalize school name for comparison."""
    n = name.lower().strip()
    # Remove "the" prefix
    n = re.sub(r'^the\s+', '', n)
    # Standardize separators
    n = n.replace(' - ', ' ').replace('-', ' ')
    # Expand abbreviations
    n = re.sub(r'\buc\b', 'university of california', n)
    n = re.sub(r'\bucla\b', 'university of california los angeles', n)
    n = re.sub(r'\busc\b', 'university of southern california', n)
    n = re.sub(r'\bbyu\b', 'brigham young university', n)
    n = re.sub(r'\bnyu\b', 'new york university', n)
    n = re.sub(r'\bcal state\b', 'california state', n)
    n = re.sub(r'\bcal poly\b', 'california polytechnic', n)
    n = re.sub(r'\bst\.\b', 'saint', n)
    n = re.sub(r'\bst\b', 'saint', n)
    n = n.replace('&', 'and')
    # Normalize hawaii/hawai'i
    n = n.replace("hawai'i", 'hawaii')
    # Remove punctuation
    n = re.sub(r"[^a-z0-9 ]", '', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

def similarity(a, b):
    na, nb = normalize(a), normalize(b)
    return SequenceMatcher(None, na, nb).ratio()

school_list = [(s['id'], s['name']) for s in schools]

print("\n=== FUZZY DUPLICATE DETECTION (similarity > 0.72) ===\n")

duplicates = []
checked = set()

for i, (id1, name1) in enumerate(school_list):
    for j, (id2, name2) in enumerate(school_list):
        if i >= j:
            continue
        pair_key = (min(id1, id2), max(id1, id2))
        if pair_key in checked:
            continue
        checked.add(pair_key)
        
        sim = similarity(name1, name2)
        if sim > 0.72:
            duplicates.append({
                'id1': id1, 'name1': name1,
                'id2': id2, 'name2': name2,
                'similarity': round(sim, 3),
                'norm1': normalize(name1),
                'norm2': normalize(name2),
            })

# Sort by similarity descending
duplicates.sort(key=lambda x: -x['similarity'])

for d in duplicates:
    print(f"  [{d['similarity']:.3f}] \"{d['name1']}\" (id={d['id1']})")
    print(f"           <-> \"{d['name2']}\" (id={d['id2']})")
    print(f"           norm1: {d['norm1']}")
    print(f"           norm2: {d['norm2']}")
    print()

print(f"Total potential duplicate pairs: {len(duplicates)}")

with open('/home/ubuntu/recruitpath/scripts/duplicate-schools.json', 'w') as f:
    json.dump(duplicates, f, indent=2)
print("Saved to scripts/duplicate-schools.json")
