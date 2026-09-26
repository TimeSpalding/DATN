package com.imagesearch.backend_java.tryon.repository;

import com.imagesearch.backend_java.tryon.entity.TryOnHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TryOnHistoryRepository extends JpaRepository<TryOnHistory, Long> {

    Page<TryOnHistory> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserId(Long userId);

    void deleteByUserId(Long userId);
}
