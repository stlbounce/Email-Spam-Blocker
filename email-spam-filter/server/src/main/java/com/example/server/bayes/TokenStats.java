package com.example.server.bayes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = "token"))
public class TokenStats 
{
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String token;

  private long spamCount;
  private long hamCount;

  // getters/setters
  public Long getId() 
  { 
    return id; 
  }

  public void setId(Long id) 
  { 
    this.id = id; 
  }

  public String getToken() 
  { 
    return token; 
  }

  public void setToken(String token) 
  { 
    this.token = token; 
  }

  public long getSpamCount() 
  { 
    return spamCount; 
  }

  public void setSpamCount(long spamCount) 
  { 
    this.spamCount = spamCount; 
  }

  public long getHamCount() 
  { 
    return hamCount; 
  }

  public void setHamCount(long hamCount)
  { 
    this.hamCount = hamCount; 
  }
}
