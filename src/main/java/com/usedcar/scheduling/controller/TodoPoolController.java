package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.dto.TodoItemDTO;
import com.usedcar.scheduling.enums.TodoStatus;
import com.usedcar.scheduling.enums.TodoType;
import com.usedcar.scheduling.enums.UserRole;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.service.TodoPoolService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class TodoPoolController {

    private final TodoPoolService todoPoolService;
    private final UserRepository userRepository;

    @GetMapping("/todos")
    public String pool(@RequestParam(required = false) TodoStatus status,
                       @RequestParam(required = false) TodoType todoType,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size,
                       Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        Long currentUserId = request.getHeader("X-User-Id") != null ? Long.parseLong(request.getHeader("X-User-Id")) : 1L;
        Page<TodoItemDTO> todos = todoPoolService.findAllTodos(status, todoType, PageRequest.of(page, size))
                .map(todoPoolService::toDTO);
        model.addAttribute("todos", todos);
        model.addAttribute("todoTypes", TodoType.values());
        model.addAttribute("todoStatuses", TodoStatus.values());
        model.addAttribute("assignees", userRepository.findAll());
        model.addAttribute("currentUserId", currentUserId);
        return "todo/pool";
    }

    @PostMapping("/todos/{id}/process")
    public String process(@PathVariable Long id,
                          @RequestParam(defaultValue = "1") Long operatorId,
                          @RequestParam(required = false) String remark) {
        todoPoolService.processTodo(id, operatorId, remark);
        return "redirect:/todos";
    }

    @PostMapping("/todos/{id}/complete")
    public String complete(@PathVariable Long id,
                           @RequestParam(defaultValue = "1") Long operatorId,
                           @RequestParam(required = false) String remark) {
        todoPoolService.completeTodo(id, operatorId, remark);
        return "redirect:/todos";
    }

    @PostMapping("/todos/{id}/reject")
    public String reject(@PathVariable Long id,
                         @RequestParam(defaultValue = "1") Long operatorId,
                         @RequestParam(required = false) String remark) {
        todoPoolService.rejectTodo(id, operatorId, remark);
        return "redirect:/todos";
    }

    @PostMapping("/todos/{id}/reassign")
    public String reassign(@PathVariable Long id,
                           @RequestParam Long newAssigneeId,
                           @RequestParam(defaultValue = "1") Long operatorId,
                           @RequestParam(required = false) String remark) {
        todoPoolService.reassignTodo(id, newAssigneeId, operatorId, remark);
        return "redirect:/todos";
    }

    private void addCommonAttributes(Model model, HttpServletRequest request) {
        model.addAttribute("currentRole",
                request.getHeader("X-User-Role") != null ? request.getHeader("X-User-Role") : "MANAGER");
        model.addAttribute("currentUserName",
                request.getHeader("X-User-Name") != null ? request.getHeader("X-User-Name") : "管理员");
        model.addAttribute("currentUserId",
                request.getHeader("X-User-Id") != null ? Long.parseLong(request.getHeader("X-User-Id")) : 1L);
    }
}
