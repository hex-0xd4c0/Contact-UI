import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  CarryOutOutlined,
  CalculatorOutlined,
  FileOutlined,
  AlertOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { ROUTES } from '@/utils/constants';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar = ({ collapsed, onCollapse }: SidebarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = '/' + location.pathname.split('/')[1];

  const menuItems = [
    { key: ROUTES.DASHBOARD, icon: <DashboardOutlined />, label: t('layout.dashboard') },
    { key: ROUTES.TRACKING, icon: <CarryOutOutlined />, label: t('layout.tracking') },
    { key: ROUTES.COST_CALCULATOR, icon: <CalculatorOutlined />, label: t('layout.costCalculator') },
    { key: ROUTES.DOCUMENTS, icon: <FileOutlined />, label: t('layout.documents') },
    { key: ROUTES.RISK_ALERTS, icon: <AlertOutlined />, label: t('layout.riskAlerts') },
    { key: ROUTES.SETTINGS, icon: <SettingOutlined />, label: t('layout.settings') },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={240}
      trigger={null}
      style={{
        overflow: 'auto',
        height: '100vh',
        background: '#fff',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-100">
        <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;
