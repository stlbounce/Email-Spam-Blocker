package com.example.server.bayes;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class Tokenizer 
{
  public List<String> tokenizeAll(String sender, String subject, String body) 
  {
    List<String> tokens = new ArrayList<>();

    for (String part : new String[]{ sender, subject, body }) 
    {
      if (part == null) continue;
      
      String[] raw = part.toLowerCase().split("[^a-z0-9@._+]+");

      for (String t : raw) 
      {
        if (t.length() >= 2 && t.length() <= 40) tokens.add(t);
      }
    }
    return tokens;
  }
}
