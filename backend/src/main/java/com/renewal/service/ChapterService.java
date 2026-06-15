package com.renewal.service;

import com.renewal.dto.ChapterProgressDTO;

import java.util.List;

public interface ChapterService {

    List<ChapterProgressDTO> getAllChapterProgress();

    ChapterProgressDTO getChapterProgress(Long courseId);
}
