package com.renewal.service;

import com.renewal.dto.ReviewGenerateRequest;
import com.renewal.dto.ReviewMaterialDTO;

import java.util.List;

public interface ReviewService {

    ReviewMaterialDTO generateReview(ReviewGenerateRequest request);

    ReviewMaterialDTO getReview(Long id);

    List<ReviewMaterialDTO> listReviews(String status);

    ReviewMaterialDTO publishReview(Long id);
}
