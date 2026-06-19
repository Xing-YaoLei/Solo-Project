package com.usedcar.scheduling.job;

import com.usedcar.scheduling.enums.TodoStatus;
import com.usedcar.scheduling.enums.TodoType;
import com.usedcar.scheduling.repository.TodoItemRepository;
import com.usedcar.scheduling.service.TodoPoolService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class PreparationOverdueCheckJob extends QuartzJobBean {

    @Autowired
    private TodoPoolService todoPoolService;

    @Autowired
    private TodoItemRepository todoItemRepository;

    @Override
    protected void executeInternal(JobExecutionContext context) {
        log.info("PreparationOverdueCheckJob started");

        todoPoolService.checkOverduePreparations();

        long overdueCount = todoItemRepository
                .findByTodoTypeAndStatus(TodoType.PREPARATION_OVERDUE, TodoStatus.PENDING)
                .size();

        log.info("PreparationOverdueCheckJob completed, overdue items found: {}", overdueCount);
    }
}
