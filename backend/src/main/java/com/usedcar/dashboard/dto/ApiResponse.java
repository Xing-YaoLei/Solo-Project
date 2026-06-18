package com.usedcar.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer code;
    private String message;
    private T data;
    private String timestamp;
    private String traceId;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ApiResponse() {
    }

    public ApiResponse(Integer code, String message, T data, String timestamp, String traceId) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = timestamp;
        this.traceId = traceId;
    }

    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public static <T> ApiResponse<T> success() {
        return success(null);
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(
                200,
                "success",
                data,
                LocalDateTime.now(ZoneId.of("Asia/Shanghai")).format(FORMATTER),
                UUID.randomUUID().toString().replace("-", "").substring(0, 16)
        );
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(
                code,
                message,
                null,
                LocalDateTime.now(ZoneId.of("Asia/Shanghai")).format(FORMATTER),
                UUID.randomUUID().toString().replace("-", "").substring(0, 16)
        );
    }

    public static <T> ApiResponse<T> unauthorized() {
        return error(401, "登录已过期，请重新登录");
    }

    public static <T> ApiResponse<T> forbidden() {
        return error(403, "无权限访问该资源");
    }
}
