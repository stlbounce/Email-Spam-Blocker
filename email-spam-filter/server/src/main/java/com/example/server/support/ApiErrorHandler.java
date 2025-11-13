package com.example.server.support;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class ApiErrorHandler {
  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String,Object>> handleAny(Exception e, HttpServletRequest req) {
    Map<String,Object> body = new LinkedHashMap<>();
    body.put("timestamp", Instant.now().toString());
    body.put("path", req.getRequestURI());
    body.put("type", e.getClass().getName());
    body.put("message", e.getMessage());
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
  }
}
