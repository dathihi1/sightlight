#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analyze vsl-seed.json structure"""
import json
import sys
from collections import Counter

# Force UTF-8 output
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('src/backend/src/main/resources/seed/vsl-seed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=== VSL SEED ANALYSIS ===\n")

# Basic counts
print(f"Seed Version: {data.get('seedVersion')}")
print(f"Course: {data.get('course', {}).get('name')}")
print(f"Course Code: {data.get('course', {}).get('code')}\n")

print(f"Total Signs: {len(data.get('signs', []))}")
print(f"Total Units: {len(data.get('units', []))}")

# Count chapters, lessons, exercises
total_chapters = 0
total_lessons = 0
total_exercises = 0
exercise_types = Counter()
lesson_types = Counter()
free_units = 0

for unit in data.get('units', []):
    if unit.get('free'):
        free_units += 1
    for chapter in unit.get('chapters', []):
        total_chapters += 1
        for lesson in chapter.get('lessons', []):
            total_lessons += 1
            lesson_type = lesson.get('type', 'PRACTICE')
            lesson_types[lesson_type] += 1
            for exercise in lesson.get('exercises', []):
                total_exercises += 1
                exercise_types[exercise['type']] += 1

print(f"Total Chapters: {total_chapters}")
print(f"Total Lessons: {total_lessons}")
print(f"Total Exercises: {total_exercises}")
print(f"Free Units: {free_units}\n")

print("=== Exercise Types ===")
for ex_type, count in exercise_types.most_common():
    print(f"  {ex_type}: {count}")

print("\n=== Lesson Types ===")
for les_type, count in lesson_types.most_common():
    print(f"  {les_type}: {count}")

# Check for lessons without exercises
lessons_without_exercises = 0
for unit in data.get('units', []):
    for chapter in unit.get('chapters', []):
        for lesson in chapter.get('lessons', []):
            if not lesson.get('exercises'):
                lessons_without_exercises += 1
                print(f"\nLesson without exercises: {lesson.get('title')}")

print(f"\n=== Data Quality ===")
print(f"Lessons without exercises: {lessons_without_exercises}")

# Check signs without video
signs_without_video = sum(1 for sign in data.get('signs', []) if not sign.get('video'))
print(f"Signs without video: {signs_without_video}")

# Sample lesson structure
if data.get('units') and data['units'][0].get('chapters'):
    first_lesson = data['units'][0]['chapters'][0].get('lessons', [{}])[0]
    print("\n=== Sample Lesson Structure ===")
    print(f"Title: {first_lesson.get('title')}")
    print(f"Estimated Minutes: {first_lesson.get('estimatedMinutes')}")
    print(f"Type: {first_lesson.get('type', 'PRACTICE')}")
    print(f"Number of exercises: {len(first_lesson.get('exercises', []))}")
    if first_lesson.get('exercises'):
        first_ex = first_lesson['exercises'][0]
        print(f"\nFirst exercise:")
        print(f"  Type: {first_ex.get('type')}")
        print(f"  Sign: {first_ex.get('sign')}")
        print(f"  Has options: {bool(first_ex.get('options'))}")
        print(f"  Has answer: {bool(first_ex.get('answer'))}")

print("\n=== DONE ===")
