package com.example.server.rule;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rules")
@CrossOrigin(origins = "*")
public class RuleController {
  private final RuleRepository repo;

  public RuleController(RuleRepository repo) {
    this.repo = repo;
  }

  @GetMapping
  public List<Rule> all() {
    return repo.findAll();
  }

  @PostMapping
  public Rule add(@RequestBody Rule r) {
    return repo.save(r);
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) {
    repo.deleteById(id);
  }
}
