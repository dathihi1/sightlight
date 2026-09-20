package vn.duy.signlight.content.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Khoá học của một ngôn ngữ ký hiệu. GĐ1 chỉ có VSL (Q4). */
@Entity
@Table(name = "course")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    private UUID id;

    @Column(nullable = false, length = 16)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 16)
    private String status;

    /** Bảng chữ cái của khoá — dùng validate chữ cái ở phần đánh vần (FR-18). */
    @Column(name = "alphabet_letters", nullable = false, length = 64)
    private String alphabetLetters;

    /** SEED-5: bản ghi giả lập; GATE-6 chặn phát hành nếu còn bản ghi mang cờ này. */
    @Column(name = "is_seed", nullable = false)
    private boolean seed;
}
