import { MilestoneItem, LearnerStats } from "../types";

export function getInitialMilestones(stats: LearnerStats): MilestoneItem[] {
  return [
    {
      id: "m-1",
      titleVi: "Khởi đầu hành trình VSL",
      titleEn: "Starting the VSL Journey",
      descriptionVi: "Làm quen với văn hoá giao tiếp của người Điếc và cấu trúc không gian ký hiệu ba chiều.",
      descriptionEn: "Introduction to Deaf communication culture and 3D spatial sign structure.",
      status: stats.completedLessons >= 1 ? "COMPLETED" : "IN_PROGRESS",
      highlightVi: "Đã hoàn thành",
      highlightEn: "Achieved",
    },
    {
      id: "m-2",
      titleVi: "Thành thạo Bảng chữ cái ngón tay",
      titleEn: "Mastering Fingerspelling Alphabet",
      descriptionVi: "Thuần thục 29 chữ cái ngón tay và quy tắc đánh vần tên riêng, địa danh Việt Nam.",
      descriptionEn: "Mastered all 29 Vietnamese fingerspelling letters and proper noun spelling conventions.",
      status: stats.completedLessons >= 2 ? "COMPLETED" : "IN_PROGRESS",
      highlightVi: "Đã hoàn thành",
      highlightEn: "Achieved",
    },
    {
      id: "m-3",
      titleVi: "Chinh phục AI Camera tương tác",
      titleEn: "Conquering Real-time AI Camera",
      descriptionVi: "Thực hành động tác trước Camera với mô hình nhận diện khung xương bàn tay tức thì.",
      descriptionEn: "Practicing dynamic gestures with on-device hand landmark and pose estimation.",
      status: stats.completedLessons >= 3 ? "COMPLETED" : "IN_PROGRESS",
      highlightVi: `${stats.averageScore}% Chuẩn xác`,
      highlightEn: `${stats.averageScore}% Accurate`,
    },
    {
      id: "m-4",
      titleVi: "Giao tiếp Đời sống & Gia đình",
      titleEn: "Daily Life & Family Communication",
      descriptionVi: "Nắm vững 50 cụm từ chào hỏi, biểu đạt cảm xúc và đối thoại thông dụng.",
      descriptionEn: "Mastering 50 common greeting phrases, emotions, and practical dialogue patterns.",
      status: stats.completedLessons >= 12 ? "COMPLETED" : "IN_PROGRESS",
      highlightVi: "Đang chinh phục",
      highlightEn: "In Progress",
    },
    {
      id: "m-5",
      titleVi: "Đại sứ Kết nối Cộng đồng",
      titleEn: "Community Inclusion Ambassador",
      descriptionVi: "Lan toả thông điệp học ngôn ngữ ký hiệu tới 100 người bạn và đồng nghiệp.",
      descriptionEn: "Sharing the sign language learning message with 100 friends and colleagues.",
      status: "UPCOMING",
      highlightVi: "Mục tiêu tiếp theo",
      highlightEn: "Next Goal",
    },
  ];
}
