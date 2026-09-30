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
    return <div className="p-12 text-center text-sm text-slate-500 animate-pulse">Đang tải danh mục khóa học & lộ trình...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản trị Khóa học & LMS</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Duyệt cây bài học và chọn bài cần thêm bớt, sắp xếp lại trình tự bài tập
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <Link
            href="/dang-nhap?redirect=/admin/courses"
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-colors"
          >
            Đăng nhập lại
          </Link>
        </div>
      )}

      {/* Course Selector Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => loadCoursePath(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCourseId === c.id
                  ? "bg-[#0d9fa5] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {c.name} ({c.code})
            </button>
          ))}
          {courses.length === 0 && !loading && (
            <span className="text-xs text-slate-400 italic">Không tìm thấy khóa học nào</span>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm tên bài học..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full text-xs px-3 py-2 pl-8 rounded-xl bg-white border border-slate-200 focus:outline-hidden focus:border-[#0d9fa5] focus:ring-1 focus:ring-[#0d9fa5]"
          />
          <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword("")}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {pathLoading ? (
        <div className="p-12 text-center text-sm text-slate-400 animate-pulse">
          Đang tải cấu trúc bài học...
        </div>
      ) : !path ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">Không tìm thấy dữ liệu lộ trình bài học</p>
          <p className="text-xs text-slate-400 mb-4">
            Vui lòng kiểm tra lại phiên đăng nhập quản trị viên hoặc chọn khóa học phía trên.
          </p>
          <Link
            href="/dang-nhap?redirect=/admin/courses"
            className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0d9fa5] hover:bg-[#0b8287] transition-colors"
          >
            Đăng nhập Quản trị viên
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Tổng cộng: <strong>{path.units.length}</strong> Units</span>
            <span className="text-emerald-600 font-semibold">Tất cả Unit đang mở cho biên tập</span>
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
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  {/* Unit Header */}
                  <div
                    onClick={() => setExpandedUnitId(isExpanded && !kw ? null : unit.id)}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-cyan-100 text-[#0d9fa5] font-black text-xs flex items-center justify-center">
                        U{uIdx + 1}
                      </span>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">{unit.title}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {unit.chapters.length} Chương &bull; {totalLessons} Bài học
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-medium">
                        {isExpanded ? "Thu gọn ▲" : "Mở rộng ▼"}
                      </span>
                    </div>
                  </div>

                  {/* Chapters & Lessons */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-[#FAF8F5]/50 p-4 sm:p-5 space-y-4">
                      {unit.chapters.map((chap, cIdx) => {
                        const filteredLessons = kw
                          ? chap.lessons.filter(l => l.title.toLowerCase().includes(kw))
                          : chap.lessons;

                        if (kw && filteredLessons.length === 0) return null;

                        return (
                          <div key={chap.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <span className="text-[#0d9fa5]">§{cIdx + 1}</span> {chap.title}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {filteredLessons.map((lesson, lIdx) => (
                                <div
                                  key={lesson.id}
                                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#0d9fa5] hover:shadow-xs transition-all flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        Bài {lIdx + 1}
                                      </span>
                                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                        {lesson.status}
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{lesson.title}</p>
                                  </div>

                                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                    <Link
                                      href={`/admin/lessons/${lesson.id}`}
                                      className="w-full text-center px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0d9fa5] hover:bg-[#08757a] transition-colors shadow-2xs"
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
