package com.example.server.email;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.bayes.BayesService;
import com.example.server.message.Message;
import com.example.server.message.Message.Label;
import com.example.server.message.MessageRepository;
import com.example.server.message.MessageStreamService;

import jakarta.mail.Address;
import jakarta.mail.FetchProfile;
import jakarta.mail.Folder;
import jakarta.mail.Session;
import jakarta.mail.Store;
import jakarta.mail.internet.InternetAddress;

@Service
public class EmailService {

  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  private final MessageRepository repo;
  private final BayesService bayes;
  @Nullable
  private final MessageStreamService stream; // optional

  public EmailService(
      MessageRepository repo,
      BayesService bayes,
      @Autowired(required = false) @Nullable MessageStreamService stream
  ) {
    this.repo = repo;
    this.bayes = bayes;
    this.stream = stream;
  }

  @Transactional
  public List<Message> connectAndImportFast(EmailConnectRequest req) throws Exception {
    long t0 = System.currentTimeMillis();
    log.info("[EMAIL] connectAndImportFast CALLED: host={}, user={}, folder={}, max={}",
        req.getHost(), req.getUsername(), req.getFolder(), req.getMax());

    boolean useSsl = req.getSsl() == null ? true : Boolean.TRUE.equals(req.getSsl());

    Properties props = new Properties();
    props.put("mail.store.protocol", "imap");
    props.put("mail.imap.ssl.enable", String.valueOf(useSsl));
    props.put("mail.imap.connectiontimeout", "10000"); // 10s
    props.put("mail.imap.timeout", "15000");           // 15s

    Session session = Session.getInstance(props);
    Store store = null;
    Folder folder = null;

    try {
      // 1) Connect
      store = session.getStore("imap");
      store.connect(
          req.getHost(),
          req.getPort(),
          req.getUsername(),
          req.getPassword()
      );
      long tConnect = System.currentTimeMillis();
      log.info("[EMAIL] Connected in {} ms", (tConnect - t0));

      // 2) Open folder
      String folderName = (req.getFolder() == null || req.getFolder().isBlank())
          ? "INBOX"
          : req.getFolder();

      folder = store.getFolder(folderName);
      folder.open(Folder.READ_ONLY);

      int total = folder.getMessageCount();
      if (total == 0) {
        log.info("[EMAIL] Folder empty");
        return Collections.emptyList();
      }

      int max = (req.getMax() != null && req.getMax() > 0) ? req.getMax() : 5;
      int start = Math.max(1, total - max + 1);
      log.info("[EMAIL] Folder has {} messages, fetching {} ({}..{})", total, max, start, total);

      jakarta.mail.Message[] slice = folder.getMessages(start, total);

      // 3) Fetch headers only
      FetchProfile fp = new FetchProfile();
      fp.add(FetchProfile.Item.ENVELOPE);
      fp.add(FetchProfile.Item.FLAGS);
      folder.fetch(slice, fp);
      long tFetched = System.currentTimeMillis();
      log.info("[EMAIL] IMAP fetch of {} msgs took {} ms", slice.length, (tFetched - tConnect));

      // 4) Map & classify
      List<Message> toSave = new ArrayList<>(slice.length);
      for (jakarta.mail.Message jm : slice) {
        String sender = "(unknown)";
        try {
          Address[] froms = jm.getFrom();
          if (froms != null && froms.length > 0) {
            Address a = froms[0];
            if (a instanceof InternetAddress ia) {
              String name = ia.getPersonal();
              sender = (name != null && !name.isBlank())
                  ? (name + " <" + ia.getAddress() + ">")
                  : ia.getAddress();
            } else {
              sender = a.toString();
            }
          }
        } catch (Exception ignored) {}

        String subject = Optional.ofNullable(jm.getSubject()).orElse("(no subject)");

        Message entity = new Message();
        entity.setSender(sender);
        entity.setSubject(subject);
        entity.setBody(null);
        entity.setLabel(Label.UNKNOWN);

        var result = bayes.classify(entity);
        entity.setIsSpam(result.isSpam());
        entity.setScore(result.score());
        entity.setProbability(result.probability());
        entity.setClassifiedAt(Instant.now());

        toSave.add(entity);
      }

      long tClassified = System.currentTimeMillis();
      log.info("[EMAIL] Classified {} msgs in {} ms", toSave.size(), (tClassified - tFetched));

      // 5) Save
      List<Message> saved = repo.saveAll(toSave);
      long tSaved = System.currentTimeMillis();
      log.info("[EMAIL] Saved in DB in {} ms", (tSaved - tClassified));
      log.info("[EMAIL] TOTAL connectAndImportFast time: {} ms", (tSaved - t0));

      // 6) Optional streaming
      if (stream != null) {
        saved.forEach(stream::publish);
      }

      return saved;

    } finally {
      try { if (folder != null && folder.isOpen()) folder.close(false); } catch (Exception ignored) {}
      try { if (store != null && store.isConnected()) store.close(); } catch (Exception ignored) {}
    }
  }
}
