package com.usedcar.scheduling.repository;

import com.usedcar.scheduling.domain.User;
import com.usedcar.scheduling.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User> findByRole(UserRole role);

    List<User> findByStoreId(Long storeId);

    List<User> findByRoleAndStoreId(UserRole role, Long storeId);
}
