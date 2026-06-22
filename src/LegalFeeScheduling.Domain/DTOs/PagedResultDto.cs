namespace LegalFeeScheduling.Domain.DTOs;

public class PagedResultDto<T>
{
    public int TotalCount { get; set; }

    public int TotalPages { get; set; }

    public IEnumerable<T> Items { get; set; } = new List<T>();
}
