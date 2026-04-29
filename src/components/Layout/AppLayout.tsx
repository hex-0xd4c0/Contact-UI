import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <Header collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
