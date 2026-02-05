import { createClient } from "@/lib/supabase/server"
import { AccountSettings } from "@/components/account-settings"

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and security
        </p>
      </div>

      <AccountSettings user={user} />
    </div>
  )
}
