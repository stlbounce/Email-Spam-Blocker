package com.example.server.email;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.bayes.BayesService;
import com.example.server.message.Message;
import com.example.server.message.MessageRepository;

import jakarta.mail.BodyPart;
import jakarta.mail.Folder;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.Store;
import jakarta.mail.internet.MimeMultipart;

@Service
public class EmailService {

  private final EmailProperties props;
  private final MessageRepository repo;
  private final BayesService bayes;

  public EmailService(EmailProperties props, MessageRepository repo, BayesService bayes) {
    this.props = props;
    this.repo = repo;
    this.bayes = bayes;
  }

  /** Fetch latest N emails, classify with Bayes, save to MySQL, return saved rows. */
  @Transactional
  public List<Message> importAndClassify(Integer overrideMax) throws Exception {
    int max = (overrideMax != null && overrideMax > 0) ? overrideMax : props.getMax();

    // ---- IMAP properties ----
    Properties p = new Properties();
    p.put("mail.store.protocol", "imap");
    p.put("mail.imap.port", String.valueOf(props.getPort()));
    if (props.isSsl()) {
      p.put("mail.imap.ssl.enable", "true");
      p.put("mail.imap.ssl.trust", "*"); // helps with some certs
    } else {
      p.put("mail.imap.starttls.enable", "true");
    }

    Session session = Session.getInstance(p);
    Store store = session.getStore("imap");
    store.connect(props.getHost(), props.getPort(), props.getUsername(), props.getPassword());

    Folder folder = store.getFolder(props.getFolder());
    folder.open(Folder.READ_ONLY);

    int total = folder.getMessageCount();
    if (total == 0) {
      folder.close(false);
      store.close();
      return List.of();
    }

    int start = Math.max(1, total - max + 1);
    jakarta.mail.Message[] msgs = folder.getMessages(start, total);

    List<Message> saved = new ArrayList<>(msgs.length);
    for (jakarta.mail.Message jm : msgs) {
      String from = (jm.getFrom() != null && jm.getFrom().length > 0) ? jm.getFrom()[0].toString() : "";
      String subject = jm.getSubject() == null ? "" : jm.getSubject();
      String body = extractBody(jm);

      // Build your JPA entity
      Message m = new Message();
      m.setSender(from);
      m.setSubject(subject);
      m.setBody(body);
      m.setLabel(Message.Label.UNKNOWN);   // you can change this later after user feedback
      m.setClassifiedAt(Instant.now());

      // Run Bayes
      var r = bayes.classify(m);
      m.setIsSpam(r.isSpam());
      m.setScore(r.score());
      m.setProbability(r.probability());

      // Persist
      saved.add(repo.save(m));
    }

    folder.close(false);
    store.close();
    return saved;
  }

  @Transactional
public List<com.example.server.message.Message> importAndClassify(EmailConnectRequest req) throws Exception {
  int max = (req.max != null && req.max > 0) ? req.max : 5;

  Properties p = new Properties();
  p.put("mail.store.protocol", "imap");
  p.put("mail.imap.port", String.valueOf(req.port));
  if (req.ssl) {
    p.put("mail.imap.ssl.enable", "true");
    p.put("mail.imap.ssl.trust", "*");
  } else {
    p.put("mail.imap.starttls.enable", "true");
  }
  // p.put("mail.debug", "true"); // uncomment if you need protocol logs

  Session session = Session.getInstance(p);
  Store store = session.getStore("imap");
  store.connect(req.host, req.port, req.username, req.password);

  Folder folder = store.getFolder(req.folder);
  folder.open(Folder.READ_ONLY);

  int total = folder.getMessageCount();
  if (total == 0) { folder.close(false); store.close(); return List.of(); }

  int start = Math.max(1, total - max + 1);
  jakarta.mail.Message[] msgs = folder.getMessages(start, total);

  List<com.example.server.message.Message> saved = new ArrayList<>(msgs.length);
  for (jakarta.mail.Message jm : msgs) {
    String from = (jm.getFrom() != null && jm.getFrom().length > 0) ? jm.getFrom()[0].toString() : "";
    String subject = jm.getSubject() == null ? "" : jm.getSubject();
    String body = extractBody(jm);

    var entity = new com.example.server.message.Message();
    entity.setSender(from == null ? "" : from);
    entity.setSubject(subject == null ? "" : subject);
    entity.setBody(body == null ? "" : body);
    entity.setLabel(com.example.server.message.Message.Label.UNKNOWN);
    entity.setClassifiedAt(java.time.Instant.now());

    var result = bayes.classify(entity);
    entity.setIsSpam(result.isSpam());
    entity.setScore(result.score());
    entity.setProbability(result.probability());

    saved.add(repo.save(entity));
  }

  folder.close(false);
  store.close();
  return saved;
}

  // ---- Helpers ----
  private static String extractBody(jakarta.mail.Message message) throws Exception {
    Object content = message.getContent();
    if (content instanceof String s) return s;
    if (content instanceof Multipart mp) return extractFromMultipart(mp);
    return "";
  }

  private static String extractFromMultipart(Multipart mp) throws Exception {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < mp.getCount(); i++) {
      BodyPart part = mp.getBodyPart(i);
      Object pc = part.getContent();
      if (pc instanceof String s) sb.append(s).append('\n');
      else if (pc instanceof MimeMultipart nested) sb.append(extractFromMultipart(nested));
    }
    return sb.toString();
  }
}
