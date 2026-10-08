-- BackFlow Protocol PostgreSQL / Supabase Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Earners, Backers, Clients)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'EARNER' CHECK (role IN ('EARNER', 'BACKER', 'CLIENT', 'ADMIN')),
    passkey_credential_id TEXT,
    passkey_public_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agreements Table
CREATE TABLE IF NOT EXISTS agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_agreement_id BIGINT UNIQUE,
    earner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    earner_address VARCHAR(42) NOT NULL,
    payment_token VARCHAR(42) NOT NULL,
    funding_target NUMERIC(38, 0) NOT NULL,       -- in token atomic units
    total_funded NUMERIC(38, 0) DEFAULT 0,
    revenue_share_bps INT NOT NULL CHECK (revenue_share_bps > 0 AND revenue_share_bps <= 10000),
    cap_multiplier_bps INT NOT NULL CHECK (cap_multiplier_bps >= 10000),
    total_maximum_return NUMERIC(38, 0) NOT NULL,
    total_distributed NUMERIC(38, 0) DEFAULT 0,
    duration_seconds BIGINT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FUNDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
    contract_address VARCHAR(42),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Backers Table (On-chain position mirror)
CREATE TABLE IF NOT EXISTS backers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    wallet_address VARCHAR(42) NOT NULL,
    funded_amount NUMERIC(38, 0) NOT NULL,
    distributed_amount NUMERIC(38, 0) DEFAULT 0,
    max_cap NUMERIC(38, 0) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agreement_id, wallet_address)
);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    payer_address VARCHAR(42) NOT NULL,
    amount NUMERIC(38, 0) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USDC',
    transaction_hash VARCHAR(66) UNIQUE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SETTLED', 'FAILED')),
    block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Settlements Table (Granular per-recipient payout log with idempotency constraint)
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    recipient_address VARCHAR(42) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('EARNER', 'BACKER')),
    amount NUMERIC(38, 0) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Strict Idempotency Constraint: Same event can NEVER be recorded twice
    UNIQUE (transaction_hash, log_index)
);

-- 6. Invoices Table (Consumer checkout links)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    earner_address VARCHAR(42) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    amount NUMERIC(38, 0) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USDC',
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    payment_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID', 'VOID')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_earner ON agreements(earner_address);
CREATE INDEX IF NOT EXISTS idx_backers_agreement ON backers(agreement_id);
CREATE INDEX IF NOT EXISTS idx_backers_wallet ON backers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_settlements_recipient ON settlements(recipient_address);
CREATE INDEX IF NOT EXISTS idx_invoices_agreement ON invoices(agreement_id);
