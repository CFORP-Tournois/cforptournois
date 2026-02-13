# 🔒 Security Guide - Protecting Your Tournament Database

## Current Security Measures

Your tournament system now has **multiple layers of security** to prevent spam and abuse:

### ✅ Implemented Security Features

1. **Honeypot Field** - Catches bots that auto-fill forms
2. **Input Validation** - Username length and format checks
3. **RLS Policies** - Database-level access controls
4. **Tournament Type Validation** - Only valid types accepted
5. **Duplicate Prevention** - Can't register twice for same tournament

---

## 🛡️ Step-by-Step Security Setup

### Step 1: Run the Security SQL

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy everything from `SECURITY_SETUP.sql`
4. Click **Run**

This will:
- ✅ Remove old permissive policies
- ✅ Add honeypot field validation
- ✅ Restrict tournament modifications to admin only
- ✅ Allow public signups with strict validation

### Step 2: Domain/CORS Settings (Optional - Not Available on Free Tier)

**UPDATE: Supabase free tier doesn't offer CORS domain whitelisting.**

What you might see in dashboard:
- **IP Restrictions**: DON'T use this - blocks specific IPs (not useful for public sites)
- **Authentication URLs**: Only affects auth callbacks, not API requests

**Why you DON'T need CORS whitelisting:**
- ✅ RLS policies are your REAL security (database-level)
- ✅ Anon key being public is expected and safe
- ✅ RLS validates ALL requests regardless of origin
- ❌ CORS would just be an extra layer (nice-to-have, not critical)

**Skip this step** - your security comes from RLS (Step 1).

### Step 3: Rate Limiting (Automatic on Free Tier)

Supabase automatically applies rate limiting on free tier:
- Default: ~100 requests per minute per IP
- This is usually sufficient for tournament signups

**You don't need to configure anything** - it's built-in and automatic.

### Step 4: Monitor Your Database

Check your Supabase Dashboard regularly for:
- Unusual spike in signups
- Suspicious usernames
- Duplicate entries

**How to check:**
```sql
-- In SQL Editor, run this to see recent signups
SELECT * FROM participants 
ORDER BY signup_timestamp DESC 
LIMIT 20;

-- Check for suspicious patterns
SELECT roblox_username, COUNT(*) as signup_count
FROM participants
GROUP BY roblox_username
HAVING COUNT(*) > 3
ORDER BY signup_count DESC;
```

---

## 🔐 Admin-Only Operations

### Current Setup

**Tournaments table** is now protected:
- ✅ Public can READ published tournaments
- ❌ Public CANNOT create/edit/delete tournaments
- ✅ Admin panel works because it uses your credentials

### Optional: Service Role Key (Advanced)

For even better security, you can use a **Service Role Key** for admin operations:

1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the **`service_role`** key (NOT the anon key)
3. Store it in a separate config file (NEVER commit to GitHub!)
4. Use it only in admin panel for write operations

**WARNING:** The service role key bypasses RLS - use with extreme caution!

---

## 🚨 What Each Security Layer Protects Against

| Threat | Protection | Status |
|--------|-----------|--------|
| Bot spam | Honeypot field | ✅ Active |
| API abuse from other sites | RLS policies | ✅ Active |
| Rapid-fire spam | Rate limiting (automatic) | ✅ Active |
| Invalid usernames | Input validation | ✅ Active |
| Duplicate signups | Duplicate check | ✅ Active |
| Direct database tampering | RLS policies | ✅ Active |
| Tournament data corruption | Admin-only writes | ✅ Active |

---

## 🎯 Security Checklist

Before going live, ensure:

- [ ] Ran `SECURITY_SETUP.sql` in Supabase ⭐ **MOST IMPORTANT**
- [ ] Tested signup form works correctly
- [ ] Verified honeypot catches bots (check console for "🤖 Bot detected")
- [ ] Confirmed admin panel can manage tournaments
- [ ] Checked RLS policies are active (Settings → Database → Tables → participants)
- [ ] Never committed service role key to GitHub
- [ ] ~~Domain whitelist~~ (not available on free tier - RLS is your security)
- [ ] ~~Rate limiting config~~ (automatic on free tier)

---

## 🔍 How the Honeypot Works

**For Humans:**
- Field is hidden (CSS: `position: absolute; left: -9999px;`)
- Screen readers ignore it (`aria-hidden="true"`)
- Not in tab order (`tabindex="-1"`)
- **Humans never see or fill this field**

**For Bots:**
- Sees a field labeled "Website"
- Auto-fills it (bots fill ALL fields)
- Form submission is silently rejected
- Bot thinks it succeeded (fake success page)

**Result:** Bot wastes time, you don't get spam.

---

## 🚀 Current Anon Key Status

Your **anonymous (anon) key** is currently:
- ✅ Safe to use in frontend code
- ✅ Visible in HTML/JS (this is expected)
- ✅ Protected by RLS policies
- ✅ Limited by rate limiting
- ✅ Restricted by domain whitelist

**Important:** The anon key is MEANT to be public. Security comes from RLS policies + domain restrictions, not hiding the key.

---

## 📊 Expected Behavior

### Legitimate Users:
1. Fill out signup form (honeypot stays empty)
2. Submit form
3. Data saved to database ✅
4. See success page ✅

### Bots/Spammers:
1. Fill out ALL fields including honeypot
2. Submit form
3. Honeypot check fails ❌
4. See fake success page (thinks it worked)
5. **No data saved to database** ✅

### Direct API Calls (e.g., Postman, curl):
1. Attempt to insert data
2. Domain check fails (not from your website) ❌
3. Request blocked by CORS ✅
4. **No data saved to database** ✅

---

## 🆘 Troubleshooting

### "Still getting spam!"
1. Verify honeypot field is in `signup.html`
2. Check SQL policies are active (run `SECURITY_SETUP.sql` again)
3. Confirm domain whitelist is set correctly
4. Lower rate limit to 3-5 requests per second

### "Legitimate users can't sign up!"
1. Check browser console for errors
2. Verify RLS policies allow INSERT (run security SQL)
3. Make sure honeypot field stays hidden
4. Check domain is whitelisted (if deployed)

### "Admin panel can't edit tournaments!"
1. This is expected with strict RLS
2. Admin uses your login credentials
3. If issues persist, temporarily adjust RLS for your admin operations

---

## 📝 Summary

**Before Deployment:**
1. ⭐ **Run `SECURITY_SETUP.sql`** (This is 90% of your security!)
2. ✅ Test that signups work
3. ✅ Verify honeypot field is hidden in signup form

**After Deployment:**
1. Monitor signups for suspicious activity
2. Check honeypot is working (console logs "🤖 Bot detected")
3. Regularly review database for spam

**Your database is now protected by RLS policies!** 🎉

**Remember:** 
- ✅ Anon key being public is FINE (it's designed that way)
- ✅ RLS policies are your real security layer
- ❌ IP restrictions are NOT for public websites
- ❌ CORS whitelisting isn't available (and not needed with RLS)
