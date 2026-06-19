package com.usedcar.scheduling.domain;

import com.usedcar.scheduling.enums.PreparationItemName;
import com.usedcar.scheduling.enums.PreparationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "t_preparation_checklist")
public class PreparationChecklist extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PreparationItemName itemName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PreparationStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private User operator;

    private LocalDateTime completedAt;

    private String remark;
}
