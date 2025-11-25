package com.example.server.message;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class MessageStreamService {
  // Keep a thread-safe list of active clients
  private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

  public SseEmitter register(Long timeoutMillis) {
    SseEmitter emitter = new SseEmitter(timeoutMillis != null ? timeoutMillis : 0L); // 0 = no timeout
    emitters.add(emitter);

    emitter.onCompletion(() -> emitters.remove(emitter));
    emitter.onTimeout(() -> emitters.remove(emitter));
    emitter.onError((ex) -> emitters.remove(emitter));

    // Try to send an initial "hello" / heartbeat so the client opens immediately
    try {
      SseEmitter.SseEventBuilder event = SseEmitter.event()
          .name("hello")
          .data("connected")
          .id(String.valueOf(System.currentTimeMillis()));
      emitter.send(event);
    } catch (IOException ignored) {}

    return emitter;
  }

  /** Push a single message to all connected clients. */
  public void publish(Message msg) {
    for (SseEmitter emitter : emitters) {
      try {
        SseEmitter.SseEventBuilder event = SseEmitter.event()
            .name("message")
            .data(msg, MediaType.APPLICATION_JSON)
            .id(String.valueOf(msg.getId()));
        emitter.send(event);
      } catch (IOException ex) {
        emitter.complete();
        emitters.remove(emitter);
      }
    }
  }

  /** Optional keep-alive you can call from a @Scheduled task. */
  public void heartbeat() {
    for (SseEmitter emitter : emitters) {
      try {
        emitter.send(SseEmitter.event().name("keepalive").data("♥"));
      } catch (IOException ex) {
        emitter.complete();
        emitters.remove(emitter);
      }
    }
  }
}
