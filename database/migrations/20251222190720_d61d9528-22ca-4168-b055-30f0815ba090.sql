-- Drop old foreign key constraint
ALTER TABLE design_services 
DROP CONSTRAINT IF EXISTS design_services_category_id_fkey;

-- Add new foreign key constraint to categories table
ALTER TABLE design_services 
ADD CONSTRAINT design_services_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;