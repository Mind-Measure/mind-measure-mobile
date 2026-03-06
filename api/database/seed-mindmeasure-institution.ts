/**
 * Migration: Seed Mind Measure open-access institution
 *
 * POST /api/database/seed-mindmeasure-institution
 *
 * Creates the Mind Measure institution in the universities table.
 * Non-university users are assigned here by default.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

function getDbConfig() {
  return {
    host: process.env.AWS_AURORA_HOST,
    port: parseInt(process.env.AWS_AURORA_PORT || '5432'),
    database: process.env.AWS_AURORA_DATABASE || 'mindmeasure',
    user: process.env.AWS_AURORA_USERNAME || 'mindmeasure_admin',
    password: process.env.AWS_AURORA_PASSWORD || '',
    ssl: { rejectUnauthorized: false },
  };
}

const INSTITUTION = {
  id: 'mindmeasure',
  name: 'Mind Measure',
  slug: 'mindmeasure',
  short_name: 'MM',
  status: 'active',
  total_students: 0,
  undergraduate_students: 0,
  postgraduate_students: 0,
  settings: {
    allowed_email_domains: [],
    data_retention: { retention_days: 1825, allow_data_export: true },
    notifications: { email_notifications: true, sms_notifications: false },
  },
  faculties: [],
  halls: [],
  emergency_contacts: [],
  mental_health_services: [],
  national_resources: [
    {
      name: 'Shout',
      description: '24/7 text support. Text SHOUT to 85258.',
      website: 'https://giveusashout.org/',
      isEnabled: true,
    },
    {
      name: 'Mind',
      description: 'Information and support for mental health.',
      website: 'https://www.mind.org.uk/',
      isEnabled: true,
    },
    {
      name: 'Student Space (Student Minds)',
      description: 'Support for students via webchat, text and resources.',
      website: 'https://studentspace.org.uk/',
      isEnabled: true,
    },
    {
      name: 'Papyrus HOPELINE247',
      description: 'Support for people under 35 experiencing suicidal thoughts.',
      website: 'https://www.papyrus-uk.org/',
      phone: '08006844141',
      isEnabled: true,
    },
  ],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const client = new Client(getDbConfig());

  try {
    await client.connect();

    const result = await client.query(
      `INSERT INTO universities (id, name, slug, short_name, status, total_students, undergraduate_students, postgraduate_students, settings, faculties, emergency_contacts, mental_health_services, national_resources, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, slug = EXCLUDED.slug, short_name = EXCLUDED.short_name,
         status = EXCLUDED.status, settings = EXCLUDED.settings,
         emergency_contacts = EXCLUDED.emergency_contacts,
         mental_health_services = EXCLUDED.mental_health_services,
         national_resources = EXCLUDED.national_resources,
         updated_at = NOW()
       RETURNING id, name, slug`,
      [
        INSTITUTION.id,
        INSTITUTION.name,
        INSTITUTION.slug,
        INSTITUTION.short_name,
        INSTITUTION.status,
        INSTITUTION.total_students,
        INSTITUTION.undergraduate_students,
        INSTITUTION.postgraduate_students,
        JSON.stringify(INSTITUTION.settings),
        JSON.stringify(INSTITUTION.faculties),
        JSON.stringify(INSTITUTION.emergency_contacts),
        JSON.stringify(INSTITUTION.mental_health_services),
        JSON.stringify(INSTITUTION.national_resources),
      ]
    );

    res.status(200).json({
      success: true,
      institution: result.rows[0],
      message: 'Mind Measure open-access institution seeded successfully.',
    });
  } catch (error: unknown) {
    console.error('Error seeding Mind Measure institution:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    await client.end();
  }
}
