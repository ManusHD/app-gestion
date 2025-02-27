package com.manushd.app.autenticacion.util;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginAttemptService {

    private final int MAX_ATTEMPT = 5;
    private ConcurrentHashMap<String, Integer> attemptsCache = new ConcurrentHashMap<>();

    public void loginSucceeded(String key) {
        attemptsCache.remove(key);
    }

    public void loginFailed(String key) {
        int attempts = attemptsCache.getOrDefault(key, 0);
        attempts++;
        attemptsCache.put(key, attempts);
    }

    public boolean isBlocked(String key) {
        return attemptsCache.getOrDefault(key, 0) >= MAX_ATTEMPT;
    }
}
