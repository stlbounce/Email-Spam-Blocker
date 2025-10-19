package com.example.server.bayes;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class GlobalStats 
{
  @Id
  private Long id = 1L; // single row

  private long spamMessages;
  private long hamMessages;

  private long totalSpamTokens;
  private long totalHamTokens;

  private long vocabularySize;

  // getters/setters
  public Long getId() 
  { 
    return id; 
  }

  public void setId(Long id) 
  { 
    this.id = id; 
  }

  public long getSpamMessages() 
  { 
    return spamMessages; 
  }

  public void setSpamMessages(long spamMessages) 
  { 
    this.spamMessages = spamMessages; 
  }

  public long getHamMessages() 
  { 
    return hamMessages; 
  }

  public void setHamMessages(long hamMessages) 
  { 
    this.hamMessages = hamMessages; 
  }

  public long getTotalSpamTokens() 
  { 
    return totalSpamTokens; 
  }

  public void setTotalSpamTokens(long totalSpamTokens) 
  { 
    this.totalSpamTokens = totalSpamTokens; 
  }

  public long getTotalHamTokens() 
  { 
    return totalHamTokens; 
  }

  public void setTotalHamTokens(long totalHamTokens) 
  { 
    this.totalHamTokens = totalHamTokens; 
  }

  public long getVocabularySize() 
  { 
    return vocabularySize; 
  }

  public void setVocabularySize(long vocabularySize) 
  { 
    this.vocabularySize = vocabularySize; 
  }
}
