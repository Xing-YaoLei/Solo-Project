package com.youth.training.service;

import com.youth.training.entity.QuestionTag;
import com.youth.training.entity.Tag;
import com.youth.training.enums.CommonStatus;
import com.youth.training.repository.QuestionTagRepository;
import com.youth.training.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TagService {

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private QuestionTagRepository questionTagRepository;

    @Transactional
    @CacheEvict(value = {"tag", "tagList", "tagQuestions"}, allEntries = true)
    public Tag createTag(Tag tag) {
        tag.setStatus(CommonStatus.ACTIVE.getCode());
        return tagRepository.save(tag);
    }

    @Transactional
    @CacheEvict(value = {"tag", "tagList", "tagQuestions"}, allEntries = true)
    public Tag updateTag(Long id, Tag tag) {
        Tag existing = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("标签不存在: " + id));

        existing.setTagName(tag.getTagName());
        existing.setDescription(tag.getDescription());
        existing.setTagType(tag.getTagType());
        existing.setStatus(tag.getStatus());

        return tagRepository.save(existing);
    }

    @Transactional
    @CacheEvict(value = {"tag", "tagList", "tagQuestions"}, allEntries = true)
    public Tag deleteTag(Long id) {
        Tag existing = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("标签不存在: " + id));

        existing.setStatus(CommonStatus.DELETED.getCode());
        return tagRepository.save(existing);
    }

    @Cacheable(value = "tag", key = "#id")
    public Tag getTag(Long id) {
        return tagRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "tagList", key = "'list:' + (#tagType != null ? #tagType : '') + ':' + (#status != null ? #status : '')")
    public List<Tag> listTags(String tagType, String status) {
        if (tagType != null && status != null) {
            return tagRepository.findByTagType(tagType).stream()
                    .filter(t -> status.equals(t.getStatus()))
                    .collect(Collectors.toList());
        } else if (tagType != null) {
            return tagRepository.findByTagType(tagType);
        } else if (status != null) {
            return tagRepository.findByStatus(status);
        }
        return tagRepository.findAll();
    }

    @Cacheable(value = "tagQuestions", key = "'tag:' + #tagId")
    public List<Long> getQuestionsByTag(Long tagId) {
        List<QuestionTag> questionTags = questionTagRepository.findByTagId(tagId);
        return questionTags.stream()
                .map(QuestionTag::getQuestionId)
                .collect(Collectors.toList());
    }
}
