const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const safeName = (name = 'invoice.pdf') =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'invoice.pdf';

const uploadInvoicePdf = async ({ buffer, originalName, contentType = 'application/pdf' }) => {
  const stamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const key = `invoices/${stamp}-${random}-${safeName(originalName)}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: publicBase ? `${publicBase}/${key}` : null,
  };
};

const deleteObject = async (key) => {
  if (!key) return;
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.warn('R2 delete failed:', err.message);
  }
};

// Batch delete — one API call per 1000 keys instead of one per object.
// Best-effort: a failed batch is logged, never thrown.
const deleteObjects = async (keys = []) => {
  const unique = [...new Set(keys.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 1000) {
    const chunk = unique.slice(i, i + 1000);
    try {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
        })
      );
    } catch (err) {
      console.warn(`R2 batch delete failed (${chunk.length} keys):`, err.message);
    }
  }
};

const getObjectBuffer = async (key) => {
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const getObjectStream = async (key) => {
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return res.Body;
};

const putObject = async ({ key, body, contentType }) => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return { key };
};

const getSignedGetUrl = async (key, { expiresIn = 600, downloadFilename } = {}) => {
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(downloadFilename
      ? { ResponseContentDisposition: `attachment; filename="${downloadFilename.replace(/"/g, '')}"` }
      : {}),
  });
  return getSignedUrl(client, cmd, { expiresIn });
};

const galleryPhotoKey = ({ galleryId, variant, photoId, ext = 'jpg' }) =>
  `galleries/${galleryId}/${variant}/${photoId}.${ext}`;

module.exports = {
  uploadInvoicePdf,
  deleteObject,
  deleteObjects,
  getObjectBuffer,
  getObjectStream,
  putObject,
  getSignedGetUrl,
  galleryPhotoKey,
};
