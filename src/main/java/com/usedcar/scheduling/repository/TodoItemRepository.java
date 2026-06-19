package com.usedcar.scheduling.repository;

import com.usedcar.scheduling.domain.TodoItem;
import com.usedcar.scheduling.enums.TodoStatus;
import com.usedcar.scheduling.enums.TodoType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TodoItemRepository extends JpaRepository<TodoItem, Long> {

    Page<TodoItem> findByAssigneeIdAndStatus(Long assigneeId, TodoStatus status, Pageable pageable);

    Page<TodoItem> findByAssigneeId(Long assigneeId, Pageable pageable);

    Page<TodoItem> findByStatus(TodoStatus status, Pageable pageable);

    Page<TodoItem> findByStatusAndTodoType(TodoStatus status, TodoType type, Pageable pageable);

    Page<TodoItem> findByTodoType(TodoType type, Pageable pageable);

    List<TodoItem> findByAssigneeIdAndStatus(Long assigneeId, TodoStatus status);

    List<TodoItem> findByStatus(TodoStatus status);

    List<TodoItem> findByVehicleId(Long vehicleId);

    List<TodoItem> findByTodoTypeAndStatus(TodoType type, TodoStatus status);

    long countByAssigneeIdAndStatus(Long assigneeId, TodoStatus status);

    @Query("SELECT t FROM TodoItem t WHERE t.dueDate < :date AND t.status IN :statuses")
    List<TodoItem> findOverdueItems(@Param("date") LocalDate date, @Param("statuses") List<TodoStatus> statuses);
}
