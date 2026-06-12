namespace ColdChainScheduler.Domain.Common;

public class ApiResponse<T>
{
    public T Data { get; set; } = default!;
    public string Message { get; set; } = string.Empty;
    public bool Success { get; set; }
}

public static class ApiResponse
{
    public static ApiResponse<T> Ok<T>(T data, string message = "操作成功") => new() { Data = data, Message = message, Success = true };
    public static ApiResponse<T> Fail<T>(string message) => new() { Data = default!, Message = message, Success = false };
    public static ApiResponse<object> Ok(string message = "操作成功") => new() { Data = new(), Message = message, Success = true };
    public static ApiResponse<object> Fail(string message) => new() { Data = new(), Message = message, Success = false };
}
