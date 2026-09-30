import { SharePresetTemplate, LearnerStats } from "../types";

export function getSharePresets(stats: LearnerStats, learnerName: string): SharePresetTemplate[] {
  return [
    {
      id: "empathy",
      tagVi: "Thấu cảm",
      tagEn: "Empathy",
      titleVi: "Lan toả sự thấu cảm",
      titleEn: "Spreading Empathy",
      descriptionVi: "Thông điệp về sự gắn kết yêu thương với cộng đồng người Điếc",
      descriptionEn: "Inspiring message about connecting with the Deaf community",
      templateVi: `"Mỗi ký hiệu VSL được học là một nhịp cầu gắn kết yêu thương với cộng đồng Người Điếc Việt Nam. ${learnerName} đang học Ngôn ngữ Ký hiệu trên SignLight và đã làm chủ ${stats.signsMastered} ký hiệu với độ chính xác AI ${stats.averageScore}%. Hãy cùng mình kết nối trái tim nhé!"`,
      templateEn: `"Every VSL sign learned is a bridge of empathy connecting us with the Vietnamese Deaf community. ${learnerName} is learning Sign Language on SignLight and has mastered ${stats.signsMastered} signs with ${stats.averageScore}% AI accuracy. Join me in connecting hearts!"`,
    },
    {
      id: "milestone",
      tagVi: "Cột mốc",
      tagEn: "Milestone",
      titleVi: "Kỷ niệm chặng đường",
      titleEn: "Milestone Celebration",
      descriptionVi: "Tự hào chia sẻ thành tích và chuỗi ngày kiên trì rèn luyện",
      descriptionEn: "Share achievement and learning persistence with pride",
      templateVi: `"Tự hào hoàn thành ${stats.completedLessons}/${stats.totalLessons} bài học VSL trên SignLight! Nhờ công nghệ AI chấm dáng tay tức thì qua camera, mình đã đạt chuỗi ${stats.streakDays} ngày kiên trì. Bắt đầu học Ngôn ngữ Ký hiệu miễn phí ngay hôm nay!"`,
      templateEn: `"Proud to have completed ${stats.completedLessons}/${stats.totalLessons} VSL lessons on SignLight! Thanks to real-time AI camera feedback, I achieved a ${stats.streakDays}-day streak. Start learning VSL for free today!"`,
    },
    {
      id: "invite",
      tagVi: "Rủ bạn bè",
      tagEn: "Invite",
      titleVi: "Rủ bạn bè cùng học",
      titleEn: "Invite Friends to Learn",
      descriptionVi: "Kêu gọi cộng đồng tham gia xoá nhoà rào cản giao tiếp",
      descriptionEn: "Invite friends to bridge communication barriers together",
      templateVi: `"Học Ngôn ngữ Ký hiệu Việt Nam (VSL) cùng AI trực quan và thú vị hơn rất nhiều! Luyện cử chỉ trước camera, nhận phản hồi chuẩn xác tức thì. Cùng ${learnerName} tham gia SignLight để xoá nhoà rào cản giao tiếp nhé!"`,
      templateEn: `"Learning Vietnamese Sign Language with AI is intuitive and accessible! Practice gestures in front of the camera with real-time accuracy. Join ${learnerName} on SignLight to bridge communication boundaries!"`,
    },
    {
      id: "declaration",
      tagVi: "Tuyên ngôn",
      tagEn: "Manifesto",
      titleVi: "Tuyên ngôn vì bình đẳng",
      titleEn: "Equality Manifesto",
      descriptionVi: "Cam kết học tập vì một xã hội không khoảng cách cho mọi người",
      descriptionEn: "Pledge to learn for an inclusive society without barriers",
      templateVi: `"Giao tiếp là quyền bình đẳng của tất cả mọi người. Mình đã tích luỹ được chuỗi ${stats.streakDays} ngày học VSL và tự tin sử dụng ${stats.signsMastered} ký hiệu đời sống. Một hành động nhỏ hôm nay - một tương lai bình đẳng mai sau!"`,
      templateEn: `"Communication is an equal right for everyone. I have built a ${stats.streakDays}-day streak learning VSL and can use ${stats.signsMastered} everyday signs. A small step today creates an inclusive future tomorrow!"`,
    },
  ];
}
