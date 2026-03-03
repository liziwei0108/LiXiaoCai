import { Pool } from 'pg';

// 从环境变量中获取数据库连接信息
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // 阿里云RDS通常需要这个设置
  },
  max: 20, // 连接池最大连接数
  idleTimeoutMillis: 30000, // 连接空闲超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
});

// 测试数据库连接
pool.connect((err, client, release) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功!');
    release();
  }
});

// 导出数据库连接池
export default pool;
