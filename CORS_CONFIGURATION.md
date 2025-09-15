# CORS Configuration for Spring Boot Backend

Add this configuration to your Spring Boot application to resolve CORS issues:

## Option 1: Global CORS Configuration (Recommended)

Create a configuration class in your Spring Boot project:

```java
@Configuration
@EnableWebMvc
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

## Option 2: Controller Level (Quick Fix)

Add this annotation to your controller:

```java
@RestController
@RequestMapping("/api/v1/availability")
@CrossOrigin(origins = "http://localhost:4200")
public class AvailabilityController {
    // Your controller methods
}
```

## Option 3: Method Level

Add to individual methods:

```java
@CrossOrigin(origins = "http://localhost:4200")
@PostMapping
public ResponseEntity<Availability> addAvailability(@RequestBody Availability availability) {
    // Method implementation
}
```

After adding any of these configurations, restart your Spring Boot application.