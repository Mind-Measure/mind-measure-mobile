/**
 * University Resolver Service
 *
 * Centralized service for resolving university from email domain.
 * Used by:
 * - Baseline profile creation
 * - Registration flows
 * - Admin user assignment
 *
 * Benefits:
 * - Single source of truth for domain → university mapping
 * - Dynamic: reads from universities.domains in database
 * - No hardcoded mappings
 * - Supports multiple domains per university
 */

import { BackendServiceFactory } from './database/BackendServiceFactory';

export class UniversityResolver {
  private static instance: UniversityResolver;
  private cache: Map<string, string> = new Map(); // domain → university_id
  private cacheExpiry: number = 0;
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private constructor() {}

  static getInstance(): UniversityResolver {
    if (!UniversityResolver.instance) {
      UniversityResolver.instance = new UniversityResolver();
    }
    return UniversityResolver.instance;
  }

  /**
   * Resolve university from email address
   * Matches the email domain against settings.allowed_email_domains
   * stored in the universities table.
   *
   * @param email - User's email address
   * @returns university slug (e.g. 'worcester', 'lse') or null if no match
   */
  async resolveFromEmail(email: string): Promise<string | null> {
    if (!email || !email.includes('@')) {
      console.warn('[UniversityResolver] Invalid email:', email);
      return null;
    }

    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) {
      console.warn('[UniversityResolver] Could not extract domain from email:', email);
      return null;
    }

    // Hardcoded overrides that always apply regardless of DB state
    const DOMAIN_OVERRIDES: Record<string, string> = {
      'worc.ac.uk': 'worcester',
      'mindmeasure.co.uk': 'worcester',
      'lse.ac.uk': 'lse',
    };
    if (DOMAIN_OVERRIDES[domain]) {
      return DOMAIN_OVERRIDES[domain];
    }

    // Check cache first
    if (this.isCacheValid() && this.cache.has(domain)) {
      const universityId = this.cache.get(domain)!;
      console.log(`[UniversityResolver] Cache hit: ${domain} → ${universityId}`);
      return universityId;
    }

    // Cache miss or expired - query database
    try {
      const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

      // Query universities with settings containing allowed_email_domains
      const { data: universities, error } = await backendService.database.select('universities', {
        columns: 'id, slug, settings',
        limit: 500,
      });

      if (error) {
        console.warn('[UniversityResolver] DB lookup failed, using default:', error);
        return null;
      }

      if (!universities || universities.length === 0) {
        console.warn('[UniversityResolver] No universities found in database, using default');
        return null;
      }

      // Build cache from all university domain mappings
      const typedUniversities = universities as Array<{
        id: string;
        slug?: string;
        settings?: { allowed_email_domains?: string[] };
      }>;

      for (const uni of typedUniversities) {
        const domains = uni.settings?.allowed_email_domains || [];
        const uniSlug = uni.slug || uni.id;
        for (const d of domains) {
          this.cache.set(d.toLowerCase(), uniSlug);
        }
      }
      this.cacheExpiry = Date.now() + UniversityResolver.CACHE_TTL_MS;

      // Now check if the user's domain is in the freshly built cache
      if (this.cache.has(domain)) {
        const universitySlug = this.cache.get(domain)!;
        console.log(`[UniversityResolver] Matched: ${domain} → ${universitySlug}`);
        return universitySlug;
      }

      console.log(`[UniversityResolver] No university matched domain '${domain}', will use default`);
      return null;
    } catch (error) {
      console.warn('[UniversityResolver] Error resolving university, using default:', error);
      return null;
    }
  }

  /**
   * Get default fallback university
   * Used when email domain doesn't match any university.
   * During public testing, unmatched users go to Rummidge (demo institution).
   */
  getDefaultUniversity(): string {
    return 'rummidge'; // Public testing default – route unknown domains to demo university
  }

  /**
   * Clear cache (useful for testing or after university config changes)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry = 0;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() < this.cacheExpiry;
  }

  /**
   * Get all cached domain mappings (for debugging)
   */
  getCachedMappings(): Record<string, string> {
    const mappings: Record<string, string> = {};
    this.cache.forEach((universityId, domain) => {
      mappings[domain] = universityId;
    });
    return mappings;
  }
}

/**
 * Convenience function for one-off university resolution
 */
export async function resolveUniversityFromEmail(email: string): Promise<string> {
  const resolver = UniversityResolver.getInstance();
  const universityId = await resolver.resolveFromEmail(email);

  if (!universityId) {
    console.warn('[UniversityResolver] No match found, using default university');
    return resolver.getDefaultUniversity();
  }

  return universityId;
}
