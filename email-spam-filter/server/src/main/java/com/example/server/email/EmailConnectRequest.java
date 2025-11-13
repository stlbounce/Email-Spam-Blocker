package com.example.server.email;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class EmailConnectRequest {
  @NotBlank public String host;     // e.g. imap.mail.yahoo.com
  @Min(1)  public int port = 993;   // typically 993 for SSL IMAP
  public boolean ssl = true;        // SSL on/off
  @NotBlank public String folder = "INBOX";

  @NotBlank public String username; // full email address
  @NotBlank public String password; // app password (providers require this)

  @Min(1) public Integer max = 20;   // how many to import

  // getters/setters if you’re not using lombok
}
