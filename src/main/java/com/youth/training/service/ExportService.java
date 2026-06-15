package com.youth.training.service;

import com.youth.training.config.DashboardProperties;
import com.youth.training.entity.Course;
import com.youth.training.entity.ExceptionOrder;
import com.youth.training.entity.LearningProgress;
import com.youth.training.entity.RenewalFollow;
import com.youth.training.entity.Student;
import com.youth.training.enums.ProgressType;
import com.youth.training.repository.CourseRepository;
import com.youth.training.repository.ExceptionOrderRepository;
import com.youth.training.repository.LearningProgressRepository;
import com.youth.training.repository.RenewalFollowRepository;
import com.youth.training.repository.StudentRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExportService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private LearningProgressRepository learningProgressRepository;

    @Autowired
    private ExceptionOrderRepository exceptionOrderRepository;

    @Autowired
    private RenewalFollowRepository renewalFollowRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private DashboardProperties dashboardProperties;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional(readOnly = true)
    public XSSFWorkbook exportProgressReport(List<Long> studentIds, List<Long> courseIds) {
        XSSFWorkbook workbook = new XSSFWorkbook();

        createDataCaliberSheet(workbook);

        Sheet dataSheet = workbook.createSheet("进度报表");
        createHeaderRow(dataSheet, new String[]{
                "学生姓名", "课程名", "完成率(%)", "状态", "最近学习时间", "异常单数"
        });

        CellStyle headerStyle = createHeaderStyle(workbook);
        for (int i = 0; i < 6; i++) {
            dataSheet.getRow(0).getCell(i).setCellStyle(headerStyle);
        }

        List<Student> students = (studentIds != null && !studentIds.isEmpty())
                ? studentRepository.findAllById(studentIds)
                : studentRepository.findAll();

        List<Course> courses = (courseIds != null && !courseIds.isEmpty())
                ? courseRepository.findAllById(courseIds)
                : courseRepository.findAll();

        Map<Long, String> courseNameMap = courses.stream()
                .collect(Collectors.toMap(Course::getId, Course::getCourseName));
        Map<Long, String> studentNameMap = students.stream()
                .collect(Collectors.toMap(Student::getId, Student::getStudentName));

        int rowNum = 1;
        for (Student student : students) {
            List<LearningProgress> progressList = learningProgressRepository
                    .findByStudentIdAndProgressType(student.getId(), ProgressType.COURSE.getCode());

            for (LearningProgress progress : progressList) {
                if (courseIds != null && !courseIds.isEmpty() && !courseIds.contains(progress.getCourseId())) {
                    continue;
                }

                Row row = dataSheet.createRow(rowNum++);
                row.createCell(0).setCellValue(studentNameMap.getOrDefault(student.getId(), ""));
                row.createCell(1).setCellValue(courseNameMap.getOrDefault(progress.getCourseId(), ""));
                row.createCell(2).setCellValue(progress.getCompletionRate() != null ? progress.getCompletionRate() : 0.0);
                row.createCell(3).setCellValue(progress.getStatus() != null ? progress.getStatus() : "");
                row.createCell(4).setCellValue(progress.getLastStudyTime() != null
                        ? progress.getLastStudyTime().format(DATE_TIME_FORMATTER) : "");

                long exceptionCount = exceptionOrderRepository.findByStudentIdOrderByCreateTimeDesc(student.getId())
                        .stream()
                        .filter(e -> progress.getCourseId() == null
                                || (e.getCourseId() != null && e.getCourseId().equals(progress.getCourseId())))
                        .count();
                row.createCell(5).setCellValue(exceptionCount);
            }
        }

        for (int i = 0; i < 6; i++) {
            dataSheet.autoSizeColumn(i);
        }

        return workbook;
    }

    @Transactional(readOnly = true)
    public XSSFWorkbook exportRenewalReport(List<Long> studentIds) {
        XSSFWorkbook workbook = new XSSFWorkbook();

        createDataCaliberSheet(workbook);

        Sheet dataSheet = workbook.createSheet("续费跟进报表");
        createHeaderRow(dataSheet, new String[]{
                "学生姓名", "性别", "年级", "联系电话", "家长姓名", "家长电话",
                "报名日期", "到期日", "负责老师", "最近跟进时间",
                "跟进主题", "续费意向", "续费状态", "跟进方式", "跟进人"
        });

        CellStyle headerStyle = createHeaderStyle(workbook);
        for (int i = 0; i < 15; i++) {
            dataSheet.getRow(0).getCell(i).setCellStyle(headerStyle);
        }

        List<Student> students = (studentIds != null && !studentIds.isEmpty())
                ? studentRepository.findAllById(studentIds)
                : studentRepository.findAll();

        int rowNum = 1;
        for (Student student : students) {
            List<RenewalFollow> follows = renewalFollowRepository.findByStudentIdOrderByCreateTimeDesc(student.getId());
            RenewalFollow latestFollow = follows.isEmpty() ? null : follows.get(0);

            Row row = dataSheet.createRow(rowNum++);
            row.createCell(0).setCellValue(student.getStudentName() != null ? student.getStudentName() : "");
            row.createCell(1).setCellValue(student.getGender() != null ? student.getGender() : "");
            row.createCell(2).setCellValue(student.getGrade() != null ? student.getGrade() : "");
            row.createCell(3).setCellValue(student.getPhone() != null ? student.getPhone() : "");
            row.createCell(4).setCellValue(student.getParentName() != null ? student.getParentName() : "");
            row.createCell(5).setCellValue(student.getParentPhone() != null ? student.getParentPhone() : "");
            row.createCell(6).setCellValue(student.getEnrollDate() != null
                    ? student.getEnrollDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "");
            row.createCell(7).setCellValue(student.getExpireDate() != null
                    ? student.getExpireDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "");
            row.createCell(8).setCellValue(student.getResponsibleTeacher() != null ? student.getResponsibleTeacher() : "");

            if (latestFollow != null) {
                row.createCell(9).setCellValue(latestFollow.getCreateTime() != null
                        ? latestFollow.getCreateTime().format(DATE_TIME_FORMATTER) : "");
                row.createCell(10).setCellValue(latestFollow.getFollowTheme() != null ? latestFollow.getFollowTheme() : "");
                row.createCell(11).setCellValue(latestFollow.getRenewalIntention() != null ? latestFollow.getRenewalIntention() : "");
                row.createCell(12).setCellValue(latestFollow.getRenewalStatus() != null ? latestFollow.getRenewalStatus() : "");
                row.createCell(13).setCellValue(latestFollow.getFollowMethod() != null ? latestFollow.getFollowMethod() : "");
                row.createCell(14).setCellValue(latestFollow.getFollowPerson() != null ? latestFollow.getFollowPerson() : "");
            } else {
                for (int i = 9; i < 15; i++) {
                    row.createCell(i).setCellValue("");
                }
            }
        }

        for (int i = 0; i < 15; i++) {
            dataSheet.autoSizeColumn(i);
        }

        return workbook;
    }

    @Transactional(readOnly = true)
    public XSSFWorkbook exportExceptionReport(String status) {
        XSSFWorkbook workbook = new XSSFWorkbook();

        createDataCaliberSheet(workbook);

        Sheet dataSheet = workbook.createSheet("异常单报表");
        createHeaderRow(dataSheet, new String[]{
                "工单号", "类型", "优先级", "标题", "学生姓名",
                "影响范围", "责任人", "处理部门", "处理结果",
                "处理前完成率(%)", "处理后完成率(%)", "创建人", "创建时间", "处理人", "处理时间"
        });

        CellStyle headerStyle = createHeaderStyle(workbook);
        for (int i = 0; i < 15; i++) {
            dataSheet.getRow(0).getCell(i).setCellStyle(headerStyle);
        }

        List<ExceptionOrder> orders;
        if (status != null && !status.isEmpty()) {
            orders = exceptionOrderRepository.findByStatusOrderByCreateTimeDesc(status);
        } else {
            orders = exceptionOrderRepository.findAll();
        }

        Map<Long, String> studentNameMap = new HashMap<>();
        for (ExceptionOrder order : orders) {
            if (order.getStudentId() != null && !studentNameMap.containsKey(order.getStudentId())) {
                studentRepository.findById(order.getStudentId())
                        .ifPresent(s -> studentNameMap.put(s.getId(), s.getStudentName()));
            }
        }

        int rowNum = 1;
        for (ExceptionOrder order : orders) {
            Row row = dataSheet.createRow(rowNum++);
            row.createCell(0).setCellValue(order.getOrderNo() != null ? order.getOrderNo() : "");
            row.createCell(1).setCellValue(order.getExceptionType() != null ? order.getExceptionType() : "");
            row.createCell(2).setCellValue(order.getPriority() != null ? order.getPriority() : "");
            row.createCell(3).setCellValue(order.getTitle() != null ? order.getTitle() : "");
            row.createCell(4).setCellValue(studentNameMap.getOrDefault(order.getStudentId(), ""));
            row.createCell(5).setCellValue(order.getImpactScope() != null ? order.getImpactScope() : "");
            row.createCell(6).setCellValue(order.getResponsiblePerson() != null ? order.getResponsiblePerson() : "");
            row.createCell(7).setCellValue(order.getHandlingDepartment() != null ? order.getHandlingDepartment() : "");
            row.createCell(8).setCellValue(order.getHandlingResult() != null ? order.getHandlingResult() : "");
            row.createCell(9).setCellValue(order.getCompletionRateBefore() != null ? order.getCompletionRateBefore() : 0.0);
            row.createCell(10).setCellValue(order.getCompletionRateAfter() != null ? order.getCompletionRateAfter() : 0.0);
            row.createCell(11).setCellValue(order.getCreatedBy() != null ? order.getCreatedBy() : "");
            row.createCell(12).setCellValue(order.getCreateTime() != null
                    ? order.getCreateTime().format(DATE_TIME_FORMATTER) : "");
            row.createCell(13).setCellValue(order.getHandledBy() != null ? order.getHandledBy() : "");
            row.createCell(14).setCellValue(order.getHandleTime() != null
                    ? order.getHandleTime().format(DATE_TIME_FORMATTER) : "");
        }

        for (int i = 0; i < 15; i++) {
            dataSheet.autoSizeColumn(i);
        }

        return workbook;
    }

    private void createDataCaliberSheet(XSSFWorkbook workbook) {
        String dataCaliber = dashboardProperties.getExport() != null
                ? dashboardProperties.getExport().getDataCaliber() : "";
        Sheet sheet = workbook.createSheet("取数口径");

        CellStyle headerStyle = createHeaderStyle(workbook);
        Row headerRow = sheet.createRow(0);
        Cell headerCell = headerRow.createCell(0);
        headerCell.setCellValue("取数口径说明");
        headerCell.setCellStyle(headerStyle);

        CellStyle contentStyle = workbook.createCellStyle();
        contentStyle.setWrapText(true);
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 11);
        contentStyle.setFont(font);

        if (dataCaliber != null) {
            String[] lines = dataCaliber.split("\\n");
            int rowNum = 1;
            for (String line : lines) {
                Row row = sheet.createRow(rowNum++);
                Cell cell = row.createCell(0);
                cell.setCellValue(line.trim());
                cell.setCellStyle(contentStyle);
            }
        }

        Row timeRow = sheet.createRow(sheet.getLastRowNum() + 2);
        Cell timeCell = timeRow.createCell(0);
        timeCell.setCellValue("导出时间: " + LocalDateTime.now().format(DATE_TIME_FORMATTER));
        timeCell.setCellStyle(contentStyle);

        sheet.setColumnWidth(0, 120 * 256);
    }

    private void createHeaderRow(Sheet sheet, String[] headers) {
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
}
