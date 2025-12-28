-- Add unique constraint on external_service_id for smm_services
CREATE UNIQUE INDEX IF NOT EXISTS idx_smm_services_external_id_unique 
ON public.smm_services (external_service_id);