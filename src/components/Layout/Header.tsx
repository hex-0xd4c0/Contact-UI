import { Layout, Button, Dropdown, Space, Avatar, Typography, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onCollapse: () => void;
}

const Header = ({ collapsed, onCollapse }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const langList = ['zh-CN', 'en-US', 'bn-BD'];
  const langLabels: Record<string, string> = {
    'zh-CN': '中',
    'en-US': 'EN',
    'bn-BD': 'বাং',
  };
  const currentLang = i18n.language?.startsWith('zh') ? 'zh-CN' : i18n.language?.startsWith('bn') ? 'bn-BD' : 'en-US';

  const toggleLanguage = () => {
    const idx = langList.indexOf(currentLang);
    const newLang = langList[(idx + 1) % langList.length];
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };


  const items = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.companyName || 'User'} (${user?.role === 'admin' ? t('auth.admin') : t('auth.customer')})`,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div className="flex items-center gap-3">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onCollapse}
        />
        <span className="text-base font-bold text-primary-600 whitespace-nowrap">
          {t('app.title')}
        </span>
      </div>
      <Space>
        <Tooltip title={t('header.switchLanguage')}>
          <Button
            type="text"
            icon={<GlobalOutlined />}
            onClick={toggleLanguage}
          >
            {langLabels[currentLang]}
          </Button>
        </Tooltip>
        <Dropdown menu={{ items }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
            <Text>{user?.companyName || 'User'}</Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
