export type AuthUser = {
  id: number;
  name: string | null;
  display_name: string | null;
  email: string;
  date_of_birth: string | null;
  country: string | null;
  roles: string[];
  permissions: string[];
  direct_permissions: string[];
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type FieldErrors = Record<string, string[]>;

export type Paginated<T> = {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
};
