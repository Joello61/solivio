-- ADR-011 : le role admin disparait, ses droits etaient un sous-ensemble incoherent
-- de ceux du responsable. Les eventuels admins deviennent responsables.
UPDATE membre SET role = 'responsable' WHERE role = 'admin';
UPDATE invitation SET role = 'responsable' WHERE role = 'admin';

ALTER TABLE membre DROP CONSTRAINT ck_membre_role;
ALTER TABLE membre ADD CONSTRAINT ck_membre_role CHECK (role IN (
    'responsable', 'coordinateur', 'benevole', 'beneficiaire'
));

ALTER TABLE invitation DROP CONSTRAINT ck_invitation_role;
ALTER TABLE invitation ADD CONSTRAINT ck_invitation_role CHECK (role IN (
    'responsable', 'coordinateur', 'benevole'
));
