import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Tag,
  Select,
  Button,
  Typography,
  Space,
  Input,
  message,
  Popconfirm,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { alertsApi } from '@/api/alerts';
import { ALERT_SEVERITY } from '@/utils/constants';
import { useAppStore } from '@/store';
import type { Alert, FilterParams } from '@/types';

const { Text, Title } = Typography;

const RiskAlerts = () => {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    size: 10,
  });
  const [searchShipmentId, setSearchShipmentId] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params: FilterParams = {
        page: filters.page || 1,
        size: filters.size || 10,
      };
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.shipmentId) params.shipmentId = filters.shipmentId;

      const response = await alertsApi.getList(params);
      setAlerts(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      shipmentId: searchShipmentId || undefined,
      page: 1,
    }));
  };

  const handleReset = () => {
    setSearchShipmentId('');
    setFilters({ page: 1, size: 10 });
  };

  const handleAcknowledge = async (id: number) => {
    try {
      await alertsApi.acknowledge(id);
      message.success(t('alerts.acknowledgeSuccess'));
      fetchAlerts();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t('alerts.operateFailed'));
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await alertsApi.resolve(id);
      message.success(t('alerts.resolveSuccess'));
      fetchAlerts();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t('alerts.operateFailed'));
    }
  };

  const columns = [
    {
      title: t('alerts.columns.severity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => {
        const info = ALERT_SEVERITY[severity as keyof typeof ALERT_SEVERITY];
        return (
          <Tag color={info?.color || 'default'}>
            {t(`alerts.severity.${severity}`)}
          </Tag>
        );
      },
    },
    {
      title: t('alerts.columns.title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (title: string, record: Alert) => (
        <div className="truncate flex items-center gap-1.5" title={title}>
          <WarningOutlined
            className={`shrink-0 ${
              record.severity === 'high'
                ? 'text-red-500'
                : record.severity === 'medium'
                ? 'text-orange-500'
                : 'text-blue-500'
            }`}
          />
          <span className="font-semibold truncate">{title}</span>
        </div>
      ),
    },
    {
      title: t('alerts.columns.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('alerts.columns.relatedStage'),
      dataIndex: 'relatedStage',
      key: 'relatedStage',
      width: 120,
      render: (stage: string) => <Tag>{stage || '-'}</Tag>,
    },
    {
      title: t('alerts.columns.detectedAt'),
      dataIndex: 'detectedAt',
      key: 'detectedAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('alerts.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: 'error',
          acknowledged: 'warning',
          resolved: 'success',
        };
        const labelMap: Record<string, string> = {
          active: t('alerts.status.active'),
          acknowledged: t('alerts.status.acknowledged'),
          resolved: t('alerts.status.resolved'),
        };
        return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
      },
    },
    {
      title: t('common.operate'),
      key: 'action',
      width: 180,
      render: (_: unknown, record: Alert) => (
        <Space>
          {record.status === 'active' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleAcknowledge(record.id)}
            >
              {t('common.acknowledge')}
            </Button>
          )}
          {user?.role === 'admin' && record.status !== 'resolved' && (
            <Popconfirm
              title={t('alerts.resolveConfirm')}
              onConfirm={() => handleResolve(record.id)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                {t('common.resolve')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={4} className="m-0">
          {t('alerts.title')}
        </Title>
        <Text type="secondary">{t('alerts.description')}</Text>
      </div>

      <Card className="mb-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            placeholder={t('alerts.searchPlaceholder')}
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchShipmentId}
            onChange={(e) => setSearchShipmentId(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            className="w-48"
          />
          <Select
            placeholder={t('alerts.severityFilter')}
            value={filters.severity}
            onChange={(val) =>
              setFilters((prev) => ({
                ...prev,
                severity: val === '__all__' ? undefined : val,
                page: 1,
              }))
            }
            allowClear
            className="w-32"
            options={[
              { value: '__all__', label: t('common.unfiltered') },
              ...Object.entries(ALERT_SEVERITY).map(([key]) => ({
                value: key,
                label: t(`alerts.severity.${key}`),
              })),
            ]}
          />
          <Select
            placeholder={t('alerts.statusFilter')}
            value={filters.status}
            onChange={(val) =>
              setFilters((prev) => ({
                ...prev,
                status: val === '__all__' ? undefined : val,
                page: 1,
              }))
            }
            allowClear
            className="w-32"
            options={[
              { value: '__all__', label: t('common.unfiltered') },
              { value: 'active', label: t('alerts.status.active') },
              { value: 'acknowledged', label: t('alerts.status.acknowledged') },
              { value: 'resolved', label: t('alerts.status.resolved') },
            ]}
          />
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              {t('common.search')}
            </Button>
            <Button icon={<FilterOutlined />} onClick={handleReset}>
              {t('common.reset')}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAlerts}
              loading={loading}
            />
          </Space>
        </div>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <Table
          dataSource={alerts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: filters.page,
            pageSize: filters.size,
            total,
            showSizeChanger: true,
            showTotal: (totalCount: number) => t('common.total', { count: totalCount }),
            onChange: (page, size) =>
              setFilters((prev) => ({ ...prev, page, size })),
          }}
          scroll={{ x: 900 }}
          size="middle"
          expandable={{
            expandedRowRender: (record: Alert) => (
              <div className="p-4 bg-gray-50 rounded-lg">
                <Text strong>{t('alerts.expandDetail')}</Text>
                <p className="mt-2 text-gray-600">{record.description}</p>
                <div className="mt-2">
                  <Text type="secondary">
                    {t('alerts.relatedStageLabel')}：{record.relatedStage || t('alerts.noStage')} | {t('alerts.columns.detectedAt')}：
                    {dayjs(record.detectedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Text>
                </div>
              </div>
            ),
            rowExpandable: () => true,
          }}
        />
      </Card>
    </div>
  );
};

export default RiskAlerts;
