package com.usedcar.scheduling.service;

import com.usedcar.scheduling.domain.TodoItem;
import com.usedcar.scheduling.dto.TodoItemDTO;
import com.usedcar.scheduling.enums.TodoStatus;
import com.usedcar.scheduling.enums.TodoType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TodoPoolService {

    Page<TodoItem> findMyTodos(Long assigneeId, TodoStatus status, Pageable pageable);

    Page<TodoItem> findAllTodos(TodoStatus status, TodoType type, Pageable pageable);

    TodoItem createTodo(TodoItem todo);

    TodoItem processTodo(Long todoId, Long assigneeId, String remark);

    TodoItem completeTodo(Long todoId, Long assigneeId, String remark);

    TodoItem rejectTodo(Long todoId, Long assigneeId, String remark);

    TodoItem reassignTodo(Long todoId, Long newAssigneeId, Long operatorId, String remark);

    void checkMissingDocuments(Long vehicleId);

    void checkOverduePreparations();

    TodoItemDTO toDTO(TodoItem item);
}
