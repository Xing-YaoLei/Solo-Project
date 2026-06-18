package com.dealership.scheduler.controller;

import com.dealership.scheduler.dto.MonthlyReviewDTO;
import com.dealership.scheduler.dto.ReviewQueryDTO;
import com.dealership.scheduler.repository.SysUserRepository;
import com.dealership.scheduler.service.MonthlyReviewService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;

@Controller
@RequestMapping("/review")
public class MonthlyReviewController {

    @Autowired
    private MonthlyReviewService reviewService;

    @Autowired
    private SysUserRepository userRepository;

    private static final String DEFAULT_OPERATOR = "系统管理员";

    @GetMapping
    public String reviewPage(Model model) {
        ReviewQueryDTO query = new ReviewQueryDTO();
        model.addAttribute("query", query);
        model.addAttribute("salesList", userRepository.findByEnabledTrue());
        return "review/index";
    }

    @PostMapping("/generate")
    public String generateReview(@ModelAttribute ReviewQueryDTO query, Model model) {
        MonthlyReviewDTO review = reviewService.generateReview(query, DEFAULT_OPERATOR);
        model.addAttribute("review", review);
        model.addAttribute("query", query);
        model.addAttribute("salesList", userRepository.findByEnabledTrue());
        return "review/index";
    }

    @PostMapping("/export")
    public void exportReview(@ModelAttribute ReviewQueryDTO query, HttpServletResponse response) throws IOException {
        reviewService.exportToExcel(query, DEFAULT_OPERATOR, response);
    }
}
