import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

router.use(authenticate);

// POST /documents/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: '请选择文件' });
      return;
    }

    const { shipmentId, docType } = req.body;
    if (!shipmentId || !docType) {
      res.status(400).json({ message: '缺少必要参数' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const result = await query(
      `INSERT INTO documents (shipment_id, doc_type, file_url, status, uploaded_by, uploaded_at)
       VALUES ($1, $2, $3, 'uploaded', $4, NOW())
       RETURNING id, shipment_id as "shipmentId", doc_type as "docType",
                 file_url as "fileUrl", status, uploaded_by as "uploadedBy",
                 uploaded_at as "uploadedAt"`,
      [parseInt(shipmentId, 10), docType, fileUrl, req.user!.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: '文件上传失败' });
  }
});

// DELETE /documents/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: '无效的文件ID' });
      return;
    }

    // Check document exists and user has permission
    const doc = await query(
      'SELECT uploaded_by FROM documents WHERE id = $1',
      [id]
    );

    if (doc.rows.length === 0) {
      res.status(404).json({ message: '文件不存在' });
      return;
    }

    // Only owner or admin can delete
    if (doc.rows[0].uploaded_by !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ message: '无权删除此文件' });
      return;
    }

    await query('DELETE FROM documents WHERE id = $1', [id]);
    res.json({ message: '文件已删除' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: '删除文件失败' });
  }
});

// PUT /documents/:id/verify
router.put('/:id/verify', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: '无效的文件ID' });
      return;
    }

    const result = await query(
      `UPDATE documents
       SET status = 'approved', verified_by = $1, verified_at = NOW()
       WHERE id = $2
       RETURNING id, shipment_id as "shipmentId", doc_type as "docType",
                 file_url as "fileUrl", status, uploaded_by as "uploadedBy",
                 uploaded_at as "uploadedAt", verified_by as "verifiedBy",
                 verified_at as "verifiedAt"`,
      [req.user!.userId, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: '文件不存在' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ message: '文件验证失败' });
  }
});

export default router;
