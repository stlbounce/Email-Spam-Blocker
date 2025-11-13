package com.example.server.email;

import jakarta.mail.*;
import jakarta.mail.internet.MimeMultipart;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class EmailService {

  private final EmailProperties props;

  public EmailService(EmailProperties props) {
    this.props = props;
  }

  public List<EmailPreview> fetch(Integer overrideMax) throws Exception {
    int max = (overrideMax != null && overrideMax > 0) ? overrideMax : props.getMax();

    Properties p = new Properties();
    p.put("mail.store.protocol", "imap");
    p.put("mail.imap.port", String.valueOf(props.getPort()));
    if (props.isSsl()) p.put("mail.imap.ssl.enable", "true");

    Session session = Session.getInstance(p);
    Store store = session.getStore("imap");
    if (isBlank(props.getUsername()) || isBlank(props.getPassword())) {
      throw new IllegalStateException("EMAIL_USER / EMAIL_PASS not set");
    }
    store.connect(props.getHost(), props.getPort(), props.getUsername(), props.getPassword());

    Folder folder = store.getFolder(props.getFolder());
    folder.open(Folder.READ_ONLY);

    int total = folder.getMessageCount();
    if (total == 0) { folder.close(false); store.close(); return List.of(); }

    int start = Math.max(1, total - max + 1);
    Message[] msgs = folder.getMessages(start, total);

    List<EmailPreview> out = new ArrayList<>();
    for (Message m : msgs) {
      String from = (m.getFrom() != null && m.getFrom().length > 0) ? m.getFrom()[0].toString() : "";
      String subject = safe(m.getSubject());
      String body = extractBody(m);
      String snippet = body.replaceAll("\\s+", " ");
      if (snippet.length() > 200) snippet = snippet.substring(0, 200) + "...";
      out.add(new EmailPreview(from, subject, snippet));
    }

    folder.close(false);
    store.close();
    return out;
  }

  private static String safe(String s) { return s == null ? "" : s; }
  private static boolean isBlank(String s) { return s == null || s.isBlank(); }

  private static String extractBody(Message message) throws Exception {
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
      if (pc instanceof String s) sb.append(s).append("\n");
      else if (pc instanceof MimeMultipart nested) sb.append(extractFromMultipart(nested));
    }
    return sb.toString();
  }

  // simple DTO
  public static class EmailPreview {
    public String sender;
    public String subject;
    public String snippet;
    public EmailPreview(String sender, String subject, String snippet) {
      this.sender = sender; this.subject = subject; this.snippet = snippet;
    }
  }
}
