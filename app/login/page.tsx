import Link from 'next/link';

const ERRORS: Record<string, string> = {
  missing_code: 'Discord login was cancelled.',
  oauth: 'Could not complete Discord login.',
  not_in_guild: 'You are not in the staff Discord guild.',
  no_staff_role: 'Your Discord roles are not mapped to staff permissions.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="login">
      <div className="panel">
        <div className="brand">
          SD ADMIN
          <strong>Staff login</strong>
        </div>
        <p>Sign in with Discord. Owner, Head Admin, Admin, Senior Mod, and Mod can access this panel.</p>
        {error ? <p className="error">{ERRORS[error] || error}</p> : null}
        <Link className="btn primary" href="/api/auth/discord">
          Continue with Discord
        </Link>
      </div>
    </div>
  );
}
