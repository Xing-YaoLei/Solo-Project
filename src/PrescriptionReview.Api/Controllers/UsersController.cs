using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Headquarters,StoreManager")]
public class UsersController : BaseController
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResult<UserDto>>> GetList([FromQuery] UserQueryDto query)
    {
        return await _userService.GetPagedListAsync(query);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<UserDto>> GetById(int id)
    {
        return await _userService.GetByIdAsync(id);
    }

    [HttpPost]
    [Authorize(Roles = "Headquarters")]
    public async Task<ApiResult<UserDto>> Create([FromBody] UserCreateDto dto)
    {
        return await _userService.CreateAsync(dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Headquarters")]
    public async Task<ApiResult> Update(int id, [FromBody] UserUpdateDto dto)
    {
        return await _userService.UpdateAsync(id, dto);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Headquarters")]
    public async Task<ApiResult> Delete(int id)
    {
        return await _userService.DeleteAsync(id);
    }
}
