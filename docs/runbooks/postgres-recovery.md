# PostgreSQL backup and recovery drill

The v2 control plane uses PostgreSQL row-level security and an append-only audit
trigger as security boundaries. A successful database restore is not sufficient
unless those controls and tenant data survive the recovery.

## Automated gate

CI migrates and seeds an ephemeral PostgreSQL instance, creates a custom-format
logical backup, restores it into a separately named database, and verifies:

- the Alembic revision and row counts for every control-plane table;
- enabled and forced row-level security on every tenant-bearing table;
- denial without tenant context and denial across tenant boundaries;
- visibility for the owning tenant; and
- rejection of audit-event mutation by the restored append-only trigger.

The dump is written with mode `0600`, its SHA-256 digest is reported, and the
temporary dump and restored database are deleted after the drill.

## Staging exercise

Run this only with a dedicated restore target. The command refuses targets that
do not end in `_restore_drill`, refuses the source database name, and requires an
explicit destructive-operation switch.

```bash
export MIGRATION_DATABASE_URL='postgresql://migration-owner:...@db.example/psychs_staging'
export DATABASE_URL='postgresql://psychs_app:...@db.example/psychs_staging'
export DATABASE_APP_USER='psychs_app'
export DATABASE_APP_PASSWORD='...'
export RESTORE_DRILL_DATABASE='psychs_staging_restore_drill'
export PSYCHS_ALLOW_DESTRUCTIVE_RESTORE_DRILL='true'
python -m app.database.recovery_drill
```

The migration owner must be able to create and drop the disposable target
database. Credentials are passed to `pg_dump` and `pg_restore` through libpq
environment variables rather than command-line arguments. Production backups
should remain encrypted, access-controlled, retention-managed, and tested from
a separate recovery account according to the organization’s RPO and RTO.
