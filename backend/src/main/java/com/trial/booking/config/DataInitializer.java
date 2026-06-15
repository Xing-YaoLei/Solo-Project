package com.trial.booking.config;

import com.trial.booking.entity.Teacher;
import com.trial.booking.entity.User;
import com.trial.booking.repository.TeacherRepository;
import com.trial.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initUsers();
        initTeachers();
    }

    private void initUsers() {
        createUserIfNotExists("admin", "管理员", "ADMIN", "总部校区");
        createUserIfNotExists("reception", "前台小王", "RECEPTIONIST", "总部校区");
        createUserIfNotExists("teacher1", "王老师", "TEACHER", "总部校区");
        createUserIfNotExists("principal", "李校长", "PRINCIPAL", "总部校区");
        createUserIfNotExists("parent1", "张家长", "PARENT", "总部校区");
        createUserIfNotExists("student1", "小明同学", "STUDENT", "总部校区");
    }

    private void createUserIfNotExists(String username, String realName, String role, String campus) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode("123456"));
            user.setRealName(realName);
            user.setRole(role);
            user.setCampus(campus);
            user.setEnabled(true);
            userRepository.save(user);
        }
    }

    private void initTeachers() {
        if (teacherRepository.count() == 0) {
            String[][] teacherData = {
                    {"王老师", "钢琴", "总部校区"},
                    {"李老师", "小提琴", "总部校区"},
                    {"张老师", "舞蹈", "城南校区"},
                    {"赵老师", "美术", "城北校区"},
                    {"陈老师", "书法", "城东校区"}
            };
            for (String[] data : teacherData) {
                Teacher t = new Teacher();
                t.setName(data[0]);
                t.setSubject(data[1]);
                t.setCampus(data[2]);
                t.setEnabled(true);
                teacherRepository.save(t);
            }
        }
    }
}
