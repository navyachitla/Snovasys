package com.balancevault.config;

import com.balancevault.entity.Role;
import com.balancevault.entity.User;
import com.balancevault.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${balancevault.bootstrap.admin.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${balancevault.bootstrap.admin.email:admin@balancevault.com}")
    private String adminEmail;

    @Value("${balancevault.bootstrap.admin.name:System Administrator}")
    private String adminName;

    @Value("${balancevault.bootstrap.admin.password:Admin@Vault2026!}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!bootstrapEnabled) {
            return;
        }

        long adminCount = userRepository.countByRole(Role.ADMIN);
        if (adminCount == 0) {
            log.info("===============================================================");
            log.info("BALANCEVAULT: Bootstrapping initial Administrator account...");
            User admin = new User(
                    adminEmail,
                    passwordEncoder.encode(adminPassword),
                    adminName,
                    Role.ADMIN
            );
            userRepository.save(admin);
            log.info("BALANCEVAULT: Admin successfully created!");
            log.info("Email:    {}", adminEmail);
            log.info("Role:     {}", Role.ADMIN);
            log.info("Password: [Configured via ADMIN_BOOTSTRAP_PASSWORD]");
            log.info("===============================================================");
        } else {
            log.info("BALANCEVAULT: Administrator account already exists (Count: {}). Skipping bootstrap.", adminCount);
        }
    }
}
