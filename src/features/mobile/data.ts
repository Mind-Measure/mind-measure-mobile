import { BackendServiceFactory } from '@/services/database/BackendServiceFactory';
import { University, EmergencyContact, ContentArticle } from '../cms/data';
// Mobile-specific data types
export interface MobileUniversityProfile {
  id: string;
  name: string;
  short_name: string;
  logo?: string;
  logo_dark?: string;
  primary_color: string;
  secondary_color: string;
  emergency_contacts: EmergencyContact[];
  help_articles: ContentArticle[];
  contact_email: string;
  contact_phone?: string;
  wellbeing_support_url?: string;
}
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  university_id?: string;
  university?: MobileUniversityProfile;
  created_at: string;
  updated_at: string;
}
// Get user's university profile with all mobile-relevant data
export async function getUserUniversityProfile(userId?: string): Promise<MobileUniversityProfile | null> {
  // AWS Backend Service
  const backendService = BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());
  try {
    // If no userId provided, try to get from current session
    let userIdToUse = userId;
    if (!userIdToUse) {
      const { data: user, error: userError } = await backendService.auth.getCurrentUser();
      if (userError || !user) {
        return null;
      }
      userIdToUse = (user.sub as string) || (user.Username as string);
    }

    if (!userIdToUse) {
      return null;
    }

    // Get user's profile to find their university
    const profileResponse = await backendService.database.select<{ user_id: string; university_id: string }>(
      'profiles',
      {
        filters: { user_id: userIdToUse },
        limit: 1,
      }
    );

    const profile = profileResponse.data?.[0];
    if (!profile?.university_id) {
      return null;
    }
    // Get university data with emergency contacts and help articles
    const universityResponse = await backendService.database.select<University>('universities', {
      filters: { id: profile.university_id },
      limit: 1,
    });

    const university = universityResponse.data?.[0];
    if (!university) {
      console.error('Error fetching university - not found');
      return null;
    }

    // Get published help articles for this university
    const articlesResponse = await backendService.database.select<ContentArticle>('content_articles', {
      filters: {
        university_id: profile.university_id,
        status: 'published',
      },
    });

    const articles = articlesResponse.data || [];

    // Fetch ALL category names (small table, just fetch all)
    if (articles.length > 0) {
      const categoriesResponse = await backendService.database.select('content_categories', {});
      const categories = categoriesResponse.data || [];
      const categoryMap = new Map(categories.map((c: { id: string; name?: string; slug?: string }) => [c.id, c]));

      // Attach category info to each article
      articles.forEach((article: ContentArticle & { category?: { name: string; slug: string } }) => {
        if (article.category_id) {
          const cat = categoryMap.get(article.category_id);
          if (cat) {
            article.category = { name: cat.name, slug: cat.slug };
          }
        }
      });
    }

    return {
      id: university.id,
      name: university.name,
      short_name: university.short_name,
      logo: university.logo,
      logo_dark: university.logo_dark,
      primary_color: university.primary_color,
      secondary_color: university.secondary_color || '',
      emergency_contacts: university.emergency_contacts || [],
      help_articles: articles || [],
      contact_email: university.contact_email,
      contact_phone: university.contact_phone,
      wellbeing_support_url: (university as unknown as Record<string, unknown>).wellbeing_support_url as
        | string
        | undefined,
    };
  } catch (error: unknown) {
    console.error('Error fetching user university profile:', error);
    return null;
  }
}
// Get emergency contacts for user's university
export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  try {
    const profile = await getUserUniversityProfile();
    if (!profile) return [];
    return profile.emergency_contacts.sort((a, b) => {
      // Sort by primary first, then 24/7, then by category priority
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      if (a.is24Hour && !b.is24Hour) return -1;
      if (!a.is24Hour && b.is24Hour) return 1;
      const categoryPriority = { crisis: 1, medical: 2, security: 3, 'mental-health': 4, support: 5 };
      return (categoryPriority[a.category] || 6) - (categoryPriority[b.category] || 6);
    });
  } catch (error: unknown) {
    console.error('Error fetching emergency contacts:', error);
    return [];
  }
}
// Get help articles for user's university
export async function getHelpArticles(category?: string, featured?: boolean): Promise<ContentArticle[]> {
  try {
    const profile = await getUserUniversityProfile();
    if (!profile) return [];
    let articles = profile.help_articles;
    if (category) {
      articles = articles.filter((article) => article.category?.slug === category);
    }
    if (featured) {
      articles = articles.filter((article) => article.is_featured);
    }
    return articles;
  } catch (error: unknown) {
    console.error('Error fetching help articles:', error);
    return [];
  }
}
// Helper to get backend service
function getBackendService() {
  return BackendServiceFactory.createService(BackendServiceFactory.getEnvironmentConfig());
}

// Get a specific help article and increment view count
export async function getHelpArticle(slug: string): Promise<ContentArticle | null> {
  const backendService = getBackendService();
  try {
    const userResult = await backendService.auth.getCurrentUser();
    const user = userResult?.data;
    if (!user) return null;

    // Get user's university
    const profileResult = await backendService.database.select<{ user_id: string; university_id: string }>('profiles', {
      columns: 'university_id',
      filters: { user_id: (user.sub as string) || (user.Username as string) },
      limit: 1,
    });
    const profile = profileResult.data?.[0];
    if (!profile?.university_id) return null;

    // Get the article
    const { data, error } = await backendService.database.select<ContentArticle>('content_articles', {
      columns: '*',
      filters: {
        university_id: profile.university_id,
        slug,
        status: 'published',
      },
      limit: 1,
    });
    if (error || !data?.[0]) {
      console.error('Error fetching article:', error);
      return null;
    }
    const article = data[0];

    // Fetch category separately if article has a category_id
    if (article.category_id) {
      const catResult = await backendService.database.select<ContentArticle['category'] & { id: string }>(
        'content_categories',
        {
          columns: 'name, slug, color, icon',
          filters: { id: article.category_id },
          limit: 1,
        }
      );
      if (catResult.data?.[0]) {
        article.category = catResult.data[0];
      }
    }

    // Increment view count (fire and forget)
    backendService.database
      .update('content_articles', { view_count: (article.view_count || 0) + 1 }, { id: article.id })
      .catch(() => {});

    return article;
  } catch (error: unknown) {
    console.error('Error fetching help article:', error);
    return null;
  }
}
// Associate user with a university (for onboarding)
export async function setUserUniversity(universityId: string): Promise<boolean> {
  const backendService = getBackendService();
  try {
    const userResult = await backendService.auth.getCurrentUser();
    const user = userResult?.data;
    if (!user) return false;

    const { error } = await backendService.database.update(
      'profiles',
      { university_id: universityId },
      { user_id: (user.sub as string) || (user.Username as string) }
    );
    if (error) {
      console.error('Error setting user university:', error);
      return false;
    }
    return true;
  } catch (error: unknown) {
    console.error('Error setting user university:', error);
    return false;
  }
}
// Search universities for onboarding
export async function searchUniversities(query: string): Promise<University[]> {
  const backendService = getBackendService();
  try {
    // Fetch active universities then filter client-side for name/short_name match
    const { data, error } = await backendService.database.select<University>('universities', {
      columns: 'id, name, short_name, logo, primary_color',
      filters: { status: 'active' },
      orderBy: [{ column: 'name', ascending: true }],
    });
    if (error) {
      console.error('Error searching universities:', error);
      return [];
    }
    // Client-side filter for name/short_name matching (replaces .or/.ilike)
    const lowerQuery = query.toLowerCase();
    const filtered = (data || []).filter(
      (u) =>
        (u.name || '').toLowerCase().includes(lowerQuery) || (u.short_name || '').toLowerCase().includes(lowerQuery)
    );
    return filtered.slice(0, 10);
  } catch (error: unknown) {
    console.error('Error searching universities:', error);
    return [];
  }
}
// Get university branding for theming
export async function getUniversityBranding(): Promise<{
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  logoUrl?: string;
} | null> {
  try {
    const profile = await getUserUniversityProfile();
    if (!profile) return null;
    return {
      primaryColor: profile.primary_color,
      secondaryColor: profile.secondary_color,
      logo: profile.logo,
      logoUrl: profile.logo,
    };
  } catch (error: unknown) {
    console.error('Error fetching university branding:', error);
    return null;
  }
}
