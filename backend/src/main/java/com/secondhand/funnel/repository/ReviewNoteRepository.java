package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.ReviewNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewNoteRepository extends JpaRepository<ReviewNote, Long> {
    List<ReviewNote> findByCarIdOrderByCreatedAtDesc(Long carId);
    List<ReviewNote> findByCreatedBy(Long createdBy);
    List<ReviewNote> findByCarIdAndStage(Long carId, String stage);
}
