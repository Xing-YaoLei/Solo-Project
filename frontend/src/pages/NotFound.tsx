import { Link } from '@tanstack/react-router';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <p className="text-xl font-medium text-gray-600 mt-4">页面未找到</p>
        <p className="text-gray-500 mt-2">抱歉，您访问的页面不存在</p>
        <Link
          to="/"
          className="inline-block mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
