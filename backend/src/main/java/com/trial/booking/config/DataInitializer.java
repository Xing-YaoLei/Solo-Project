package com.trial.booking.config;

import com.trial.booking.entity.Appointment;
import com.trial.booking.entity.Teacher;
import com.trial.booking.entity.User;
import com.trial.booking.repository.AppointmentRepository;
import com.trial.booking.repository.TeacherRepository;
import com.trial.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initUsers();
        initTeachers();
        bindTeacherUserId();
        initAppointments();
    }

    private void initUsers() {
        createUserIfNotExists("admin", "管理员", "ADMIN", "总部校区", "admin123");
        createUserIfNotExists("reception", "前台小王", "RECEPTIONIST", "总部校区", "123456");
        createUserIfNotExists("teacher1", "王老师", "TEACHER", "总部校区", "teacher123");
        createUserIfNotExists("principal1", "李校长", "PRINCIPAL", "中关村校区", "principal123");
        createUserIfNotExists("parent1", "张家长", "PARENT", "总部校区", "parent123");
        createUserIfNotExists("student1", "小明同学", "STUDENT", "总部校区", "student123");
    }

    private void createUserIfNotExists(String username, String realName, String role, String campus, String rawPassword) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(rawPassword));
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

    private void bindTeacherUserId() {
        userRepository.findByUsername("teacher1").ifPresent(teacherUser -> {
            teacherRepository.findById(1L).ifPresent(teacher -> {
                if (teacher.getUserId() == null) {
                    teacher.setUserId(teacherUser.getId());
                    teacherRepository.save(teacher);
                }
            });
        });
    }

    private void initAppointments() {
        if (appointmentRepository.count() == 0) {
            User student = userRepository.findByUsername("student1").orElse(null);
            User parent = userRepository.findByUsername("parent1").orElse(null);

            Appointment appt1 = new Appointment();
            appt1.setStudentName("小明同学");
            appt1.setStudentPhone("13800138000");
            appt1.setSubject("钢琴");
            appt1.setTrialDate(LocalDate.now().plusDays(3));
            appt1.setTimeSlot("09:00-10:00");
            appt1.setTeacherId(1L);
            appt1.setCampus("总部校区");
            appt1.setStatus("PENDING");
            appt1.setStudentUserId(student != null ? student.getId() : 1000L);
            appt1.setParentId(parent != null ? parent.getId() : 1001L);
            appointmentRepository.save(appt1);

            Appointment appt2 = new Appointment();
            appt2.setStudentName("小红同学");
            appt2.setStudentPhone("13900139000");
            appt2.setSubject("小提琴");
            appt2.setTrialDate(LocalDate.now().plusDays(5));
            appt2.setTimeSlot("14:00-15:00");
            appt2.setTeacherId(2L);
            appt2.setCampus("总部校区");
            appt2.setStatus("CONFIRMED");
            appointmentRepository.save(appt2);
        }
    }
}
