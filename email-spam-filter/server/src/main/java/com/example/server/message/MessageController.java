package com.example.server.message;

import java.time.Instant;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.bayes.BayesService;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {
  private final MessageRepository repo;
  private final BayesService bayes;

  public MessageController(MessageRepository repo, BayesService bayes) {
    this.repo = repo; this.bayes = bayes;
  }

  @GetMapping public List<Message> all() { return repo.findAll(); }

  // Classify (does NOT train)
  @PostMapping("/classify")
  public Message classify(@RequestBody Message incoming) {
    var r = bayes.classify(incoming);
    incoming.setIsSpam(r.isSpam());
    incoming.setScore(r.score());
    incoming.setProbability(r.probability());
    incoming.setLabel(Message.Label.UNKNOWN);
    incoming.setClassifiedAt(Instant.now());
    return repo.save(incoming);
  }

  // Label & train the model
  @PostMapping("/{id}/label")
  public Message label(@PathVariable Long id, @RequestParam("value") Message.Label value) {
    Message m = repo.findById(id).orElseThrow();
    m.setLabel(value);
    bayes.train(m, value);
    return repo.save(m);
  }
}
