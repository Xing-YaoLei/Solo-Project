package com.secondhand.funnel.entity;

import com.secondhand.funnel.enums.DocType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "finance_document")
public class FinanceDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "car_id", nullable = false)
    private Long carId;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false, length = 30)
    private DocType docType;

    @Column(name = "is_missing", nullable = false)
    private Boolean isMissing = true;

    @Column(name = "missing_reason", length = 500)
    private String missingReason;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;
}
