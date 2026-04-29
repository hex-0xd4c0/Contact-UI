import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Timeline,
  Typography,
  Spin,
  Button,
  Row,
  Col,
  Empty,
  Alert,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import apiClient from '@/api/client';
import { SHIPMENT_STATUS, ROUTES } from '@/utils/constants';
import { getStatusColor, formatDateTime } from '@/utils/helpers';
import type { Shipment, ShipmentTimeline } from '@/types';

const { Text, Title } = Typography;

const TrackingDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [timeline, setTimeline] = useState<ShipmentTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [shipmentRes, timelineRes] = await Promise.all([
        apiClient.get<Shipment>(`/shipments/${id}`),
        apiClient.get<{ data: ShipmentTimeline[] }>(`/shipments/${id}/timeline`),
      ]);
      setShipment(shipmentRes.data);
      setTimeline(timelineRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch shipment detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(ROUTES.TRACKING)}
          className="mb-4"
        >
          {t('common.backToList')}
        </Button>
        <Card className="rounded-xl">
          <Empty description={t('tracking.detail.notFound')} />
        </Card>
      </div>
    );
  }

  const statusInfo =
    SHIPMENT_STATUS[shipment.status as keyof typeof SHIPMENT_STATUS];
  const statusLabel = t(`shipment.status.${shipment.status}`) !== `shipment.status.${shipment.status}`
    ? t(`shipment.status.${shipment.status}`)
    : shipment.status;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(ROUTES.TRACKING)}
          >
            {t('common.back')}
          </Button>
          <div>
            <Title level={4} className="m-0">
              {t('tracking.detail.title')}
            </Title>
            <Text type="secondary">{shipment.shipmentId}</Text>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchDetail} loading={loading}>
          {t('common.refresh')}
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {/* Shipment Info */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <span>
                <CarOutlined className="mr-2" />
                {t('tracking.detail.shipmentInfo')}
              </span>
            }
            className="rounded-xl shadow-sm"
          >
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label={t('tracking.shipmentId')}>
                <Text strong>{shipment.shipmentId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>
                <Tag color={getStatusColor(shipment.status)}>
                  {statusLabel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking.detail.origin')}>
                <EnvironmentOutlined className="mr-1 text-blue-500" />
                {shipment.origin}
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking.detail.destination')}>
                <EnvironmentOutlined className="mr-1 text-green-500" />
                {shipment.destination}
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking.transportMethod')}>
                <Tag>{t(`shipment.transportMethod.${shipment.transportMethod}`)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking.detail.carrier')}>
                {shipment.carrier}
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking.quantity')}>
                {shipment.quantity} {t('tracking.quantityUnit')}
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking.detail.weight')}>
                {shipment.weightKg} {t('tracking.detail.weightUnit')}
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking.currentLocation')}>
                <Text strong>{shipment.currentLocation}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking.eta')}>
                <CalendarOutlined className="mr-1" />
                {dayjs(shipment.eta).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking.detail.departureDate')}>
                {dayjs(shipment.departureDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label={t('common.createdAt')}>
                {formatDateTime(shipment.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Delay Alert */}
          {shipment.status === 'delayed' && (
            <Alert
              type="error"
              showIcon
              message={t('tracking.detail.delayAlert')}
              description={t('tracking.detail.delayDescription')}
              className="mt-4 rounded-lg"
            />
          )}
        </Col>

        {/* Timeline */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <CalendarOutlined className="mr-2" />
                {t('tracking.detail.transportTimeline')}
              </span>
            }
            className="rounded-xl shadow-sm"
          >
            {timeline.length === 0 ? (
              <Empty description={t('common.noTimeline')} />
            ) : (
              <Timeline
                mode="left"
                items={timeline.map((item) => ({
                  color:
                    item.status === 'completed'
                      ? 'green'
                      : item.status === 'current'
                      ? 'blue'
                      : 'gray',
                  dot:
                    item.status === 'current' ? (
                      <Spin size="small" />
                    ) : undefined,
                  children: (
                    <div>
                      <div className="flex items-center gap-2">
                        <Text strong className="text-sm">
                          {item.stage}
                        </Text>
                        {item.status === 'current' && (
                          <Tag color="processing" className="text-xs">
                            {t('tracking.detail.current')}
                          </Tag>
                        )}
                      </div>
                      <Text type="secondary" className="text-xs block">
                        <EnvironmentOutlined className="mr-1" />
                        {item.location}
                      </Text>
                      <Text type="secondary" className="text-xs block">
                        {formatDateTime(item.eventTime)}
                      </Text>
                      {item.notes && (
                        <Text className="text-xs text-gray-500 block mt-1">
                          {item.notes}
                        </Text>
                      )}
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TrackingDetail;
