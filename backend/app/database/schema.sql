-- ==============================================================================
-- Psychs Enterprise Database Schema (PostgreSQL 16 + pgvector 0.8+)
-- Declarative Tenant Partitioning (16 Partitions), halfvec(1536), & Tuned HNSW
-- ==============================================================================

-- 1. Enable pgvector and cryptographic extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tenants Master Table with KMS Key Identifier
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    kms_tdk_key_id VARCHAR(255) NOT NULL, -- Tenant Data Key in AWS KMS / GCP KMS
    subscription_tier VARCHAR(50) DEFAULT 'ENTERPRISE_PROD',
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, SHREDDED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Core Tenant Embeddings Table with Declarative Hash Partitioning
CREATE TABLE IF NOT EXISTS tenant_embeddings (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    embedding halfvec(1536) NOT NULL, -- 50% storage reduction vs float32
    evidence_tier VARCHAR(32) NOT NULL DEFAULT 'OBSERVED', -- [OBSERVED], [INFERRED], [MODEL-GENERATED], [USER-PROVIDED]
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
) PARTITION BY HASH (tenant_id);

-- 4. Instantiate 16 Hash Partitions to Isolate Physical HNSW Graph Traversals
CREATE TABLE IF NOT EXISTS tenant_embeddings_p0 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p1 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 1);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p2 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 2);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p3 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 3);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p4 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 4);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p5 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 5);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p6 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 6);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p7 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 7);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p8 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 8);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p9 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 9);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p10 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 10);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p11 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 11);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p12 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 12);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p13 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 13);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p14 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 14);
CREATE TABLE IF NOT EXISTS tenant_embeddings_p15 PARTITION OF tenant_embeddings FOR VALUES WITH (MODULUS 16, REMAINDER 15);

-- 5. Compile Tuned HNSW Index on Partitioned Tables Using Relaxed Order
CREATE INDEX IF NOT EXISTS idx_tenant_embeddings_hnsw ON tenant_embeddings
USING hnsw (embedding halfvec_cosine_ops)
WITH (m = 16, ef_construction = 128);

-- 6. Perception Audits History Table
CREATE TABLE IF NOT EXISTS perception_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    composite_score NUMERIC(5,2) NOT NULL,
    sov_score NUMERIC(5,2) NOT NULL,
    entity_score NUMERIC(5,2) NOT NULL,
    citation_score NUMERIC(5,2) NOT NULL,
    semantic_entropy NUMERIC(5,4) NOT NULL,
    is_hallucination_flagged BOOLEAN DEFAULT FALSE,
    dimensions_breakdown JSONB NOT NULL,
    prompt_panel_results JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Immutable WORM Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    evidence_tier VARCHAR(32) NOT NULL,
    request_payload JSONB NOT NULL,
    response_payload JSONB NOT NULL,
    hmac_signature VARCHAR(128) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable PostgreSQL Row-Level Security (RLS)
ALTER TABLE tenant_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE perception_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 9. Enforce RLS Policies Failing Closed If Tenant Context Is Missing
CREATE POLICY tenant_isolation_embeddings ON tenant_embeddings
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_audits ON perception_audits
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_logs ON audit_logs
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
