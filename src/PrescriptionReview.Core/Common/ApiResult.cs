namespace PrescriptionReview.Core.Common;

public class ApiResult<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public int Code { get; set; }

    public static ApiResult<T> Ok(T data, string message = "操作成功")
    {
        return new ApiResult<T> { Success = true, Data = data, Message = message, Code = 200 };
    }

    public static ApiResult<T> Fail(string message, int code = 400)
    {
        return new ApiResult<T> { Success = false, Message = message, Code = code };
    }
}

public class ApiResult : ApiResult<object>
{
    public static ApiResult Ok(string message = "操作成功")
    {
        return new ApiResult { Success = true, Message = message, Code = 200 };
    }

    public new static ApiResult Fail(string message, int code = 400)
    {
        return new ApiResult { Success = false, Message = message, Code = code };
    }
}
