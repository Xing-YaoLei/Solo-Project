import { get, post, put, del } from '@/utils/request'
import type {
  PagedResult,
  TodoTaskDto,
  TodoQueryDto,
  CreateTodoTaskDto,
  UpdateTodoTaskDto,
  TodoStatus,
} from '@/types'

export const todoApi = {
  getList: (params: TodoQueryDto): Promise<PagedResult<TodoTaskDto>> => {
    return get<PagedResult<TodoTaskDto>>('/todotasks', { params })
  },

  getDetail: (id: string): Promise<TodoTaskDto> => {
    return get<TodoTaskDto>(`/todotasks/${id}`)
  },

  create: (data: CreateTodoTaskDto): Promise<TodoTaskDto> => {
    return post<TodoTaskDto>('/todotasks', data)
  },

  update: (id: string, data: UpdateTodoTaskDto): Promise<TodoTaskDto> => {
    return put<TodoTaskDto>(`/todotasks/${id}`, data)
  },

  delete: (id: string): Promise<void> => {
    return del<void>(`/todotasks/${id}`)
  },

  updateStatus: (id: string, status: TodoStatus): Promise<void> => {
    return put<void>(`/todotasks/${id}/status`, { status })
  },

  complete: (id: string, result?: string): Promise<void> => {
    const params = result ? { result } : undefined
    return put<void>(`/todotasks/${id}/complete`, undefined, { params })
  },

  getMyTodos: (params: TodoQueryDto): Promise<PagedResult<TodoTaskDto>> => {
    return get<PagedResult<TodoTaskDto>>('/todotasks/mine', { params })
  },

  getByOrderId: (orderId: string): Promise<TodoTaskDto[]> => {
    return get<TodoTaskDto[]>(`/todotasks/order/${orderId}`)
  },
}

export default todoApi
