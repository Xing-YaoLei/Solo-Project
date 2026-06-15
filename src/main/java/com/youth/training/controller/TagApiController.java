package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.entity.Tag;
import com.youth.training.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagApiController {

    private final TagService tagService;

    @GetMapping("/list")
    public Result<List<Tag>> list(@RequestParam(required = false) String tagType,
                                   @RequestParam(required = false) String status) {
        return Result.success(tagService.listTags(tagType, status));
    }

    @GetMapping("/{id}")
    public Result<Tag> detail(@PathVariable Long id) {
        return Result.success(tagService.getTag(id));
    }

    @PostMapping("/")
    public Result<Tag> create(@RequestBody Tag tag) {
        return Result.success(tagService.createTag(tag));
    }

    @PutMapping("/{id}")
    public Result<Tag> update(@PathVariable Long id, @RequestBody Tag tag) {
        return Result.success(tagService.updateTag(id, tag));
    }

    @DeleteMapping("/{id}")
    public Result<Tag> delete(@PathVariable Long id) {
        return Result.success(tagService.deleteTag(id));
    }

    @GetMapping("/{id}/questions")
    public Result<List<Long>> getQuestions(@PathVariable Long id) {
        return Result.success(tagService.getQuestionsByTag(id));
    }
}
