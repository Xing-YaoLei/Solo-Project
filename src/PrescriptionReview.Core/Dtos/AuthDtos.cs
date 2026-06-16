namespace PrescriptionReview.Core.Dtos;

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpireAt { get; set; }
    public UserDto User { get; set; } = new();
}
