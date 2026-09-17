import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Returns the currently authenticated user.
 * Throws AuthError if not logged in.
 */
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError('Usuário não autenticado.');
  }

  return user;
}

/**
 * Validates that the current user is a member of the specified organization.
 * Returns the membership details or throws ForbiddenError.
 */
export async function requireTenant(organizationId: string) {
  if (!organizationId) {
    throw new Error('organizationId é obrigatório para validação de tenant.');
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { data: membership, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (error || !membership) {
    throw new ForbiddenError('Acesso negado a esta organização.');
  }

  return { user, organizationId, role: membership.role };
}

/**
 * Validates that the current user has the required role (or higher) in the organization.
 */
export async function requireOrganizationRole(organizationId: string, requiredRole: 'owner' | 'admin' | 'agent') {
  const { role } = await requireTenant(organizationId);

  const roleHierarchy = {
    'agent': 1,
    'admin': 2,
    'owner': 3
  };

  if (roleHierarchy[role as keyof typeof roleHierarchy] < roleHierarchy[requiredRole]) {
    throw new ForbiddenError(`Permissão insuficiente. Requer nível: ${requiredRole}.`);
  }

  return { organizationId, role };
}
