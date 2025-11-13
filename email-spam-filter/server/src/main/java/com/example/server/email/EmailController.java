package com.example.server.email;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {

  private final EmailService service;
  public EmailController(EmailService service) { this.service = service; }

  // GET /api/email/fetch?max=5
  @GetMapping("/fetch")
  public List<EmailService.EmailPreview> fetch(@RequestParam(required = false) Integer max) throws Exception {
    return service.fetch(max);
  }
}
