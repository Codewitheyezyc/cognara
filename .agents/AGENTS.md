# Cognara Project Rules

## Image Handling Constraint
- Some existing images like avatars and certificates are stored in Supabase Storage and have Supabase URLs.
- New images (like streak badges) are stored in Cloudinary.
- **Critical Requirement:** The codebase must handle both Supabase and Cloudinary URL formats gracefully. Never assume all images come from one source.
