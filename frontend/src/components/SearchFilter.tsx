import React from 'react'
import { Input, Select, DatePicker, Button, Space, Form } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'

export interface FilterField {
  key: string
  label: string
  type: 'input' | 'select' | 'date-range'
  options?: { label: string; value: string | number }[]
  placeholder?: string
}

interface SearchFilterProps {
  fields: FilterField[]
  onSearch: (values: Record<string, any>) => void
  onReset?: () => void
  showSearch?: boolean
  searchPlaceholder?: string
  initialValues?: Record<string, any>
}

const { RangePicker } = DatePicker

const SearchFilter: React.FC<SearchFilterProps> = ({
  fields,
  onSearch,
  onReset,
  showSearch = true,
  searchPlaceholder = '请输入关键词搜索',
  initialValues,
}) => {
  const [form] = Form.useForm()

  const handleSearch = () => {
    const values = form.getFieldsValue()
    onSearch(values)
  }

  const handleReset = () => {
    form.resetFields()
    onReset?.()
  }

  return (
    <Form
      form={form}
      layout="inline"
      initialValues={initialValues}
      style={{ marginBottom: 16, rowGap: 8 }}
    >
      {showSearch && (
        <Form.Item name="keyword">
          <Input
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 240 }}
          />
        </Form.Item>
      )}
      {fields.map((field) => (
        <Form.Item key={field.key} name={field.key} label={field.label}>
          {field.type === 'input' && (
            <Input placeholder={field.placeholder || `请输入${field.label}`} allowClear style={{ width: 180 }} />
          )}
          {field.type === 'select' && (
            <Select
              placeholder={field.placeholder || `请选择${field.label}`}
              allowClear
              style={{ width: 160 }}
              options={field.options}
            />
          )}
          {field.type === 'date-range' && <RangePicker style={{ width: 260 }} />}
        </Form.Item>
      ))}
      <Form.Item>
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

export default SearchFilter
