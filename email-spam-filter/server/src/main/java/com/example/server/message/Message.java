package com.example.server.message;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Message 
{
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String sender;
  private String subject;

  @Column(length = 10000)
  private String body;

  @Enumerated(EnumType.STRING)
  private Label label = Label.UNKNOWN; // UNKNOWN | SPAM | HAM

  private Boolean isSpam;      // result of last classification
  private Double score;        // log-odds "points"
  private Double probability;  // P(spam | message)
  private Instant classifiedAt;

  public enum Label { UNKNOWN, SPAM, HAM }

  // getters/setters
  public Long getId() 
  { 
    return id; 
  }

  public void setId(Long id)
  { 
    this.id = id; 
  }

  public String getSender() 
  { 
    return sender; 
  }

  public void setSender(String sender) 
  { 
    this.sender = sender; 
  }

  public String getSubject() 
  { 
    return subject; 
  }

  public void setSubject(String subject) 
  { 
    this.subject = subject; 
  }

  public String getBody() 
  { 
    return body; 
  }

  public void setBody(String body) 
  { 
    this.body = body; 
  }

  public Label getLabel() 
  { 
    return label; 
  }

  public void setLabel(Label label) 
  { 
    this.label = label; 
  }

  public Boolean getIsSpam() 
  { 
    return isSpam; 
  }

  public void setIsSpam(Boolean isSpam) 
  { 
    this.isSpam = isSpam; 
  }

  public Double getScore() 
  { 
    return score; 
  }
  public void setScore(Double score) 
  { 
    this.score = score; 
  }

  public Double getProbability() 
  { 
    return probability; 
  }

  public void setProbability(Double probability) 
  { 
    this.probability = probability; 
  }

  public Instant getClassifiedAt() 
  { 
    return classifiedAt; 
  }

  public void setClassifiedAt(Instant classifiedAt) 
  { 
    this.classifiedAt = classifiedAt; 
  }
}
