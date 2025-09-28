package com.miaai.language_helper.model;

import com.miaai.language_helper.dto.ExerciseDto;
import com.miaai.language_helper.util.ExerciseDtoConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.DynamicUpdate;  // ← Ключ: Только dirty поля в UPDATE
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "exercises")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamicUpdate  // ← Обновляет только изменённые поля (is_public + updated_at)
public class ExerciseTableRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uuid", unique = true, nullable = false)
    private UUID uuid;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "exercise_data", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = ExerciseDtoConverter.class)
    private ExerciseDto exercise;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "created_text")
    private String createdText;

    @Column(name = "questions_count")
    private Integer questionsCount;

    @Column(name = "is_public", nullable = false, columnDefinition = "boolean default false")
    private boolean isPublic = false;  // ← Primitive! (не Boolean) — всегда dirty на изменение

    @Column(name = "is_completed", nullable = false, columnDefinition = "boolean default false")
    private boolean isCompleted = false;  // ← Аналогично primitive

    @Column(name = "metadata", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    public String getUuidAsString() {
        return uuid != null ? uuid.toString() : null;
    }

    // ← Явный setter: Триггерит dirty (обновляет updatedAt вручную)
    public void setIsPublic(boolean isPublic) {
        this.isPublic = isPublic;
        this.updatedAt = LocalDateTime.now();
    }

    // ← @PrePersist / @PreUpdate: Авто-обновление времени
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();  // ← Дублирует setter, но ок
    }

    // fromDto остаётся без изменений
    public static ExerciseTableRecord fromDto(ExerciseDto exercise, User user) {
        return ExerciseTableRecord.builder()
                .uuid(UUID.randomUUID())
                .user(user)
                .exercise(exercise)
                .type(exercise.getExerciseType())
                .createdText(exercise.getCreatedText())
                .questionsCount(exercise.getQuestions() != null ? exercise.getQuestions().size() : 0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isPublic(false)
                .isCompleted(false)
                .metadata(exercise.getMetadata())
                .build();
    }
}
