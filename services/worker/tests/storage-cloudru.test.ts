import { describe, expect, it } from 'vitest';
import { loadConfig, type WorkerConfig } from '../src/config.js';
import { createS3Client, generatePresignedGetUrl } from '../src/storage.js';

const environment = {
  DATABASE_URL: 'postgres://unused', S3_ENDPOINT: 'https://s3.cloud.ru',
  S3_BUCKET: 'proofwall', S3_ACCESS_KEY: 'test-tenant:test-key',
  S3_SECRET_KEY: 'test-secret-not-a-real-credential', S3_REGION: 'ru-central-1',
  TRANSCRIBE_SERVICE_URL: 'http://transcribe:7331',
};

describe('Cloud.ru worker storage without network access', () => {
  it('loads explicit addressing settings and preserves absent-setting compatibility', () => {
    expect(loadConfig({ ...environment, S3_FORCE_PATH_STYLE: 'false' }).s3ForcePathStyle).toBe(false);
    expect(loadConfig({ ...environment, S3_FORCE_PATH_STYLE: 'true' }).s3ForcePathStyle).toBe(true);
    expect(loadConfig(environment).s3ForcePathStyle).toBe(true);
  });

  it('presigns Cloud.ru using the exact object key, region and requested TTL', async () => {
    const config = loadConfig({ ...environment, S3_FORCE_PATH_STYLE: 'false' });
    const client = createS3Client(config);
    const key = '11111111-1111-1111-1111-111111111111/video.webm';
    const url = new URL(await generatePresignedGetUrl(client, config.s3Bucket, key, 123));
    expect(url.hostname).toBe('proofwall.s3.cloud.ru');
    expect(url.pathname).toBe('/' + key);
    expect(url.searchParams.get('X-Amz-Credential')).toContain('/ru-central-1/s3/aws4_request');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('123');
    expect(await client.config.requestChecksumCalculation()).toBe('WHEN_REQUIRED');
    expect(await client.config.responseChecksumValidation()).toBe('WHEN_REQUIRED');
    client.destroy();
  });

  it('accepts an old WorkerConfig object without the optional property', async () => {
    const config: WorkerConfig = loadConfig({ ...environment, S3_ENDPOINT: 'http://localhost:9000' });
    delete config.s3ForcePathStyle;
    const client = createS3Client(config);
    const url = new URL(await generatePresignedGetUrl(client, config.s3Bucket, 'project/video.mp4', 600));
    expect(url.host).toBe('localhost:9000');
    expect(url.pathname).toBe('/proofwall/project/video.mp4');
    client.destroy();
  });
});
