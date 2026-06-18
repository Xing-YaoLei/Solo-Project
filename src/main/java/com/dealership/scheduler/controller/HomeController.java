package com.dealership.scheduler.controller;

import com.dealership.scheduler.entity.SysUser;
import com.dealership.scheduler.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/")
    public String index(Model model) {
        return "redirect:/scheduler";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        return "dashboard";
    }
}
