#!/usr/bin/env python3
"""
build_static.py - يولّد ملف data.js مباشرة من exams.db عشان الموقع يشتغل Static على GitHub Pages من غير سيرفر.
"""
import json
import sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB_PATH = HERE / "exams.db"
OUT_PATH = HERE / "data.js"


def main():
    con = sqlite3.connect(DB_PATH)
    used_exam_ids = {r[0] for r in con.execute("SELECT DISTINCT exam_id FROM enrollments")}

    exams = {}
    for eid, code, title, date, start, end in con.execute(
        "SELECT id, course_code, course_title, exam_date, start_time, end_time FROM exams"
    ):
        if eid in used_exam_ids:
            exams[str(eid)] = {"c": code, "t": title, "d": date, "s": start, "e": end}

    students = {sid: [] for (sid,) in con.execute("SELECT student_id FROM students")}
    for sid, eid, room, seat in con.execute("""
        SELECT n.student_id, n.exam_id, n.room, n.seat
        FROM enrollments n
        JOIN exams e ON e.id = n.exam_id
        ORDER BY n.student_id, e.exam_date, e.start_time, e.course_code
    """):
        students[sid].append([eid, room, seat])

    con.close()
    payload = {"exams": exams, "students": students}
    OUT_PATH.write_text(
        "window.EXAM_DATA = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Done: {OUT_PATH.name} ({OUT_PATH.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
