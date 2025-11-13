package com.example.server.email;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "email")
public class EmailProperties {
  private String host;
  private int port = 993;
  private boolean ssl = true;
  private String folder = "INBOX";
  private String username;
  private String password;
  private int max = 5;

  // getters/setters
  public String getHost() { return host; }
  public void setHost(String host) { this.host = host; }
  public int getPort() { return port; }
  public void setPort(int port) { this.port = port; }
  public boolean isSsl() { return ssl; }
  public void setSsl(boolean ssl) { this.ssl = ssl; }
  public String getFolder() { return folder; }
  public void setFolder(String folder) { this.folder = folder; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
  public int getMax() { return max; }
  public void setMax(int max) { this.max = max; }
}
