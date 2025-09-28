package com.miaai.language_helper.repository;

import com.miaai.language_helper.model.ExerciseTableRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExerciseRepository extends JpaRepository<ExerciseTableRecord, Long> {
    Optional<ExerciseTableRecord> findByUuidAndUserId(UUID uuid, Long userId);  // Старый, если нужен
    Optional<ExerciseTableRecord> findByUuid(UUID uuid);
    List<ExerciseTableRecord> findByUser_Email(String email);
    List<ExerciseTableRecord> findByUser_Id(Long userId);
    Optional<ExerciseTableRecord> findByUuidAndIsPublic(UUID uuid, boolean isPublic);

    @Query("SELECT e FROM ExerciseTableRecord e WHERE e.uuid = :uuid AND e.user.email = :email")
    Optional<ExerciseTableRecord> findByUuidAndUser_Email(@Param("uuid") UUID uuid, @Param("email") String email);
}
