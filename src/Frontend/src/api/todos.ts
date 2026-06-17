import { get, post, put, del } from '@/utils/request'
import type {
  PagedResult,
  TodoTaskDto,
  TodoQueryDto,
  CreateTodoTaskDto,
  UpdateTodoTaskDto,
} from '@/types'

export const todoApi = {
  getList: (params: TodoQueryDto): Promise<PagedResult<TodoTaskDto>> => {
    return get<PagedResult<TodoTaskDto>>('/todos', { params })
  },

  getDetail: (id: string): Promise<TodoTaskDto> => {
    return get<TodoTaskDto>(`/todos/${id}`)
  },

  create: (data: CreateTodoTaskDto): Promise<TodoTaskDto> => {
    return post<TodoTaskDto>('/todos', data)
  },

  update: (id: string, data: UpdateTodoTaskDto): Promise<TodoTaskDto> => {
    return put<TodoTaskDto>(`/todos/${id}`, data)
  },

  delete: (id: string): Promise<void> => {
    return del<void>(`/todos/${id}`)
  },

  updateStatus: (id: string, status: number): Promise<TodoTaskDto> => {
    return put<TodoTaskDto>(`/todos/${id}/status`, { status })
  },

  complete: (id: string, result?: string): Promise<TodoTaskDto> => {
    return put<TodoTaskDto>(`/todos/${id}/complete`, { result })
  },

  getMyTodos: (params: TodoQueryDto): Promise<PagedResult<TodoTaskDto>> => {
    return get<PagedResult<TodoTaskDto>>('/todos/mine', { params })
  },

  getByOrderId: (orderId: string): Promise<TodoTaskDto[]> => {
    return get<TodoTaskDto[]>(`/todos/order/${orderId}`)
  },
}

export default todoApi
