"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import Link from "next/link";

interface CourseItem {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface LearningPath {
  courseId: string;
  courseName: string;
  units: {
    id: string;
    title: string;
    isFree: boolean;
    chapters: {
      id: string;
      title: string;
      lessons: {
        id: string;
        title: string;
        status: string;
      }[];
    }[];
  }[];
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [pathLoading, setPathLoading] = useState(false);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const loadCoursePath = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setPathLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiCall<LearningPath>(`/api/v1/courses/${courseId}/path`);
      if (res && res.units) {
        setPath(res);
        if (res.units.length > 0) {
          setExpandedUnitId(res.units[0].id);
        }
      } else {
        setPath(null);
      }
    } catch (err: any) {
      console.error("Failed to load course path", err);
      setErrorMessage(
        err?.errorMessage || "Không thể tải cấu trúc lộ trình bài học."
      );
    } finally {
      setPathLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await apiCall<{ items?: CourseItem[]; courses?: CourseItem[] }>("/api/v1/courses");
        const list = res?.items ?? res?.courses ?? [];
        if (!isMounted) return;
        setCourses(list);
        if (list && list.length > 0) {
          const firstId = list[0].id;
          setSelectedCourseId(firstId);
          try {
            const pathRes = await apiCall<LearningPath>(`/api/v1/courses/${firstId}/path`);
            if (isMounted && pathRes && pathRes.units) {
              setPath(pathRes);
              if (pathRes.units.length > 0) {
                setExpandedUnitId(pathRes.units[0].id);
              }
            }
          } catch (pErr: any) {
            console.error("Failed to load initial course path", pErr);
            if (isMounted) setErrorMessage(pErr?.errorMessage || "Không thể tải cấu trúc bài học.");
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch courses", err);
        if (isMounted) setErrorMessage(err?.errorMessage || "Không thể tải danh sách khóa học.");
      } finally {
        if (isMounted) {
          setLoading(false);
          setPathLoading(false);
        }
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-sm text-ink-500 animate-pulse">Đang tải danh mục khóa học & lộ trình...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Quản trị Khóa học & LMS</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Duyệt cây bài học và chọn bài cần thêm bớt, sắp xếp lại trình tự bài tập
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <Link
            href="/dang-nhap?redirect=/admin/courses"
            className="px-3 py-1 bg-danger-600 hover:bg-danger-700 text-white rounded-xl font-bold text-xs transition-colors"
          >
            Đăng nhập lại
          </Link>
        </div>
      )}

      {/* Course Selector Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-ink-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => loadCoursePath(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCourseId === c.id
                  ? "bg-brand-500 text-white"
                  : "bg-white text-ink-600 hover:bg-ink-100 border border-ink-200"
              }`}
            >
              {c.name} ({c.code})
            </button>
          ))}
          {courses.length === 0 && !loading && (
            <span className="text-xs text-ink-500 italic">Không tìm thấy khóa học nào</span>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm tên bài học..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full text-xs px-3 py-2 pl-8 rounded-xl bg-white border border-ink-200 focus:outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <span className="absolute left-2.5 top-2 text-ink-500 text-xs">🔍</span>
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword("")}
              className="absolute right-2.5 top-2 text-ink-500 hover:text-ink-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {pathLoading ? (
        <div className="p-12 text-center text-sm text-ink-500 animate-pulse">
          Đang tải cấu trúc bài học...
        </div>
      ) : !path ? (
        <div className="card p-12 text-center text-ink-500">
          <p className="font-semibold text-ink-700 mb-1">Không tìm thấy dữ liệu lộ trình bài học</p>
          <p className="text-xs text-ink-500 mb-4">
            Vui lòng kiểm tra lại phiên đăng nhập quản trị viên hoặc chọn khóa học phía trên.
          </p>
          <Link
            href="/dang-nhap?redirect=/admin/courses"
            className="btn btn-primary btn-sm"
          >
            Đăng nhập Quản trị viên
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-ink-500 px-1">
            <span>Tổng cộng: <strong>{path.units.length}</strong> Units</span>
            <span className="text-brand-600 font-semibold">Tất cả Unit đang mở cho biên tập</span>
          </div>

          <div className="space-y-3">
            {path.units.map((unit, uIdx) => {
              const kw = searchKeyword.trim().toLowerCase();
              const hasMatchingLesson = !kw || unit.chapters.some(ch =>
                ch.lessons.some(l => l.title.toLowerCase().includes(kw))
              );

              if (!hasMatchingLesson) return null;

              const isExpanded = expandedUnitId === unit.id || Boolean(kw);
              const totalLessons = unit.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

              return (
                <div
                  key={unit.id}
                  className="card overflow-hidden transition-all"
                >
                  {/* Unit Header */}
                  <div
                    onClick={() => setExpandedUnitId(isExpanded && !kw ? null : unit.id)}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-ink-50/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-sky-100 text-brand-500 font-bold text-xs flex items-center justify-center">
                        U{uIdx + 1}
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-ink-900">{unit.title}</h2>
                        <p className="text-xs text-ink-500 mt-0.5">
                          {unit.chapters.length} Chương &bull; {totalLessons} Bài học
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-500 font-semibold">
                        {isExpanded ? "Thu gọn ▲" : "Mở rộng ▼"}
                      </span>
                    </div>
                  </div>

                  {/* Chapters & Lessons */}
                  {isExpanded && (
                    <div className="border-t border-ink-100 bg-ink-50/50 p-4 sm:p-5 space-y-4">
                      {unit.chapters.map((chap, cIdx) => {
                        const filteredLessons = kw
                          ? chap.lessons.filter(l => l.title.toLowerCase().includes(kw))
                          : chap.lessons;

                        if (kw && filteredLessons.length === 0) return null;

                        return (
                          <div key={chap.id} className="bg-white rounded-xl border border-ink-200 p-4">
                            <h3 className="text-xs font-bold text-ink-800 mb-3 flex items-center gap-2">
                              <span className="text-brand-500">§{cIdx + 1}</span> {chap.title}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {filteredLessons.map((lesson, lIdx) => (
                                <div
                                  key={lesson.id}
                                  className="p-3.5 rounded-xl border border-ink-200 bg-white hover:border-brand-500 transition-all flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-xs font-bold text-ink-500 uppercase">
                                        Bài {lIdx + 1}
                                      </span>
                                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-800">
                                        {lesson.status}
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-ink-900 line-clamp-1">{lesson.title}</p>
                                  </div>

                                  <div className="mt-3 pt-2.5 border-t border-ink-100 flex items-center justify-between">
                                    <Link
                                      href={`/admin/lessons/${lesson.id}`}
                                      className="btn btn-primary btn-sm w-full text-center"
                                    >
                                      Chỉnh sửa bài học &rarr;
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
