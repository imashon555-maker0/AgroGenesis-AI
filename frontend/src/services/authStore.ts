export interface UserProfile {
  email: string;
  name: string;
  organization: string;
  role: string;
  createdAt: string;
}

export interface AuthUser {
  profile: UserProfile;
  dataPrefix: string;
}

const USERS_KEY = "agro_users";
const SESSION_KEY = "agro_session";

function getUsers(): Record<string, { passwordHash: string; profile: UserProfile }> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); } catch { return {}; }
}

function setUsers(users: Record<string, { passwordHash: string; profile: UserProfile }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hashPassword(pw: string): string {
  var h = 0;
  for (var i = 0; i < pw.length; i++) {
    h = ((h << 5) - h + pw.charCodeAt(i)) | 0;
  }
  return "h" + Math.abs(h).toString(36);
}

function dataPrefix(email: string): string {
  return "agro_" + email.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_";
}

export function register(email: string, password: string, name: string, organization: string): AuthUser {
  var users = getUsers();
  if (users[email]) throw new Error("An account with this email already exists.");
  var profile: UserProfile = { email, name, organization, role: "Farm Manager", createdAt: new Date().toISOString() };
  users[email] = { passwordHash: hashPassword(password), profile };
  setUsers(users);
  var user: AuthUser = { profile, dataPrefix: dataPrefix(email) };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function login(email: string, password: string): AuthUser {
  var users = getUsers();
  var entry = users[email];
  if (!entry) throw new Error("No account found with this email.");
  if (entry.passwordHash !== hashPassword(password)) throw new Error("Incorrect password.");
  var user: AuthUser = { profile: entry.profile, dataPrefix: dataPrefix(email) };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): AuthUser | null {
  try {
    var raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (parsed && parsed.profile && parsed.dataPrefix) return parsed;
    return null;
  } catch { return null; }
}

export function updateProfile(updates: Partial<UserProfile>): AuthUser | null {
  var user = getCurrentUser();
  if (!user) return null;
  var users = getUsers();
  var entry = users[user.profile.email];
  if (entry) {
    entry.profile = { ...entry.profile, ...updates };
    setUsers(users);
    user.profile = entry.profile;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  return user;
}

export function hasUsers(): boolean {
  return Object.keys(getUsers()).length > 0;
}
