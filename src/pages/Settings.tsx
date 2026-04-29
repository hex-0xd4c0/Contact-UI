import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Divider,
  Descriptions,
  Space,
  Tag,
  Select,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  BankOutlined,
  MailOutlined,
  SaveOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';

const { Text, Title } = Typography;

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAppStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSave = async (values: { companyName: string }) => {
    setProfileLoading(true);
    try {
      // TODO: Implement profile update API call
      // await userApi.updateProfile(values);
      message.success(t('settings.profileSaved'));
    } catch (err: any) {
      message.error(err?.response?.data?.message || t('settings.profileFailed'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setPasswordLoading(true);
    try {
      // TODO: Implement password change API call
      // await userApi.changePassword(values);
      message.success(t('settings.passwordChanged'));
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t('settings.passwordFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={4} className="m-0">
          {t('settings.title')}
        </Title>
        <Text type="secondary">{t('settings.description')}</Text>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Language Section */}
        <Card
          title={
            <span>
              <GlobalOutlined className="mr-2" />
              {t('settings.language')}
            </span>
          }
          className="rounded-xl shadow-sm"
        >
          <div className="flex items-center gap-4">
            <Text strong>{t('settings.languageLabel')}：</Text>
            <Select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="w-40"
              options={[
                { value: 'zh-CN', label: t('settings.zhCN') },
                { value: 'en-US', label: t('settings.enUS') },
                { value: 'bn-BD', label: t('settings.bnBD') },
              ]}
            />
          </div>
        </Card>

        {/* Profile Section */}
        <Card
          title={
            <span>
              <UserOutlined className="mr-2" />
              {t('settings.profile')}
            </span>
          }
          className="rounded-xl shadow-sm"
        >
          <Descriptions column={1} className="mb-6" size="small">
            <Descriptions.Item label={t('settings.email')}>
              <Space>
                <MailOutlined className="text-gray-400" />
                <Text>{user?.email}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('settings.role')}>
              <Tag color={user?.role === 'admin' ? 'red' : 'blue'}>
                {user?.role === 'admin' ? t('auth.admin') : t('auth.customer')}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileSave}
            initialValues={{ companyName: user?.companyName || '' }}
            size="large"
          >
            <Form.Item
              name="companyName"
              label={t('settings.companyName')}
              rules={[
                { required: true, message: t('auth.companyNameRequired') },
                { min: 2, message: t('auth.companyNameMin') },
              ]}
            >
              <Input
                prefix={<BankOutlined className="text-gray-400" />}
                placeholder={t('settings.companyName')}
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={profileLoading}
                icon={<SaveOutlined />}
              >
                {t('settings.saveProfile')}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Password Section */}
        <Card
          title={
            <span>
              <LockOutlined className="mr-2" />
              {t('settings.password')}
            </span>
          }
          className="rounded-xl shadow-sm"
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            size="large"
          >
            <Form.Item
              name="currentPassword"
              label={t('settings.currentPassword')}
              rules={[
                { required: true, message: t('settings.currentPasswordRequired') },
                { min: 6, message: t('auth.passwordMin') },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder={t('settings.currentPassword')}
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label={t('settings.newPassword')}
              rules={[
                { required: true, message: t('settings.newPasswordRequired') },
                { min: 6, message: t('auth.passwordMin') },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder={t('settings.newPassword')}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={t('settings.confirmNewPassword')}
              dependencies={['newPassword']}
              rules={[
                { required: true, message: t('settings.confirmNewPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('auth.passwordMismatch')));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder={t('settings.confirmNewPassword')}
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordLoading}
                icon={<SaveOutlined />}
              >
                {t('settings.changePassword')}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
