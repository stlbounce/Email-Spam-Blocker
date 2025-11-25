package com.example.server.email;

import com.example.server.message.Message;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {

  private final EmailService emailService;

  // ✅ constructor injection so 'emailService' exists
  public EmailController(EmailService emailService) {
    this.emailService = emailService;
  }

  @PostMapping("/connect-and-import")
  public List<Message> connectAndImport(@RequestBody EmailConnectRequest req) throws Exception {
    return emailService.connectAndImportFast(req);
  }
}
