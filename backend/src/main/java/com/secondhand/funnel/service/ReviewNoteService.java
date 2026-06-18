package com.secondhand.funnel.service;

import com.secondhand.funnel.entity.ReviewNote;

import java.util.List;

public interface ReviewNoteService {
    ReviewNote create(ReviewNote note);
    ReviewNote getById(Long id);
    List<ReviewNote> getByCarId(Long carId);
    List<ReviewNote> getByCarIdAndStage(Long carId, String stage);
    List<ReviewNote> getByCreatedBy(Long createdBy);
    ReviewNote update(Long id, ReviewNote note);
    void delete(Long id);
    List<ReviewNote> listAll();
}
