package com.imagesearch.backend_java.tryon.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class TryOnException extends RuntimeException {
    private final String code;
    private final HttpStatus httpStatus;

    public TryOnException(String code, String message, HttpStatus httpStatus) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }
}
