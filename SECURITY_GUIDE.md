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

### Step 2: Configure Domain Whitelist (CRITICAL!)

**This is the most important step!**

1. Go to Supabase Dashboard → **Settings** → **API**
2. Scroll to **"Allowed Domains"** or **"CORS Settings"**
3. Remove `*` (wildcard) if present
4. Add ONLY your GitHub Pages URL:
   ```
   https://yourusername.github.io
   ```
   Or your custom domain if you have one.

**What this does:** Prevents anyone from using your API keys on their own website or scripts.

### Step 3: Enable Rate Limiting

1. Go to Supabase Dashboard → **Settings** → **API**
2. Find **"Rate Limiting"** section
3. Set to: **10 requests per second** (free tier default)
4. Consider lowering to **5 requests per second** for extra protection

**What this does:** Prevents rapid-fire spam from single IP addresses.

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
| API abuse from other sites | Domain whitelist | ⚠️ Configure in dashboard |
| Rapid-fire spam | Rate limiting | ⚠️ Configure in dashboard |
| Invalid usernames | Input validation | ✅ Active |
| Duplicate signups | Duplicate check | ✅ Active |
| Direct database tampering | RLS policies | ✅ Active |
| Tournament data corruption | Admin-only writes | ✅ Active |

---

## 🎯 Security Checklist

Before going live, ensure:

- [ ] Ran `SECURITY_SETUP.sql` in Supabase
- [ ] Added domain whitelist (GitHub Pages URL only)
- [ ] Enabled rate limiting (10 req/sec or lower)
- [ ] Tested signup form works correctly
- [ ] Verified honeypot catches bots
- [ ] Confirmed admin panel can manage tournaments
- [ ] Checked RLS policies are active (Settings → Database → Tables)
- [ ] Never committed service role key to GitHub

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
1. ✅ Run `SECURITY_SETUP.sql`
2. ✅ Configure domain whitelist in Supabase
3. ✅ Enable rate limiting

**After Deployment:**
1. Monitor signups for suspicious activity
2. Check honeypot is working (console logs "🤖 Bot detected")
3. Regularly review database for spam

**Your database is now MUCH more secure!** 🎉
