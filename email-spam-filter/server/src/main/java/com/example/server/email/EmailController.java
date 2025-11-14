package com.example.server.email;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.message.Message;

import jakarta.validation.Valid;

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
@CrossOrigin(origins = "*")
>>>>>>> Stashed changes
=======
@CrossOrigin(origins = "*")
>>>>>>> Stashed changes
@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {

  private final EmailService service;
  public EmailController(EmailService service) { this.service = service; }

  // Existing:
  // @PostMapping("/import") using app props, if you kept it

  // NEW: Connect with user-provided details and import+classify+save
  // POST /api/email/connect-and-import
  @PostMapping("/connect-and-import")
  public List<Message> connectAndImport(@Valid @RequestBody EmailConnectRequest request) throws Exception {
    return service.importAndClassify(request);
  }
}
