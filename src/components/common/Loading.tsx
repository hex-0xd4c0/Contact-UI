import { Spin } from 'antd';

interface LoadingProps {
  tip?: string;
}

const Loading = ({ tip = '加载中...' }: LoadingProps) => (
  <div className="flex items-center justify-center py-20">
    <Spin size="large" tip={tip} />
  </div>
);

export default Loading;
