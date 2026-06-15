package com.youth.training.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.youth.training.common.Result;
import com.youth.training.entity.Question;
import com.youth.training.entity.Tag;
import com.youth.training.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionApiController {

    private final QuestionService questionService;

    private final ObjectMapper objectMapper;

    @GetMapping("/homework/{homeworkId}")
    public Result<List<Question>> listByHomework(@PathVariable Long homeworkId) {
        return Result.success(questionService.listQuestionsByHomework(homeworkId));
    }

    @GetMapping("/{id}")
    public Result<Question> detail(@PathVariable Long id) {
        return Result.success(questionService.getQuestion(id));
    }

    @PostMapping("/")
    public Result<Question> create(@RequestBody Map<String, Object> body) {
        Question question = objectMapper.convertValue(body.get("question"), Question.class);
        List<Long> tagIds = body.get("tagIds") != null
                ? objectMapper.convertValue(body.get("tagIds"), new TypeReference<List<Long>>() {})
                : null;
        return Result.success(questionService.createQuestion(question, tagIds));
    }

    @PutMapping("/{id}")
    public Result<Question> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Question question = objectMapper.convertValue(body.get("question"), Question.class);
        List<Long> tagIds = body.get("tagIds") != null
                ? objectMapper.convertValue(body.get("tagIds"), new TypeReference<List<Long>>() {})
                : null;
        return Result.success(questionService.updateQuestion(id, question, tagIds));
    }

    @DeleteMapping("/{id}")
    public Result<Question> delete(@PathVariable Long id) {
        return Result.success(questionService.deleteQuestion(id));
    }

    @GetMapping("/{id}/tags")
    public Result<List<Tag>> getTags(@PathVariable Long id) {
        return Result.success(questionService.getTagsByQuestion(id));
    }
}
