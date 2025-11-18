package com.devd.spring.bookstorebillingservice.integration;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.test.context.ActiveProfiles;

/**
 * Test security configuration to bypass authentication for integration tests.
 * This configuration takes precedence over the main security config during testing.
 */
@Configuration
@EnableWebSecurity
@ActiveProfiles("integration-test")
@Order(1) // Ensure this configuration takes precedence
public class TestSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
            .anyRequest().permitAll()
            .and()
            .csrf().disable()
            .headers().frameOptions().disable();
    }
}