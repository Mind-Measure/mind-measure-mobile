// @ts-nocheck
/**
 * Shared pg client for buddies API
 */

import { Client } from 'pg';

export function getDbClient(): Client {
  return new Client({
    host: process.env.AWS_AURORA_HOST || process.env.AWS_RDS_HOST || process.env.DB_HOST || 'mindmeasure-aurora.cluster-cz8c8wq4k3ak.eu-west-2.rds.amazonaws.com',
    port: parseInt(process.env.AWS_AURORA_PORT || process.env.AWS_RDS_PORT || process.env.DB_PORT || '5432'),
    database: process.env.AWS_AURORA_DATABASE || process.env.AWS_RDS_DATABASE || process.env.DB_NAME || 'mindmeasure',
    user: process.env.AWS_AURORA_USERNAME || process.env.AWS_RDS_USERNAME || process.env.DB_USERNAME || 'mindmeasure_admin',
    password: process.env.AWS_AURORA_PASSWORD || process.env.AWS_RDS_PASSWORD || process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const keep = Math.min(1, Math.max(0, local.length - 2));
  const masked = (local.slice(0, keep) || '') + '***';
  return `${masked}@${domain}`;
}
