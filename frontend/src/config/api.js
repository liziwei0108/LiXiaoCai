// API 配置
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// 构建完整 API URL
export function getApiUrl(path) {
  // 如果 path 已经是完整 URL，直接返回
  if (path.startsWith('http')) {
    return path;
  }
  // 确保 path 以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export { API_BASE_URL };
export default API_BASE_URL;
