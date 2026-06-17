-- 将所有ENUM类型转换为VARCHAR，避免SQLAlchemy兼容性问题

-- users.role
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);

-- import_batches
ALTER TABLE import_batches ALTER COLUMN source_type TYPE VARCHAR(20);
ALTER TABLE import_batches ALTER COLUMN status TYPE VARCHAR(20);

-- payment_transactions
ALTER TABLE payment_transactions ALTER COLUMN payment_type TYPE VARCHAR(20);
ALTER TABLE payment_transactions ALTER COLUMN payment_method TYPE VARCHAR(20);
ALTER TABLE payment_transactions ALTER COLUMN status TYPE VARCHAR(20);

-- e_contracts
ALTER TABLE e_contracts ALTER COLUMN contract_status TYPE VARCHAR(20);

-- inspection_records
ALTER TABLE inspection_records ALTER COLUMN status TYPE VARCHAR(20);

-- repair_orders
ALTER TABLE repair_orders ALTER COLUMN repair_type TYPE VARCHAR(50);
ALTER TABLE repair_orders ALTER COLUMN status TYPE VARCHAR(20);

-- complaints
ALTER TABLE complaints ALTER COLUMN status TYPE VARCHAR(20);
ALTER TABLE complaints ALTER COLUMN complaint_type TYPE VARCHAR(50);
