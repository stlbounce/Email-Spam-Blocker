package com.example.server.message;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {

  // All messages (already provided by JpaRepository#findAll)

  // ✅ New: only spam, newest first
  List<Message> findByIsSpamTrueOrderByClassifiedAtDesc();
}
