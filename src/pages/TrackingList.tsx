import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Button,
  Space,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { shipmentsApi } from '@/api/shipments';
import { SHIPMENT_STATUS, TRANSPORT_METHODS, ROUTES } from '@/utils/constants';
import { getStatusColor } from '@/utils/helpers';
import type { Shipment, FilterParams } from '@/types';

const { Text, Title } = Typography;

const TrackingList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterParams>(() => {
    const statusFromUrl = searchParams.get('status');
    return {
      page: 1,
      size: 10,
      ...(statusFromUrl ? { status: statusFromUrl } : {}),
    };
  });
  const [searchText, setSearchText] = useState('');

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params: FilterParams = {
        page: filters.page || 1,
        size: filters.size || 10,
      };
      if (filters.status) params.status = filters.status;
      if (filters.transportMethod) params.transportMethod = filters.transportMethod;
      if (filters.shipmentId) params.shipmentId = filters.shipmentId;

      const response = await shipmentsApi.getList(params);
      setShipments(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('Failed to fetch shipments', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);


  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, shipmentId: searchText || undefined, page: 1 }));
  };

  const handleReset = () => {
    setSearchText('');
    setFilters({ page: 1, size: 10 });
  };

  const columns = [
    {
      title: t('tracking.shipmentId'),
      dataIndex: 'shipmentId',
      key: 'shipmentId',
      width: 140,
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
      title: t('tracking.route'),
      key: 'route',
      render: (_: unknown, record: Shipment) => (
        <Text>
          {record.origin}
          <Text type="secondary" className="mx-1">
            →
          </Text>
          {record.destination}
        </Text>
      ),
    },
    {
      title: t('tracking.transportMethod'),
      dataIndex: 'transportMethod',
      key: 'transportMethod',
      width: 120,
      render: (method: string) => (
        <Tag>{t(`shipment.transportMethod.${method}`)}</Tag>
      ),
    },
    {
      title: t('tracking.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (qty: number) => <Text>{qty} {t('tracking.quantityUnit')}</Text>,
    },
    {
      title: t('tracking.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {t(`shipment.status.${status}`) !== `shipment.status.${status}`
            ? t(`shipment.status.${status}`)
            : status}
        </Tag>
      ),
    },
    {
      title: t('tracking.currentLocation'),
      dataIndex: 'currentLocation',
      key: 'currentLocation',
      width: 130,
      ellipsis: true,
    },
    {
      title: t('tracking.eta'),
      dataIndex: 'eta',
      key: 'eta',
      width: 110,
      render: (date: string) => dayjs(date).format('MM-DD'),
    },
    {
      title: t('common.operate'),
      key: 'action',
      width: 80,
      render: (_: unknown, record: Shipment) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`${ROUTES.TRACKING}/${record.id}`)}
        >
          {t('common.detail')}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={4} className="m-0">
          {t('tracking.title')}
        </Title>
        <Text type="secondary">{t('tracking.description')}</Text>
      </div>

      {/* Filters */}
      <Card className="mb-4 rounded-xl shadow-sm">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder={t('tracking.searchPlaceholder')}
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder={t('tracking.statusFilter')}
              value={filters.status}
              onChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  status: val === '__all__' ? undefined : val,
                  page: 1,
                }))
              }
              allowClear
              className="w-full"
              options={[
                { value: '__all__', label: t('common.unfiltered') },
                ...Object.entries(SHIPMENT_STATUS).map(([key]) => ({
                  value: key,
                  label: t(`shipment.status.${key}`),
                })),
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder={t('tracking.transportFilter')}
              value={filters.transportMethod}
              onChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  transportMethod: val === '__all__' ? undefined : val,
                  page: 1,
                }))
              }
              allowClear
              className="w-full"
              options={[
                { value: '__all__', label: t('common.unfiltered') },
                ...TRANSPORT_METHODS.map((m) => ({
                  value: m,
                  label: t(`shipment.transportMethod.${m}`),
                })),
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                {t('common.search')}
              </Button>
              <Button icon={<FilterOutlined />} onClick={handleReset}>
                {t('common.reset')}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchShipments}
                loading={loading}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card className="rounded-xl shadow-sm">
        <Table
          dataSource={shipments}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: filters.page,
            pageSize: filters.size,
            total,
            showSizeChanger: true,
            showTotal: (totalCount: number) => `${t('common.total', { count: totalCount })}`,
            onChange: (page, size) =>
              setFilters((prev) => ({ ...prev, page, size })),
          }}
          scroll={{ x: 900 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default TrackingList;
