import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Select,
  Button,
  Tag,
  Typography,
  Modal,
  Upload,
  message,
  Space,
  Empty,
  Popconfirm,
} from 'antd';
import {
  UploadOutlined,
  FileOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { documentsApi } from '@/api/documents';
import { shipmentsApi } from '@/api/shipments';
import { DOC_TYPES } from '@/utils/constants';
import { formatDateTime } from '@/utils/helpers';
import { useAppStore } from '@/store';
import type { Document, DocType, Shipment } from '@/types';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload';

const { Text, Title } = Typography;

const DocumentList = () => {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocType>('commercial_invoice');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const fetchShipments = useCallback(async () => {
    try {
      const response = await shipmentsApi.getList({ page: 1, size: 50 });
      setShipments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch shipments', err);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!selectedShipmentId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    try {
      const data = await documentsApi.getByShipment(selectedShipmentId);
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  }, [selectedShipmentId]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning(t('documents.selectFileHint'));
      return;
    }
    if (!selectedShipmentId) {
      message.warning(t('documents.selectShipmentHint'));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileList[0] as RcFile);
      formData.append('shipmentId', String(selectedShipmentId));
      formData.append('docType', selectedDocType);

      await documentsApi.upload(formData);
      message.success(t('documents.uploadSuccess'));
      setUploadModalOpen(false);
      setFileList([]);
      fetchDocuments();
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('documents.uploadFailed');
      message.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await documentsApi.delete(id);
      message.success(t('documents.deleteSuccess'));
      fetchDocuments();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t('documents.deleteFailed'));
    }
  };

  const handleVerify = async (id: number) => {
    try {
      await documentsApi.verify(id);
      message.success(t('documents.verifySuccess'));
      fetchDocuments();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t('documents.verifyFailed'));
    }
  };

  const columns = [
    {
      title: t('documents.columns.fileType'),
      dataIndex: 'docType',
      key: 'docType',
      width: 140,
      render: (type: DocType) => (
        <Space>
          <FileOutlined className="text-blue-500" />
          <Text>{t(`documentType.${type}`) !== `documentType.${type}` ? t(`documentType.${type}`) : type}</Text>
        </Space>
      ),
    },
    {
      title: t('documents.columns.fileName'),
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: t('documents.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'default',
          uploaded: 'processing',
          approved: 'success',
          expired: 'error',
        };
        const labelMap: Record<string, string> = {
          pending: t('documents.status.pending'),
          uploaded: t('documents.status.uploaded'),
          approved: t('documents.status.approved'),
          expired: t('documents.status.expired'),
        };
        return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>;
      },
    },
    {
      title: t('documents.columns.uploadTime'),
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 160,
      render: (date: string) => (date ? formatDateTime(date) : '-'),
    },
    {
      title: t('documents.columns.verifiedBy'),
      key: 'verifiedBy',
      width: 100,
      render: (_: unknown, record: Document) =>
        record.verifiedBy ? (
          <Tag color="success">{t('documents.status.verified')}</Tag>
        ) : (
          <Tag>{t('documents.status.pendingVerify')}</Tag>
        ),
    },
    {
      title: t('common.operate'),
      key: 'action',
      width: 200,
      render: (_: unknown, record: Document) => (
        <Space>
          {record.fileUrl && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              href={record.fileUrl}
              target="_blank"
            >
              {t('common.view')}
            </Button>
          )}
          {user?.role === 'admin' && record.status === 'uploaded' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleVerify(record.id)}
            >
              {t('common.verify')}
            </Button>
          )}
          <Popconfirm
            title={t('documents.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={4} className="m-0">
          {t('documents.title')}
        </Title>
        <Text type="secondary">{t('documents.description')}</Text>
      </div>

      <Card className="rounded-xl shadow-sm mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Text strong>{t('documents.selectShipment')}</Text>
            <Select
              placeholder={t('documents.selectShipmentPlaceholder')}
              value={selectedShipmentId}
              onChange={setSelectedShipmentId}
              allowClear
              showSearch
              className="w-64"
              optionFilterProp="label"
              options={shipments.map((s) => ({
                value: s.id,
                label: `${s.shipmentId} - ${s.origin} → ${s.destination}`,
              }))}
            />
          </div>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalOpen(true)}
            disabled={!selectedShipmentId}
          >
            {t('documents.uploadFile')}
          </Button>
        </div>
      </Card>

      <Card className="rounded-xl shadow-sm">
        {!selectedShipmentId ? (
          <Empty description={t('common.selectShipment')} />
        ) : (
          <Table
            dataSource={documents}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="middle"
          />
        )}
      </Card>

      <Modal
        title={t('documents.uploadTitle')}
        open={uploadModalOpen}
        onCancel={() => {
          setUploadModalOpen(false);
          setFileList([]);
        }}
        onOk={handleUpload}
        confirmLoading={uploading}
        okText={t('documents.uploadFile')}
        cancelText={t('common.cancel')}
      >
        <div className="py-4">
          <div className="mb-4">
            <Text strong className="block mb-2">
              {t('documents.fileType')}
            </Text>
            <Select
              value={selectedDocType}
              onChange={setSelectedDocType}
              className="w-full"
              options={Object.entries(DOC_TYPES).map(([key]) => ({
                value: key,
                label: t(`documentType.${key}`),
              }))}
            />
          </div>
          <div>
            <Text strong className="block mb-2">
              {t('documents.selectFile')}
            </Text>
            <Upload
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={(file) => {
                setFileList([file]);
                return false;
              }}
              maxCount={1}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
            >
              <Button icon={<UploadOutlined />}>{t('documents.selectFile')}</Button>
            </Upload>
            <Text type="secondary" className="text-xs mt-1 block">
              {t('documents.fileTypes')}
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentList;
