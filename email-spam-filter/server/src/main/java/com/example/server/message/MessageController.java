package com.example.server.message;

import java.time.Instant;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
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
public class MessageController 
{
  private final MessageRepository repo;
  private final BayesService bayes;

  public MessageController(MessageRepository repo, BayesService bayes) 
  {
    this.repo = repo; 
    this.bayes = bayes;
  }

  // All messages
  @GetMapping
  public List<Message> all() {
    return repo.findAll();
  }

  // ✅ NEW: spam messages only (isSpam = true), newest first
  @GetMapping("/spam")
  public List<Message> spam() {
    return repo.findByIsSpamTrueOrderByClassifiedAtDesc();
  }

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

    // keep isSpam in sync with label (optional but makes UI simpler)
    if (value == Message.Label.SPAM) {
      m.setIsSpam(true);
    } else if (value == Message.Label.HAM) {
      m.setIsSpam(false);
    }

    bayes.train(m, value);
    return repo.save(m);
  }

  // ✅ NEW: "Send back to inbox" (mark as HAM & not spam)
  @PostMapping("/{id}/move-to-inbox")
  public Message moveToInbox(@PathVariable Long id) {
    Message m = repo.findById(id).orElseThrow();
    m.setLabel(Message.Label.HAM);
    m.setIsSpam(false); // so it disappears from spam page

    bayes.train(m, Message.Label.HAM);
    return repo.save(m);
  }

  // ✅ NEW: delete from our system
  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) {
    repo.deleteById(id);
  }
}
