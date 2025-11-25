package com.example.server.config;

import com.fasterxml.jackson.module.afterburner.AfterburnerModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {
  @Bean
  public AfterburnerModule afterburnerModule() {
    return new AfterburnerModule();
  }
}
