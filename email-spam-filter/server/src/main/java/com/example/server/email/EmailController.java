package com.example.server.email;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.message.Message;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {

  private final EmailService service;
  public EmailController(EmailService service) { this.service = service; }

  // POST /api/email/import?max=5
  @PostMapping("/import")
  public List<Message> importAndClassify(@RequestParam(required = false) Integer max) throws Exception {
    return service.importAndClassify(max);
  }
}
