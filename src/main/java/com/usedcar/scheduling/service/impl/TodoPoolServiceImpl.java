package com.usedcar.scheduling.service.impl;

import com.usedcar.scheduling.domain.FinanceDocument;
import com.usedcar.scheduling.domain.PreparationChecklist;
import com.usedcar.scheduling.domain.TodoItem;
import com.usedcar.scheduling.domain.User;
import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.domain.VehicleArchive;
import com.usedcar.scheduling.dto.TodoItemDTO;
import com.usedcar.scheduling.enums.ArchiveType;
import com.usedcar.scheduling.enums.DocumentStatus;
import com.usedcar.scheduling.enums.PreparationStatus;
import com.usedcar.scheduling.enums.TodoStatus;
import com.usedcar.scheduling.enums.TodoType;
import com.usedcar.scheduling.repository.FinanceDocumentRepository;
import com.usedcar.scheduling.repository.PreparationChecklistRepository;
import com.usedcar.scheduling.repository.TodoItemRepository;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.repository.VehicleArchiveRepository;
import com.usedcar.scheduling.repository.VehicleRepository;
import com.usedcar.scheduling.service.TodoPoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TodoPoolServiceImpl implements TodoPoolService {

    private final TodoItemRepository todoItemRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final FinanceDocumentRepository financeDocumentRepository;
    private final PreparationChecklistRepository preparationChecklistRepository;
    private final VehicleArchiveRepository vehicleArchiveRepository;

    @Override
    public Page<TodoItem> findMyTodos(Long assigneeId, TodoStatus status, Pageable pageable) {
        if (status != null) {
            return todoItemRepository.findByAssigneeIdAndStatus(assigneeId, status, pageable);
        }
        return todoItemRepository.findByAssigneeId(assigneeId, pageable);
    }

    @Override
    public Page<TodoItem> findAllTodos(TodoStatus status, TodoType type, Long assigneeId, Pageable pageable) {
        if (assigneeId != null && status != null) {
            return todoItemRepository.findByAssigneeIdAndStatus(assigneeId, status, pageable);
        }
        if (assigneeId != null) {
            return todoItemRepository.findByAssigneeId(assigneeId, pageable);
        }
        if (type != null && status != null) {
            return todoItemRepository.findByStatusAndTodoType(status, type, pageable);
        }
        if (type != null) {
            return todoItemRepository.findByTodoType(type, pageable);
        }
        if (status != null) {
            return todoItemRepository.findByStatus(status, pageable);
        }
        return todoItemRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public TodoItem createTodo(TodoItem todo) {
        return todoItemRepository.save(todo);
    }

    @Override
    @Transactional
    public TodoItem processTodo(Long todoId, Long assigneeId, String remark) {
        TodoItem todo = todoItemRepository.findById(todoId)
                .orElseThrow(() -> new IllegalArgumentException("待办事项不存在: " + todoId));
        if (todo.getStatus() != TodoStatus.PENDING) {
            throw new IllegalStateException("只有待处理状态的事项才能开始处理");
        }
        todo.setStatus(TodoStatus.PROCESSING);
        todo.setRemark(remark);
        return todoItemRepository.save(todo);
    }

    @Override
    @Transactional
    public TodoItem completeTodo(Long todoId, Long assigneeId, String remark) {
        TodoItem todo = todoItemRepository.findById(todoId)
                .orElseThrow(() -> new IllegalArgumentException("待办事项不存在: " + todoId));
        todo.setStatus(TodoStatus.DONE);
        todo.setCompletedAt(LocalDateTime.now());
        todo.setRemark(remark);
        return todoItemRepository.save(todo);
    }

    @Override
    @Transactional
    public TodoItem rejectTodo(Long todoId, Long assigneeId, String remark) {
        TodoItem todo = todoItemRepository.findById(todoId)
                .orElseThrow(() -> new IllegalArgumentException("待办事项不存在: " + todoId));
        todo.setStatus(TodoStatus.REJECTED);
        todo.setRemark(remark);

        TodoItem newTodo = new TodoItem();
        newTodo.setVehicle(todo.getVehicle());
        newTodo.setTodoType(todo.getTodoType());
        newTodo.setStatus(TodoStatus.PENDING);
        newTodo.setTitle(todo.getTitle() + " (重新处理)");
        newTodo.setDescription(todo.getDescription());
        newTodo.setAssignee(todo.getAssignee());
        newTodo.setCreator(todo.getCreator());
        newTodo.setDueDate(LocalDate.now().plusDays(1));
        todoItemRepository.save(newTodo);

        return todoItemRepository.save(todo);
    }

    @Override
    @Transactional
    public TodoItem reassignTodo(Long todoId, Long newAssigneeId, Long operatorId, String remark) {
        TodoItem todo = todoItemRepository.findById(todoId)
                .orElseThrow(() -> new IllegalArgumentException("待办事项不存在: " + todoId));

        String oldAssigneeName = todo.getAssignee() != null ? todo.getAssignee().getRealName() : null;
        User newAssignee = userRepository.findById(newAssigneeId)
                .orElseThrow(() -> new IllegalArgumentException("新负责人不存在: " + newAssigneeId));
        todo.setAssignee(newAssignee);
        todo.setRemark(remark);

        VehicleArchive archive = new VehicleArchive();
        archive.setVehicle(todo.getVehicle());
        archive.setArchiveType(ArchiveType.OWNER_CHANGE);
        archive.setOldValue(oldAssigneeName);
        archive.setNewValue(newAssignee.getRealName());
        if (operatorId != null) {
            User operator = userRepository.findById(operatorId).orElse(null);
            archive.setOperator(operator);
        }
        archive.setRemark("待办转派: " + remark);
        vehicleArchiveRepository.save(archive);

        return todoItemRepository.save(todo);
    }

    @Override
    @Transactional
    public void checkMissingDocuments(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("车辆不存在: " + vehicleId));

        for (DocumentStatus ds : Arrays.asList(DocumentStatus.MISSING)) {
            List<FinanceDocument> missingDocs = financeDocumentRepository.findByVehicleIdAndStatus(vehicleId, ds);
            for (FinanceDocument doc : missingDocs) {
                List<TodoItem> existing = todoItemRepository.findByVehicleId(vehicleId);
                boolean alreadyExists = existing.stream()
                        .anyMatch(t -> t.getTodoType() == TodoType.MISSING_DOCUMENT
                                && t.getStatus() != TodoStatus.DONE
                                && t.getStatus() != TodoStatus.REJECTED
                                && t.getTitle().contains(doc.getDocumentType().name()));

                if (!alreadyExists) {
                    TodoItem todo = new TodoItem();
                    todo.setVehicle(vehicle);
                    todo.setTodoType(TodoType.MISSING_DOCUMENT);
                    todo.setStatus(TodoStatus.PENDING);
                    todo.setTitle("缺失文档: " + doc.getDocumentType().name());
                    todo.setDescription("车辆 " + vehicle.getVin() + " 缺少" + doc.getDocumentType().name() + "文档");
                    todo.setDueDate(LocalDate.now().plusDays(3));
                    todoItemRepository.save(todo);
                }
            }
        }
    }

    @Override
    @Transactional
    public void checkOverduePreparations() {
        List<TodoItem> overdueItems = todoItemRepository.findOverdueItems(
                LocalDate.now(),
                Arrays.asList(TodoStatus.PENDING, TodoStatus.PROCESSING)
        );

        for (TodoItem overdue : overdueItems) {
            if (overdue.getTodoType() == TodoType.PREPARATION_OVERDUE) {
                continue;
            }

            Vehicle vehicle = overdue.getVehicle();
            List<PreparationChecklist> pendingItems = preparationChecklistRepository
                    .findByVehicleIdAndStatus(vehicle.getId(), PreparationStatus.PENDING);

            for (PreparationChecklist item : pendingItems) {
                List<TodoItem> existing = todoItemRepository.findByVehicleId(vehicle.getId());
                boolean alreadyExists = existing.stream()
                        .anyMatch(t -> t.getTodoType() == TodoType.PREPARATION_OVERDUE
                                && t.getStatus() != TodoStatus.DONE
                                && t.getStatus() != TodoStatus.REJECTED
                                && t.getTitle().contains(item.getItemName().name()));

                if (!alreadyExists) {
                    TodoItem todo = new TodoItem();
                    todo.setVehicle(vehicle);
                    todo.setTodoType(TodoType.PREPARATION_OVERDUE);
                    todo.setStatus(TodoStatus.PENDING);
                    todo.setTitle("整备逾期: " + item.getItemName().name());
                    todo.setDescription("车辆 " + vehicle.getVin() + " 的整备项 " + item.getItemName().name() + " 已逾期");
                    todo.setAssignee(item.getOperator());
                    todoItemRepository.save(todo);
                }
            }
        }
    }

    @Override
    public TodoItemDTO toDTO(TodoItem item) {
        TodoItemDTO dto = new TodoItemDTO();
        dto.setId(item.getId());
        dto.setVehicleId(item.getVehicle().getId());
        dto.setVehicleVin(item.getVehicle().getVin());
        dto.setVehicleInfo(item.getVehicle().getVin() + " - " + item.getVehicle().getBrand() + " " + item.getVehicle().getModel());
        dto.setVehicleBrand(item.getVehicle().getBrand());
        dto.setVehicleModel(item.getVehicle().getModel());
        dto.setTodoType(item.getTodoType().name());
        dto.setStatus(item.getStatus().name());
        dto.setTitle(item.getTitle());
        dto.setDescription(item.getDescription());
        dto.setAssigneeName(item.getAssignee() != null ? item.getAssignee().getRealName() : null);
        dto.setCreatorName(item.getCreator() != null ? item.getCreator().getRealName() : null);
        dto.setDueDate(item.getDueDate());
        dto.setCompletedAt(item.getCompletedAt());
        dto.setRemark(item.getRemark());
        dto.setOverdue(item.getDueDate() != null && item.getDueDate().isBefore(LocalDate.now())
                && item.getStatus() != TodoStatus.DONE && item.getStatus() != TodoStatus.REJECTED);
        return dto;
    }
}
