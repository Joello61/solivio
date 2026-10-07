package com.solivio.api.shared.exception;

/**
 * Trop de tentatives sur une operation sensible (connexion, code) : repondu en 429.
 */
public class TropDeTentativesException extends RuntimeException {

    public TropDeTentativesException(String message) {
        super(message);
    }
}
