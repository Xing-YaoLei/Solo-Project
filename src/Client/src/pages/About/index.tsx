import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

function About() {
  return (
    <div style={{ padding: '24px' }}>
      <Card title="关于">
        <Typography>
          <Title level={3}>站点调度管理系统</Title>
          <Paragraph>
            这是一个基于 React + TypeScript + Vite 构建的前端应用。
          </Paragraph>
          <Paragraph>
            技术栈：
            <ul>
              <li>React 19</li>
              <li>TypeScript</li>
              <li>Vite</li>
              <li>Ant Design</li>
              <li>React Router</li>
              <li>Axios</li>
              <li>Day.js</li>
            </ul>
          </Paragraph>
        </Typography>
      </Card>
    </div>
  )
}

export default About
