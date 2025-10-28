package com.devd.spring.bookstorepaymentservice;

import com.stripe.Stripe;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

/**
 * @author Devaraj Reddy, Date : 25-Jul-2020
 */
@SpringBootApplication
@ComponentScan(basePackages = {"com.devd.spring"})
@EnableFeignClients(basePackages = {"com.devd.spring"})
@EnableDiscoveryClient
public class BookstorePaymentServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BookstorePaymentServiceApplication.class, args);
		
		String stripeApiKey = System.getenv("STRIPE_API_KEY");
		if (stripeApiKey == null || stripeApiKey.isEmpty() || stripeApiKey.contains("your_stripe")) {
			System.err.println("WARNING: STRIPE_API_KEY is not properly configured. Payment functionality will not work.");
			System.err.println("Please set a valid Stripe test API key in the .env file.");
			System.err.println("Get a test key from: https://dashboard.stripe.com/test/apikeys");
			Stripe.apiKey = null; // Don't set invalid key
		} else {
			Stripe.apiKey = stripeApiKey;
			System.out.println("Stripe API key configured successfully.");
		}
	}

}

