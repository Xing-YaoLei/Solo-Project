package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {
    Optional<ShareLink> findByLinkToken(String linkToken);

    @Query("SELECT s FROM ShareLink s WHERE s.linkToken = :token AND s.expireAt > :now")
    Optional<ShareLink> findValidByToken(@Param("token") String token, @Param("now") LocalDateTime now);

    @Transactional
    @Modifying
    @Query("UPDATE ShareLink s SET s.viewCount = s.viewCount + 1 WHERE s.id = :id")
    void incrementViewCount(@Param("id") Long id);
}
