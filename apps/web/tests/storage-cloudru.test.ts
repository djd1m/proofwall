import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

beforeEach(() => {
  vi.resetModules();
  for (const [key, value] of Object.entries({
    S3_ENDPOINT: 'https://s3.cloud.ru', S3_REGION: 'ru-central-1',
    S3_FORCE_PATH_STYLE: 'false', S3_BUCKET: 'proofwall', S3_PHOTO_BUCKET: 'proofwall',
    S3_ACCESS_KEY: 'test-tenant:test-key', S3_SECRET_KEY: 'test-secret-not-a-real-credential',
  })) vi.stubEnv(key, value);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('Cloud.ru S3 compatibility without network access', () => {
  it('signs the existing object key with Cloud.ru host, region and expiration', async () => {
    const storage = await import('../src/lib/storage');
    const client = storage.s3Client();
    const key = '11111111-1111-1111-1111-111111111111/video.webm';
    const url = new URL(await getSignedUrl(client,
      new GetObjectCommand({ Bucket: storage.VIDEO_BUCKET, Key: key }), { expiresIn: 600 }));
    expect(url.hostname).toBe('proofwall.s3.cloud.ru');
    expect(url.pathname).toBe('/' + key);
    expect(url.searchParams.get('X-Amz-Credential')).toContain('/ru-central-1/s3/aws4_request');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('600');
    expect(storage.PHOTO_BUCKET).toBe(storage.VIDEO_BUCKET);
    expect(await client.config.responseChecksumValidation()).toBe('WHEN_REQUIRED');
    client.destroy();
  });

  it('uploads unchanged bytes without optional checksums and reads the private photo', async () => {
    const storage = await import('../src/lib/storage');
    const client = storage.s3Client();
    const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const requests: Array<{ hostname: string; path: string; headers: Record<string, string>; body?: unknown }> = [];
    vi.spyOn(client.config.requestHandler, 'handle').mockImplementation(async request => {
      requests.push(request);
      return { response: { statusCode: 200, headers: { 'content-type': 'image/png' }, body: Readable.from([bytes]) } };
    });
    const project = '11111111-1111-1111-1111-111111111111';
    const first = await storage.uploadPhoto(project, bytes, 'image/png');
    const second = await storage.uploadPhoto(project, bytes, 'image/png');
    expect(first).not.toBe(second);
    expect(first).toMatch(new RegExp(`^${project}/[0-9a-f-]{36}\\.png$`));
    expect(Buffer.from(await storage.readPhoto(first) ?? [])).toEqual(bytes);
    expect(requests).toHaveLength(3);
    expect(requests[0]?.hostname).toBe('proofwall.s3.cloud.ru');
    expect(requests[0]?.path).toBe('/' + first);
    expect(Buffer.from(requests[0]?.body as Uint8Array)).toEqual(bytes);
    expect(Object.keys(requests[0]?.headers ?? {}).some(name => /^x-amz-(checksum|trailer)/i.test(name))).toBe(false);
    expect(requests[0]?.headers['x-amz-acl']).toBeUndefined();
    client.destroy();
  });

  it('keeps legacy MinIO path-style when the setting is absent', async () => {
    vi.stubEnv('S3_FORCE_PATH_STYLE', undefined);
    vi.stubEnv('S3_ENDPOINT', 'http://localhost:9000');
    const storage = await import('../src/lib/storage');
    const client = storage.s3Client();
    const url = new URL(await getSignedUrl(client,
      new GetObjectCommand({ Bucket: 'proofwall', Key: 'project/video.mp4' }), { expiresIn: 600 }));
    expect(url.host).toBe('localhost:9000');
    expect(url.pathname).toBe('/proofwall/project/video.mp4');
    client.destroy();
  });

  it('preserves infrastructure errors as StorageError', async () => {
    const storage = await import('../src/lib/storage');
    const client = storage.s3Client();
    vi.spyOn(client.config.requestHandler, 'handle').mockRejectedValue(new Error('transport offline'));
    await expect(storage.uploadPhoto('project', new Uint8Array([1]), 'image/png')).rejects.toBeInstanceOf(storage.StorageError);
    client.destroy();
  });

  it('never reads video or non-image content through the photo route', async () => {
    const photoRoute = await import('../src/app/api/photo/[...key]/route');
    const storage = await import('../src/lib/storage');
    const project = '11111111-1111-1111-1111-111111111111';
    const object = '22222222-2222-2222-2222-222222222222';
    const video = await photoRoute.GET(new Request('https://example.test'),
      { params: Promise.resolve({ key: [project, object + '.mp4'] }) });
    expect(video.status).toBe(404);
    const client = storage.s3Client();
    const handle = vi.spyOn(client.config.requestHandler, 'handle').mockResolvedValue({
      response: { statusCode: 200, headers: {}, body: Readable.from([Buffer.from('<html>not an image</html>')]) },
    });
    const image = await photoRoute.GET(new Request('https://example.test'),
      { params: Promise.resolve({ key: [project, object + '.png'] }) });
    expect(image.status).toBe(404);
    expect(handle).toHaveBeenCalledOnce();
    client.destroy();
  });
});
