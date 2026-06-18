package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.entity.ReviewNote;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.ReviewNoteRepository;
import com.secondhand.funnel.service.ReviewNoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewNoteServiceImpl implements ReviewNoteService {

    private final ReviewNoteRepository reviewNoteRepository;

    @Override
    @Transactional
    public ReviewNote create(ReviewNote note) {
        if (note.getId() != null) {
            note.setId(null);
        }
        ReviewNote saved = reviewNoteRepository.save(note);
        log.info("创建复盘备注成功: id={}, carId={}", saved.getId(), saved.getCarId());
        return saved;
    }

    @Override
    public ReviewNote getById(Long id) {
        return reviewNoteRepository.findById(id)
                .orElseThrow(() -> new BusinessException("复盘备注不存在: " + id));
    }

    @Override
    public List<ReviewNote> getByCarId(Long carId) {
        return reviewNoteRepository.findByCarIdOrderByCreatedAtDesc(carId);
    }

    @Override
    public List<ReviewNote> getByCarIdAndStage(Long carId, String stage) {
        return reviewNoteRepository.findByCarIdAndStage(carId, stage);
    }

    @Override
    public List<ReviewNote> getByCreatedBy(Long createdBy) {
        return reviewNoteRepository.findByCreatedBy(createdBy);
    }

    @Override
    @Transactional
    public ReviewNote update(Long id, ReviewNote note) {
        ReviewNote existing = getById(id);
        existing.setStage(note.getStage());
        existing.setNoteContent(note.getNoteContent());
        existing.setCreatedBy(note.getCreatedBy());
        ReviewNote updated = reviewNoteRepository.save(existing);
        log.info("更新复盘备注成功: id={}", id);
        return updated;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!reviewNoteRepository.existsById(id)) {
            throw new BusinessException("复盘备注不存在: " + id);
        }
        reviewNoteRepository.deleteById(id);
        log.info("删除复盘备注成功: id={}", id);
    }

    @Override
    public List<ReviewNote> listAll() {
        return reviewNoteRepository.findAll();
    }
}
