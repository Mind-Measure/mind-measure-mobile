import { BackendServiceFactory } from '@/services/database/BackendServiceFactory';
// Types for CMS data
export interface University {
  id: string;
  name: string;
  short_name: string;
  slug?: string;
  website?: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  postcode?: string;
  total_students: number;
  undergraduate_students: number;
  postgraduate_students: number;
  international_students: number;
  mature_students: number;
  male_students?: number;
  female_students?: number;
  non_binary_students?: number;
  established?: number;
  primary_color: string;
  secondary_color?: string;
  logo?: string;
  logo_dark?: string;
  campus_image?: string;
  authorized_domains?: string[];
  authorized_emails?: string[];
  status: 'planning' | 'launched' | 'active' | 'paused';
  current_uptake_rate: number;
  emergency_contacts: EmergencyContact[];
  mental_health_services: MentalHealthService[];
  local_resources: LocalResource[];
  created_at: string;
  updated_at: string;
}
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  description: string;
  is24Hour: boolean;
  isPrimary: boolean;
  category: 'crisis' | 'medical' | 'security' | 'mental-health' | 'support';
}
export interface MentalHealthService {
  id: string;
  name: string;
  description: string;
  contact_info: string;
  availability: string;
  type: 'counseling' | 'therapy' | 'crisis' | 'support-group' | 'online';
}
export interface LocalResource {
  id: string;
  name: string;
  description: string;
  contact_info: string;
  website?: string;
  category: 'academic' | 'wellbeing' | 'financial' | 'housing' | 'career';
}
// Helper to get backend service
function getBackendService() {
  return BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());
}

// CMS Data Functions
export async function getAllUniversities(): Promise<University[]> {
  const backendService = getBackendService();
  try {
    const { data, error } = await backendService.database.select<University>('universities', {
      columns: '*',
      orderBy: [{ column: 'created_at', ascending: false }],
    });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching universities:', error);
    return [];
  }
}
export async function getUniversityById(id: string): Promise<University | null> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    const result = await backendService.database.select<University>('universities', {
      filters: { id: id },
    });

    if (result.error) {
      console.error('Error fetching university:', result.error);
      return null;
    }

    return result.data && result.data.length > 0 ? result.data[0] : null;
  } catch (error) {
    console.error('Error fetching university:', error);
    return null;
  }
}

export async function getUniversityBySlug(slug: string): Promise<University | null> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    const result = await backendService.database.select<University>('universities', {
      filters: { slug: slug },
    });

    if (result.error) {
      console.error('Error fetching university by slug:', result.error);
      return null;
    }

    return result.data && result.data.length > 0 ? result.data[0] : null;
  } catch (error) {
    console.error('Error fetching university by slug:', error);
    return null;
  }
}
export async function createUniversity(universityData: Partial<University>): Promise<University | null> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    // Generate university slug if not provided
    const universitySlug =
      universityData.slug ||
      (universityData.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();

    // 1. Create the university record in database
    const { data, error } = await backendService.database.insert<University>('universities', {
      id: universityData.id || crypto.randomUUID(),
      name: universityData.name || '',
      short_name: universityData.short_name || '',
      slug: universitySlug,
      website: universityData.website,
      contact_email: universityData.contact_email || '',
      contact_phone: universityData.contact_phone,
      address: universityData.address,
      postcode: universityData.postcode,
      total_students: universityData.total_students || 0,
      undergraduate_students: universityData.undergraduate_students || 0,
      postgraduate_students: universityData.postgraduate_students || 0,
      international_students: universityData.international_students || 0,
      mature_students: universityData.mature_students || 0,
      primary_color: universityData.primary_color || '#0BA66D',
      secondary_color: universityData.secondary_color || '#3b82f6',
      logo: universityData.logo,
      logo_dark: universityData.logo_dark,
      status: universityData.status || 'planning',
      current_uptake_rate: universityData.current_uptake_rate || 0,
      emergency_contacts: universityData.emergency_contacts || [],
      mental_health_services: universityData.mental_health_services || [],
      local_resources: universityData.local_resources || [],
    });
    if (error) throw error;

    // 2. Create dedicated S3 bucket for this university
    if (universitySlug) {
      try {
        const bucketResponse = await fetch('/api/universities/create-bucket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            universitySlug,
            universityName: universityData.name,
          }),
        });

        const bucketResult = await bucketResponse.json();

        if (bucketResult.success) {
          /* intentionally empty */
        } else {
          console.warn(`⚠️ S3 bucket creation failed: ${bucketResult.error}`);
          // Don't fail university creation if bucket creation fails
        }
      } catch (bucketError) {
        console.error('⚠️ Error creating S3 bucket:', bucketError);
        // Don't fail university creation if bucket creation fails
      }
    }

    return (Array.isArray(data) ? (data[0] ?? null) : data) as University | null;
  } catch (error) {
    console.error('Error creating university:', error);
    return null;
  }
}
export async function updateUniversity(id: string, updates: Partial<University>): Promise<University | null> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    const { data, error } = await backendService.database.update<University>(
      'universities',
      {
        ...updates,
        updated_at: new Date().toISOString(),
      },
      {
        id: id,
      }
    );
    if (error) throw error;
    return (Array.isArray(data) ? (data[0] ?? null) : data) as University | null;
  } catch (error) {
    console.error('Error updating university:', error);
    return null;
  }
}
export async function deleteUniversity(id: string): Promise<boolean> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    const { error } = await backendService.database.delete('universities', {
      id: id,
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting university:', error);
    return false;
  }
}
// Emergency Contacts Functions
export async function updateEmergencyContacts(universityId: string, contacts: EmergencyContact[]): Promise<boolean> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    const { error } = await backendService.database.update(
      'universities',
      {
        emergency_contacts: contacts,
        updated_at: new Date().toISOString(),
      },
      {
        id: universityId,
      }
    );
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating emergency contacts:', error);
    return false;
  }
}
// Mental Health Services Functions
export async function updateMentalHealthServices(
  universityId: string,
  services: MentalHealthService[]
): Promise<boolean> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    const { error } = await backendService.database.update(
      'universities',
      {
        mental_health_services: services,
        updated_at: new Date().toISOString(),
      },
      {
        id: universityId,
      }
    );
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating mental health services:', error);
    return false;
  }
}
// Local Resources Functions
export async function updateLocalResources(universityId: string, resources: LocalResource[]): Promise<boolean> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    const { error } = await backendService.database.update(
      'universities',
      {
        local_resources: resources,
        updated_at: new Date().toISOString(),
      },
      {
        id: universityId,
      }
    );
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating local resources:', error);
    return false;
  }
}
// Content Management Types
export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}
export interface ContentArticle {
  id: string;
  university_id: string;
  category_id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  author_id?: string;
  author?: string;
  read_time?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  category?: ContentCategory;
  tags?: ContentTag[];
}
export interface ContentTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}
// Content Categories Functions
export async function getContentCategories(): Promise<ContentCategory[]> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    const { data, error } = await backendService.database.select<ContentCategory>('content_categories', {
      columns: '*',
    });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching content categories:', error);
    return [];
  }
}
// Content Articles Functions
export async function getContentArticles(universityId?: string, status?: string): Promise<ContentArticle[]> {
  try {
    // Initialize backend service
    const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());

    const filters: any = {};
    if (universityId) {
      filters.university_id = universityId;
    }
    if (status) {
      filters.status = status;
    }

    const { data, error } = await backendService.database.select<ContentArticle>('content_articles', {
      columns: '*',
      filters: filters,
      orderBy: [{ column: 'updated_at', ascending: false }],
    });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching content articles:', error);
    return [];
  }
}
export async function getContentArticleById(id: string): Promise<ContentArticle | null> {
  const backendService = getBackendService();
  try {
    const { data, error } = await backendService.database.select<ContentArticle>('content_articles', {
      columns: '*',
      filters: { id },
      limit: 1,
    });
    if (error) throw error;
    const article = data?.[0] || null;

    // Fetch category separately if article has a category_id
    if (article?.category_id) {
      const catResult = await backendService.database.select<ContentCategory>('content_categories', {
        columns: '*',
        filters: { id: article.category_id },
        limit: 1,
      });
      if (catResult.data?.[0]) {
        article.category = catResult.data[0];
      }
    }

    return article;
  } catch (error) {
    console.error('Error fetching content article:', error);
    return null;
  }
}
export async function createContentArticle(articleData: Partial<ContentArticle>): Promise<ContentArticle | null> {
  const backendService = getBackendService();
  try {
    const userResult = await backendService.auth.getCurrentUser();
    const user = userResult?.data;

    const { data, error } = await backendService.database.insert<ContentArticle>('content_articles', {
      university_id: articleData.university_id,
      category_id: articleData.category_id,
      title: articleData.title || '',
      slug:
        articleData.slug ||
        articleData.title
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ||
        '',
      excerpt: articleData.excerpt,
      content: articleData.content || '',
      featured_image: articleData.featured_image,
      status: articleData.status || 'draft',
      is_featured: articleData.is_featured || false,
      author_id: (user?.sub as string | undefined) || (user?.Username as string | undefined),
    } as Partial<ContentArticle>);
    if (error) throw error;

    // Return the created article (fetch it back with category)
    const created = (Array.isArray(data) ? data[0] : data) as ContentArticle | null;
    if (created?.id) {
      return await getContentArticleById(created.id);
    }
    return created;
  } catch (error) {
    console.error('Error creating content article:', error);
    return null;
  }
}
export async function updateContentArticle(
  id: string,
  updates: Partial<ContentArticle>
): Promise<ContentArticle | null> {
  const backendService = getBackendService();
  try {
    const updateData: any = { ...updates };
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.category;
    delete updateData.tags;

    const { data: _data, error } = await backendService.database.update('content_articles', updateData, { id });
    if (error) throw error;

    // Fetch the updated article with category
    return await getContentArticleById(id);
  } catch (error) {
    console.error('Error updating content article:', error);
    return null;
  }
}
export async function deleteContentArticle(id: string): Promise<boolean> {
  const backendService = getBackendService();
  try {
    const { error } = await backendService.database.delete('content_articles', { id });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting content article:', error);
    return false;
  }
}
export async function incrementArticleViews(id: string): Promise<void> {
  const backendService = getBackendService();
  try {
    // Fetch current view count, then increment
    const { data } = await backendService.database.select<{ view_count: number }>('content_articles', {
      columns: 'view_count',
      filters: { id },
      limit: 1,
    });
    const currentCount = data?.[0]?.view_count || 0;
    await backendService.database.update('content_articles', { view_count: currentCount + 1 }, { id });
  } catch (error) {
    console.error('Error incrementing article views:', error);
  }
}
// Content Tags Functions
export async function getContentTags(): Promise<ContentTag[]> {
  const backendService = getBackendService();
  try {
    const { data, error } = await backendService.database.select<ContentTag>('content_tags', {
      columns: '*',
      orderBy: [{ column: 'name', ascending: true }],
    });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching content tags:', error);
    return [];
  }
}
export async function createContentTag(name: string): Promise<ContentTag | null> {
  const backendService = getBackendService();
  try {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const { data, error } = await backendService.database.insert<ContentTag>('content_tags', {
      name,
      slug,
    } as Partial<ContentTag>);
    if (error) throw error;
    return (Array.isArray(data) ? (data[0] ?? null) : data) as ContentTag | null;
  } catch (error) {
    console.error('Error creating content tag:', error);
    return null;
  }
}
// Statistics Functions
export async function getCMSStatistics() {
  const backendService = getBackendService();
  try {
    const { data: universities, error } = await backendService.database.select<University>('universities', {
      columns: 'status, emergency_contacts, total_students',
    });
    if (error) throw error;
    const stats = {
      totalUniversities: universities?.length || 0,
      activeUniversities: universities?.filter((u) => u.status === 'active').length || 0,
      inSetupUniversities: universities?.filter((u) => u.status === 'planning' || u.status === 'launched').length || 0,
      totalStudents: universities?.reduce((sum, u) => sum + (u.total_students || 0), 0) || 0,
      totalEmergencyContacts: universities?.reduce((sum, u) => sum + (u.emergency_contacts?.length || 0), 0) || 0,
    };
    return stats;
  } catch (error) {
    console.error('Error fetching CMS statistics:', error);
    return {
      totalUniversities: 0,
      activeUniversities: 0,
      inSetupUniversities: 0,
      totalStudents: 0,
      totalEmergencyContacts: 0,
    };
  }
}
// Authorized Users Management
export interface AuthorizedUser {
  id: string;
  university_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  first_name?: string;
  last_name?: string;
  department?: string;
  phone?: string;
  added_by?: string;
  status: 'active' | 'suspended' | 'pending';
  last_login?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
}
// Get authorized users for a university
export async function getAuthorizedUsers(universityId: string): Promise<AuthorizedUser[]> {
  const backendService = getBackendService();
  try {
    const { data, error } = await backendService.database.select<AuthorizedUser>('university_authorized_users', {
      columns: '*',
      filters: { university_id: universityId },
      orderBy: [{ column: 'created_at', ascending: false }],
    });
    if (error) {
      console.error('Error fetching authorized users:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching authorized users:', error);
    return [];
  }
}
// Add authorized user
export async function addAuthorizedUser(
  user: Omit<AuthorizedUser, 'id' | 'created_at' | 'updated_at' | 'login_count' | 'last_login'>
): Promise<AuthorizedUser | null> {
  const backendService = getBackendService();
  try {
    const { data, error } = await backendService.database.insert('university_authorized_users', user);
    if (error) {
      console.error('Error adding authorized user:', error);
      return null;
    }
    return (Array.isArray(data) ? data[0] : data) as AuthorizedUser | null;
  } catch (error) {
    console.error('Error adding authorized user:', error);
    return null;
  }
}
// Update authorized user
export async function updateAuthorizedUser(
  id: string,
  updates: Partial<AuthorizedUser>
): Promise<AuthorizedUser | null> {
  const backendService = getBackendService();
  try {
    const { data, error } = await backendService.database.update(
      'university_authorized_users',
      { ...updates, updated_at: new Date().toISOString() },
      { id }
    );
    if (error) {
      console.error('Error updating authorized user:', error);
      return null;
    }
    return (Array.isArray(data) ? data[0] : data) as AuthorizedUser | null;
  } catch (error) {
    console.error('Error updating authorized user:', error);
    return null;
  }
}
// Delete authorized user
export async function deleteAuthorizedUser(id: string): Promise<boolean> {
  const backendService = getBackendService();
  try {
    const { error } = await backendService.database.delete('university_authorized_users', { id });
    if (error) {
      console.error('Error deleting authorized user:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting authorized user:', error);
    return false;
  }
}
// Check if user is authorized for university
export async function isUserAuthorized(email: string, universityId: string): Promise<boolean> {
  const backendService = getBackendService();
  try {
    // MM staff are always authorized
    if (email.endsWith('@mindmeasure.co.uk')) {
      return true;
    }
    // Check university_authorized_users table directly
    const { data, error } = await backendService.database.select('university_authorized_users', {
      columns: 'id',
      filters: { email, university_id: universityId, status: 'active' },
      limit: 1,
    });
    if (error) {
      console.error('Error checking user authorization:', error);
      return false;
    }
    return (data && data.length > 0) || false;
  } catch (error) {
    console.error('Error checking user authorization:', error);
    return false;
  }
}
// Update user last login
export async function updateUserLastLogin(email: string): Promise<void> {
  const backendService = getBackendService();
  try {
    await backendService.database.update(
      'university_authorized_users',
      { last_login: new Date().toISOString(), login_count: 1 },
      { email }
    );
  } catch (error) {
    console.error('Error updating user last login:', error);
  }
}
