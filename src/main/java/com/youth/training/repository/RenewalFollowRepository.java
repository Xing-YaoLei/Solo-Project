package com.youth.training.repository;

import com.youth.training.entity.RenewalFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RenewalFollowRepository extends JpaRepository<RenewalFollow, Long>, JpaSpecificationExecutor<RenewalFollow> {
    List<RenewalFollow> findByStudentIdOrderByCreateTimeDesc(Long studentId);
    List<RenewalFollow> findByFollowPersonOrderByPlanDateAsc(String followPerson);
    List<RenewalFollow> findByStatusOrderByPlanDateAsc(String status);
    List<RenewalFollow> findByPlanDateBetweenAndStatusOrderByPlanDateAsc(LocalDate start, LocalDate end, String status);
    List<RenewalFollow> findByRenewalStatusOrderByCreateTimeDesc(String renewalStatus);
    List<RenewalFollow> findByFollowStageOrderByCreateTimeDesc(String followStage);
}
