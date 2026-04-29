import { useState } from 'react';
import { Card, Tabs, Form, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { MailOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import type { LoginRequest, RegisterRequest } from '@/types';

const Login = () => {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await login(values);
      message.success(t('auth.loginSuccess'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('auth.loginFailed');
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      await register(values);
      message.success(t('auth.registerSuccess'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('auth.registerFailed');
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Card
        className="w-full max-w-md shadow-xl rounded-2xl"
        styles={{ body: { padding: '40px 32px 24px' } }}
      >
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏍️</div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">
            {t('app.brand')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t('auth.subtitle')}
          </p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          size="large"
          items={[
            {
              key: 'login',
              label: t('auth.login'),
              children: (
                <Form
                  layout="vertical"
                  onFinish={handleLogin}
                  autoComplete="off"
                  size="large"
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: t('auth.emailRequired') },
                      { type: 'email', message: t('auth.emailInvalid') },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined className="text-gray-400" />}
                      placeholder={t('auth.email')}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: t('auth.passwordRequired') },
                      { min: 6, message: t('auth.passwordMin') },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder={t('auth.password')}
                    />
                  </Form.Item>

                  <Form.Item className="mb-0">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      className="h-10 rounded-lg font-medium"
                    >
                      {t('auth.loginTitle')}
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: t('auth.register'),
              children: (
                <Form
                  layout="vertical"
                  onFinish={handleRegister}
                  autoComplete="off"
                  size="large"
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: t('auth.emailRequired') },
                      { type: 'email', message: t('auth.emailInvalid') },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined className="text-gray-400" />}
                      placeholder={t('auth.email')}
                    />
                  </Form.Item>

                  <Form.Item
                    name="companyName"
                    rules={[
                      { required: true, message: t('auth.companyNameRequired') },
                      { min: 2, message: t('auth.companyNameMin') },
                    ]}
                  >
                    <Input
                      prefix={<BankOutlined className="text-gray-400" />}
                      placeholder={t('auth.companyName')}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: t('auth.passwordRequired') },
                      { min: 6, message: t('auth.passwordMin') },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder={t('auth.password')}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: t('auth.confirmPasswordRequired') },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error(t('auth.passwordMismatch')));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder={t('auth.confirmPassword')}
                    />
                  </Form.Item>

                  <Form.Item className="mb-0">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      className="h-10 rounded-lg font-medium"
                    >
                      {t('auth.registerTitle')}
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Login;
