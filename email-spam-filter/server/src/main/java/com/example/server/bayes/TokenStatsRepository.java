package com.example.server.bayes;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TokenStatsRepository extends JpaRepository<TokenStats, Long> 
{
  Optional<TokenStats> findByToken(String token);
}
