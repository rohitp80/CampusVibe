// Safely render profile field values
export const safeRender = (value, fallback = "Not provided") => {
  // Log any objects we encounter for debugging
  if (typeof value === 'object' && value !== null) {
    console.warn('Object detected in safeRender:', value);
  }
  
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'object' && value.message) return value.message;
  if (typeof value === 'object') return fallback;
  return String(value);
};

// Normalize profile data from API
export const normalizeProfileData = (profileData) => {
  if (!profileData) return null;
  
  // Deep clone and normalize all fields
  const normalized = {};
  
  // Process each field individually with logging
  Object.keys(profileData).forEach(key => {
    const value = profileData[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.warn(`Object found in field '${key}':`, value);
      normalized[key] = safeRender(value);
    } else {
      normalized[key] = value;
    }
  });
  
  return {
    ...normalized,
    displayName: safeRender(normalized.display_name || normalized.displayName),
    bio: safeRender(normalized.bio),
    email: safeRender(normalized.email),
    phone: safeRender(normalized.phone),
    location: safeRender(normalized.location),
    university: safeRender(normalized.university),
    course: safeRender(normalized.course),
    department: safeRender(normalized.department),
    gender: safeRender(normalized.gender, "Not specified"),
    dateOfBirth: safeRender(normalized.date_of_birth || normalized.dateOfBirth),
    graduationYear: safeRender(normalized.graduation_year || normalized.graduationYear),
    interests: Array.isArray(normalized.interests) ? normalized.interests : [],
    skills: Array.isArray(normalized.skills) ? normalized.skills : []
  };
};
