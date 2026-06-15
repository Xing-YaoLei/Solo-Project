package com.youth.training.controller;

import com.youth.training.dto.ProgressDashboardDTO;
import com.youth.training.entity.Course;
import com.youth.training.entity.ExceptionOrder;
import com.youth.training.entity.LearningProgress;
import com.youth.training.entity.RenewalFollow;
import com.youth.training.entity.Student;
import com.youth.training.enums.CommonStatus;
import com.youth.training.enums.ProgressType;
import com.youth.training.repository.CourseRepository;
import com.youth.training.repository.ExceptionOrderRepository;
import com.youth.training.repository.LearningProgressRepository;
import com.youth.training.repository.RenewalFollowRepository;
import com.youth.training.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final StudentRepository studentRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final ExceptionOrderRepository exceptionOrderRepository;
    private final RenewalFollowRepository renewalFollowRepository;
    private final CourseRepository courseRepository;

    @GetMapping("/")
    public String index(Model model) {
        long totalStudents = studentRepository.findByStatus(CommonStatus.ACTIVE.getCode()).size();

        List<LearningProgress> activeProgress = learningProgressRepository.findAll().stream()
                .filter(p -> ProgressType.COURSE.getCode().equals(p.getProgressType()))
                .filter(p -> !"COMPLETED".equals(p.getStatus()))
                .filter(p -> CommonStatus.ACTIVE.getCode().equals(p.getStatus()))
                .collect(Collectors.toList());
        long activeCourses = activeProgress.size();

        long pendingExceptions = exceptionOrderRepository.findByStatusOrderByCreateTimeDesc("PENDING").size();

        LocalDate today = LocalDate.now();
        long todayFollowCount = renewalFollowRepository.findAll().stream()
                .filter(f -> today.equals(f.getPlanDate()))
                .filter(f -> "PENDING".equals(f.getStatus()))
                .count();

        model.addAttribute("totalStudents", totalStudents);
        model.addAttribute("activeCourses", activeCourses);
        model.addAttribute("pendingExceptions", pendingExceptions);
        model.addAttribute("todayFollowCount", todayFollowCount);
        model.addAttribute("currentPage", "index");

        List<LearningProgress> warnings = learningProgressRepository
                .findByCompletionRateLessThanAndProgressType(60.0, ProgressType.COURSE.getCode());
        warnings.sort(Comparator.comparing(LearningProgress::getCompletionRate));
        List<LearningProgress> topWarnings = warnings.stream().limit(10).collect(Collectors.toList());

        Map<Long, String> studentNameMap = new HashMap<>();
        Map<Long, String> courseNameMap = new HashMap<>();
        for (Course c : courseRepository.findAll()) {
            courseNameMap.put(c.getId(), c.getCourseName());
        }

        List<ProgressDashboardDTO> warningDTOs = new ArrayList<>();
        for (LearningProgress p : topWarnings) {
            if (!studentNameMap.containsKey(p.getStudentId())) {
                studentRepository.findById(p.getStudentId())
                        .ifPresent(s -> studentNameMap.put(s.getId(), s.getStudentName()));
            }
            ProgressDashboardDTO dto = new ProgressDashboardDTO();
            dto.setStudentId(p.getStudentId());
            dto.setStudentName(studentNameMap.getOrDefault(p.getStudentId(), ""));
            dto.setCourseId(p.getCourseId());
            dto.setCourseName(courseNameMap.getOrDefault(p.getCourseId(), ""));
            dto.setCompletionRate(p.getCompletionRate());
            dto.setStatus(p.getStatus());
            dto.setLastStudyTime(p.getLastStudyTime());
            String level;
            if (p.getCompletionRate() < 30) {
                level = "严重";
            } else if (p.getCompletionRate() < 60) {
                level = "警告";
            } else {
                level = "注意";
            }
            dto.setWarningLevel(level);
            warningDTOs.add(dto);
        }
        model.addAttribute("warningList", warningDTOs);

        List<RenewalFollow> allFollows = renewalFollowRepository.findAll();
        List<RenewalFollow> todayFollows = allFollows.stream()
                .filter(f -> today.equals(f.getPlanDate()))
                .filter(f -> "PENDING".equals(f.getStatus()))
                .sorted(Comparator.comparing(RenewalFollow::getPlanDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(10)
                .collect(Collectors.toList());

        List<Map<String, Object>> todayFollowList = new ArrayList<>();
        for (RenewalFollow f : todayFollows) {
            Map<String, Object> item = new HashMap<>();
            item.put("follow", f);
            studentRepository.findById(f.getStudentId())
                    .ifPresent(s -> item.put("studentName", s.getStudentName()));
            todayFollowList.add(item);
        }
        model.addAttribute("todayFollowList", todayFollowList);

        return "index";
    }

    @GetMapping("/students")
    public String studentList(Model model) {
        model.addAttribute("currentPage", "students");
        return "students";
    }

    @GetMapping("/students/{id}")
    public String studentDetail(@PathVariable Long id, Model model) {
        Student student = studentRepository.findById(id).orElse(null);
        model.addAttribute("student", student);
        model.addAttribute("currentPage", "students");

        List<LearningProgress> progressList = learningProgressRepository
                .findByStudentIdAndProgressType(id, ProgressType.COURSE.getCode());
        Map<Long, String> courseNameMap = new HashMap<>();
        for (Course c : courseRepository.findAll()) {
            courseNameMap.put(c.getId(), c.getCourseName());
        }
        List<ProgressDashboardDTO> progressDTOs = new ArrayList<>();
        for (LearningProgress p : progressList) {
            ProgressDashboardDTO dto = new ProgressDashboardDTO();
            dto.setStudentId(p.getStudentId());
            dto.setStudentName(student != null ? student.getStudentName() : "");
            dto.setCourseId(p.getCourseId());
            dto.setCourseName(courseNameMap.getOrDefault(p.getCourseId(), ""));
            dto.setCompletionRate(p.getCompletionRate());
            dto.setStatus(p.getStatus());
            dto.setLastStudyTime(p.getLastStudyTime());
            progressDTOs.add(dto);
        }
        model.addAttribute("progressList", progressDTOs);

        List<ExceptionOrder> exceptionOrders = exceptionOrderRepository.findByStudentIdOrderByCreateTimeDesc(id);
        model.addAttribute("exceptionList", exceptionOrders);

        List<RenewalFollow> followHistory = renewalFollowRepository.findByStudentIdOrderByCreateTimeDesc(id);
        model.addAttribute("followHistory", followHistory);

        return "student-detail";
    }

    @GetMapping("/progress")
    public String progress(Model model) {
        model.addAttribute("currentPage", "progress");
        return "progress";
    }

    @GetMapping("/exceptions")
    public String exceptions(Model model) {
        model.addAttribute("currentPage", "exceptions");
        return "exceptions";
    }

    @GetMapping("/renewal")
    public String renewal(Model model) {
        model.addAttribute("currentPage", "renewal");
        return "renewal";
    }

    @GetMapping("/history")
    public String history(Model model) {
        model.addAttribute("currentPage", "history");
        return "history";
    }

    @GetMapping("/courses")
    public String courses(Model model) {
        model.addAttribute("currentPage", "courses");
        return "courses";
    }

    @GetMapping("/questions")
    public String questions(Model model) {
        model.addAttribute("currentPage", "questions");
        return "questions";
    }

    @GetMapping("/scores")
    public String scores(Model model) {
        model.addAttribute("currentPage", "scores");
        return "scores";
    }
}
