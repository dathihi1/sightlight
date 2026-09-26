#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate stable keys for existing vsl-seed.json
Adds stableKey field to units, chapters, lessons, and exercises
"""
import json
import sys
import re
from pathlib import Path

# Force UTF-8 on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def slugify(text):
    """Convert text to URL-safe slug"""
    # Remove Vietnamese accents
    text = text.lower()
    text = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', text)
    text = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', text)
    text = re.sub(r'[ìíịỉĩ]', 'i', text)
    text = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', text)
    text = re.sub(r'[ùúụủũưừứựửữ]', 'u', text)
    text = re.sub(r'[ỳýỵỷỹ]', 'y', text)
    text = re.sub(r'[đ]', 'd', text)
    # Replace non-alphanumeric with hyphen
    text = re.sub(r'[^a-z0-9]+', '-', text)
    # Remove leading/trailing hyphens
    text = text.strip('-')
    # Collapse multiple hyphens
    text = re.sub(r'-+', '-', text)
    return text[:80]  # Limit length

def generate_stable_keys(data):
    """Add stable keys to all entities"""
    course_code = data['course']['code'].lower()

    for unit_idx, unit in enumerate(data['units']):
        # Generate unit stable key from title
        unit_slug = slugify(unit['title'])
        unit['stableKey'] = f"{course_code}.{unit_slug}"

        for chapter_idx, chapter in enumerate(unit['chapters']):
            # Generate chapter stable key
            chapter_slug = slugify(chapter['title'])
            chapter['stableKey'] = f"{unit['stableKey']}.{chapter_slug}"

            for lesson_idx, lesson in enumerate(chapter['lessons']):
                # Generate lesson stable key
                lesson_slug = slugify(lesson['title'])
                lesson['stableKey'] = f"{chapter['stableKey']}.{lesson_slug}"

                # Add lesson metadata with defaults
                if 'summary' not in lesson:
                    lesson['summary'] = f"Học các ký hiệu: {lesson['title']}"
                if 'topic' not in lesson:
                    lesson['topic'] = unit['title'].split('—')[0].strip() if '—' in unit['title'] else 'GENERAL'
                if 'targetLevel' not in lesson:
                    lesson['targetLevel'] = 'BEGINNER' if unit_idx == 0 else 'INTERMEDIATE'

                # Generate exercise stable keys
                exercise_type_counts = {}
                for exercise in lesson['exercises']:
                    ex_type = exercise['type']

                    # Count exercise types for numbering
                    if ex_type not in exercise_type_counts:
                        exercise_type_counts[ex_type] = 0
                    exercise_type_counts[ex_type] += 1

                    # Generate stable key
                    type_slug = ex_type.lower().replace('_', '-')
                    ex_num = exercise_type_counts[ex_type]
                    exercise['stableKey'] = f"{type_slug}-{ex_num:02d}"

                    # Add skill and difficulty
                    if 'skill' not in exercise:
                        if ex_type == 'SIGN_TO_MEANING':
                            exercise['skill'] = 'RECOGNITION'
                        elif ex_type == 'MEANING_TO_SIGN':
                            exercise['skill'] = 'DISCRIMINATION'
                        elif ex_type == 'TYPE_WHAT_YOU_SEE':
                            exercise['skill'] = 'RECALL'
                        elif ex_type == 'SENTENCE_ORDER':
                            exercise['skill'] = 'ORDERING'
                        else:
                            exercise['skill'] = 'RECOGNITION'

                    if 'difficulty' not in exercise:
                        # First unit = INTRO/BASIC, later = INTERMEDIATE
                        if unit_idx == 0:
                            exercise['difficulty'] = 'INTRO' if ex_num <= 2 else 'BASIC'
                        else:
                            exercise['difficulty'] = 'INTERMEDIATE'

    return data

def main():
    seed_path = Path('src/backend/src/main/resources/seed/vsl-seed.json')

    print(f"Loading {seed_path}...")
    with open(seed_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Generating stable keys...")
    data = generate_stable_keys(data)

    # Write updated seed
    output_path = Path('src/backend/src/main/resources/seed/vsl-seed-with-keys.json')
    print(f"Writing to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Print sample
    print("\n=== Sample Stable Keys ===")
    if data['units']:
        unit = data['units'][0]
        print(f"Unit: {unit['stableKey']}")
        if unit['chapters']:
            chapter = unit['chapters'][0]
            print(f"  Chapter: {chapter['stableKey']}")
            if chapter['lessons']:
                lesson = chapter['lessons'][0]
                print(f"    Lesson: {lesson['stableKey']}")
                print(f"      Summary: {lesson.get('summary', 'N/A')}")
                print(f"      Topic: {lesson.get('topic', 'N/A')}")
                print(f"      Level: {lesson.get('targetLevel', 'N/A')}")
                if lesson['exercises']:
                    for ex in lesson['exercises'][:3]:
                        print(f"      Exercise: {ex['stableKey']} ({ex['type']}, {ex.get('skill', 'N/A')}, {ex.get('difficulty', 'N/A')})")

    print(f"\n✓ Done! Wrote {output_path}")
    print(f"  Total units: {len(data['units'])}")
    total_lessons = sum(len(ch['lessons']) for u in data['units'] for ch in u['chapters'])
    print(f"  Total lessons: {total_lessons}")

if __name__ == '__main__':
    main()
