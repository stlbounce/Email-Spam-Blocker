package com.example.server.message;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;


@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageStreamController {

  private final MessageRepository repo;
  private final MessageStreamService stream;

  public MessageStreamController(MessageRepository repo, MessageStreamService stream) {
    this.repo = repo;
    this.stream = stream;
  }

  /**
   * Server-Sent Events endpoint.
   * Client connects to: GET /api/messages/stream?last=50
   */
  @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream(@RequestParam(name = "last", required = false, defaultValue = "25") int last) {
    SseEmitter emitter = stream.register(0L);

    // Send a small backlog so the page isn't empty
    List<Message> recent = repo.findAll()
      .stream()
      .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
      .limit(Math.max(1, last))
      .toList();

    recent.reversed().forEach(stream::publish); // publish sends to all (incl. this new emitter)

    return emitter;
  }
}
