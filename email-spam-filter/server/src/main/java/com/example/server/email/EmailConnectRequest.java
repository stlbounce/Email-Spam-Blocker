package com.example.server.email;

/**
 * DTO for /api/email/connect-and-import
 * Used by EmailService.connectAndImportFast
 */
public class EmailConnectRequest {
  private String host;
  private Integer port;
  // use wrapper so it can be null, but default to true
  private Boolean ssl = Boolean.TRUE;
  private String folder = "INBOX";
  private String username;
  private String password;
  private Integer max = 5;

  public String getHost() {
    return host;
  }

  public void setHost(String host) {
    this.host = host;
  }

  public Integer getPort() {
    return port;
  }

  public void setPort(Integer port) {
    this.port = port;
  }

  public Boolean getSsl() {
    return ssl;
  }

  public void setSsl(Boolean ssl) {
    this.ssl = ssl;
  }

  // convenience for boolean-style access if you ever need it
  public boolean isSsl() {
    return Boolean.TRUE.equals(ssl);
  }

  public String getFolder() {
    return folder;
  }

  public void setFolder(String folder) {
    this.folder = folder;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public Integer getMax() {
    return max;
  }

  public void setMax(Integer max) {
    this.max = max;
  }
}
