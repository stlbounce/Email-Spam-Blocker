package com.example.server.bayes;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.message.Message;

@Service
@Transactional
public class BayesService 
{
  private final Tokenizer tokenizer;
  private final TokenStatsRepository tokens;
  private final GlobalStatsRepository globals;

  private static final double ALPHA = 1.0; // Laplace smoothing

  public BayesService(Tokenizer tokenizer, TokenStatsRepository tokens, GlobalStatsRepository globals) 
  {
    this.tokenizer = tokenizer; 
    this.tokens = tokens; 
    this.globals = globals;
  }

  private GlobalStats getOrCreateGlobals() 
  {
    return globals.findById(1L).orElseGet(() -> 
    {
      GlobalStats g = new GlobalStats();
      g.setId(1L);
      return globals.save(g);
    });
  }

  // Update counts given a labeled message
  public void train(Message msg, Message.Label label) 
  {
    GlobalStats g = getOrCreateGlobals();
    List<String> toks = tokenizer.tokenizeAll(msg.getSender(), msg.getSubject(), msg.getBody());

    Set<String> newTokens = new HashSet<>();
    for (String t : toks) 
    {
      TokenStats ts = tokens.findByToken(t).orElseGet(() -> 
      {
        TokenStats created = new TokenStats();
        created.setToken(t);
        newTokens.add(t);
        return created;
      });

      if (label == Message.Label.SPAM) 
      {
        ts.setSpamCount(ts.getSpamCount() + 1);
        g.setTotalSpamTokens(g.getTotalSpamTokens() + 1);
      } 
        else if (label == Message.Label.HAM) 
        {
          ts.setHamCount(ts.getHamCount() + 1);
          g.setTotalHamTokens(g.getTotalHamTokens() + 1);
        }
      tokens.save(ts);
    }

    if (label == Message.Label.SPAM) g.setSpamMessages(g.getSpamMessages() + 1);
    if (label == Message.Label.HAM)  g.setHamMessages(g.getHamMessages() + 1);

    if (!newTokens.isEmpty()) g.setVocabularySize(g.getVocabularySize() + newTokens.size());
    globals.save(g);
  }

  // Return score (log-odds), probability, and spam decision (threshold)
  public ClassificationResult classify(Message msg) 
  {
    GlobalStats g = getOrCreateGlobals();
    long spamDocs = Math.max(1, g.getSpamMessages());
    long hamDocs  = Math.max(1, g.getHamMessages());
    double priorSpam = Math.log(spamDocs / (double)(spamDocs + hamDocs));
    double priorHam  = Math.log(hamDocs  / (double)(spamDocs + hamDocs));

    long V = Math.max(1, g.getVocabularySize());
    double denomSpam = g.getTotalSpamTokens() + ALPHA * V;
    double denomHam  = g.getTotalHamTokens()  + ALPHA * V;

    double logSpam = priorSpam;
    double logHam  = priorHam;

    for (String t : tokenizer.tokenizeAll(msg.getSender(), msg.getSubject(), msg.getBody())) 
    {
      TokenStats ts = tokens.findByToken(t).orElse(null);
      long cSpam = ts == null ? 0 : ts.getSpamCount();
      long cHam  = ts == null ? 0 : ts.getHamCount();

      double p_t_spam = (cSpam + ALPHA) / denomSpam;
      double p_t_ham  = (cHam  + ALPHA) / denomHam;

      logSpam += Math.log(p_t_spam);
      logHam  += Math.log(p_t_ham);
    }

    double score = logSpam - logHam;                 // "points"
    double probability = 1.0 / (1.0 + Math.exp(-score)); // 0..1
    boolean isSpam = probability >= 0.90;            // start with 90% threshold

    return new ClassificationResult(score, probability, isSpam);
  }

  public record ClassificationResult(double score, double probability, boolean isSpam) {}
}
