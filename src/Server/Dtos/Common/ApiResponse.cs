namespace SiteSchedule.Dtos.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public int Code { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "操作成功")
    {
        return new ApiResponse<T> { Success = true, Data = data, Message = message, Code = 200 };
    }

    public static ApiResponse<T> Fail(string message, int code = 400)
    {
        return new ApiResponse<T> { Success = false, Message = message, Code = code };
    }
}

public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse Ok(string message = "操作成功")
    {
        return new ApiResponse { Success = true, Message = message, Code = 200 };
    }

    public new static ApiResponse Fail(string message, int code = 400)
    {
        return new ApiResponse { Success = false, Message = message, Code = code };
    }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class PagedQuery
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortField { get; set; }
    public string? SortOrder { get; set; } = "desc";
}
