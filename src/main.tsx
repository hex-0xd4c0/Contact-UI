import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import App from './App';
import './index.css';
import './i18n';

const antdLocales: Record<string, any> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'bn-BD': enUS, // Ant Design does not have bn_BD locale, fallback to English
};

const AppWithLocale = () => {
  const [locale, setLocale] = React.useState(() => {
    return localStorage.getItem('i18nextLng') || navigator.language || 'zh-CN';
  });

  React.useEffect(() => {
    const handleStorage = () => {
      setLocale(localStorage.getItem('i18nextLng') || 'zh-CN');
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => {
      const current = localStorage.getItem('i18nextLng') || 'zh-CN';
      if (current !== locale) setLocale(current);
    }, 500);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [locale]);

  return (
    <ConfigProvider
      locale={antdLocales[locale] || zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithLocale />
  </React.StrictMode>
);
