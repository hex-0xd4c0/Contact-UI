import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  List,
  Typography,
  Spin,
  Alert as AntAlert,
  Button,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  RiseOutlined,
  CarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { dashboardApi } from '@/api/dashboard';
import { SHIPMENT_STATUS, ROUTES } from '@/utils/constants';
import { getStatusColor } from '@/utils/helpers';
import type { DashboardMetrics, Shipment, Alert } from '@/types';

const { Text, Title } = Typography;

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsData, shipmentsData, alertsData] = await Promise.all([
        dashboardApi.getMetrics(),
        dashboardApi.getRecentShipments(5),
        dashboardApi.getRecentAlerts(5),
      ]);
      setMetrics(metricsData);
      setRecentShipments(shipmentsData);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const shipmentColumns = [
    {
      title: t('dashboard.shipmentId'),
      dataIndex: 'shipmentId',
      key: 'shipmentId',
      render: (id: string, record: Shipment) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => navigate(`${ROUTES.TRACKING}/${record.id}`)}
        >
          {id}
        </Button>
      ),
    },
    {
      title: t('dashboard.route'),
      key: 'route',
      render: (_: unknown, record: Shipment) => (
        <Text>
          {record.origin} → {record.destination}
        </Text>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {t(`shipment.status.${status}`) !== `shipment.status.${status}`
            ? t(`shipment.status.${status}`)
            : status}
        </Tag>
      ),
    },
    {
      title: t('dashboard.eta'),
      dataIndex: 'eta',
      key: 'eta',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={4} className="m-0">
            {t('dashboard.title')}
          </Title>
          <Text type="secondary">{t('dashboard.welcome')}</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchDashboardData} loading={loading}>
          {t('common.refresh')}
        </Button>
      </div>

      {/* Metrics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="rounded-xl shadow-sm cursor-pointer"
            onClick={() => navigate(`${ROUTES.TRACKING}?status=`)}
          >
            <Statistic
              title={t('dashboard.totalShipments')}
              value={metrics?.totalShipments ?? 0}
              prefix={<RiseOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="rounded-xl shadow-sm cursor-pointer"
            onClick={() => navigate(`${ROUTES.TRACKING}?status=in_transit`)}
          >
            <Statistic
              title={t('dashboard.inTransit')}
              value={metrics?.inTransit ?? 0}
              prefix={<CarOutlined className="text-cyan-500" />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="rounded-xl shadow-sm cursor-pointer"
            onClick={() => navigate(`${ROUTES.TRACKING}?status=delayed`)}
          >
            <Statistic
              title={t('dashboard.delayed')}
              value={metrics?.delayed ?? 0}
              prefix={<WarningOutlined className="text-red-500" />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="rounded-xl shadow-sm cursor-pointer"
            onClick={() => navigate(`${ROUTES.TRACKING}?status=delivered`)}
          >
            <Statistic
              title={t('dashboard.delivered')}
              value={metrics?.delivered ?? 0}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                metrics?.percentChange != null ? (
                  <Text
                    type={metrics.percentChange >= 0 ? 'success' : 'danger'}
                    className="text-sm"
                  >
                    {metrics.percentChange >= 0 ? '+' : ''}
                    {metrics.percentChange}%
                  </Text>
                ) : null
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Shipments */}
        <Col xs={24} lg={16}>
          <Card
            title={t('dashboard.recentShipments')}
            className="rounded-xl shadow-sm"
            extra={
              <Button
                type="link"
                icon={<RightOutlined />}
                onClick={() => navigate(ROUTES.TRACKING)}
              >
                {t('dashboard.viewAll')}
              </Button>
            }
          >
            <Table
              dataSource={recentShipments}
              columns={shipmentColumns}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="middle"
            />
          </Card>
        </Col>

        {/* Alerts */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <WarningOutlined className="text-orange-500 mr-2" />
                {t('dashboard.realTimeAlerts')}
              </span>
            }
            className="rounded-xl shadow-sm"
            extra={
              <Button
                type="link"
                icon={<RightOutlined />}
                onClick={() => navigate(ROUTES.RISK_ALERTS)}
              >
                {t('dashboard.viewAll')}
              </Button>
            }
          >
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircleOutlined className="text-3xl mb-2" />
                <p className="m-0">{t('common.noAlerts')}</p>
              </div>
            ) : (
              <List
                dataSource={alerts}
                loading={loading}
                renderItem={(alert) => (
                  <List.Item className="px-0">
                    <AntAlert
                      type={
                        alert.severity === 'high'
                          ? 'error'
                          : alert.severity === 'medium'
                          ? 'warning'
                          : 'info'
                      }
                      showIcon
                      message={
                        <div>
                          <Text strong className="text-sm">
                            {alert.title}
                          </Text>
                          <br />
                          <Text type="secondary" className="text-xs">
                            {alert.description}
                          </Text>
                        </div>
                      }
                      className="w-full"
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
