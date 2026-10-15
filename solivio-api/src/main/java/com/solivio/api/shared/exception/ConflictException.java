package com.solivio.api.shared.exception;

public class ConflictException extends RuntimeException {

    public static final String CODE_PAR_DEFAUT = "CONFLICT";

    // Code stable que le client peut distinguer du conflit generique.
    private final String code;

    public ConflictException(String message) {
        this(CODE_PAR_DEFAUT, message);
    }

    public ConflictException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
