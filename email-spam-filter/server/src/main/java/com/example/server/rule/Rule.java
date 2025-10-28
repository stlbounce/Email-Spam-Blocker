package com.example.server.rule;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Rule {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // Allowed values for type: "KEYWORD" or "SENDER"
  private String type;

  // The actual word/sender you want to match
  private String value;

  // Action: for MVP we only use "MARK_SPAM" or "ALLOW"
  private String action;

  public Long getId() 
  { 
    return id; 
  }

  public void setId(Long id) 
  { 
    this.id = id; 
  }

  public String getType() 
  { 
    return type; 
  }

  public void setType(String type) 
  { 
    this.type = type; 
  }

  public String getValue() 
  { 
    return value; 
  }

  public void setValue(String value)
  { 
    this.value = value; 
  }

  public String getAction() 
  { 
    return action; 
  }

  public void setAction(String action) 
  { 
    this.action = action; 
  }
}
