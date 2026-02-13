# Dynamic Tournament Management Guide

## What Changed?

Your tournament system is now **fully dynamic**! No more editing HTML files. Everything is managed through the admin panel and stored in Supabase.

## How to Manage Tournaments

### Accessing the Admin Panel

1. Go to `admin.html`
2. Log in with your password
3. Click the **"Manage Tournaments"** tab

### Creating a New Tournament

1. Click **"➕ Create New Tournament"**
2. Fill out the form:
   - **French Section**: Name, subtitle, description, format (in French)
   - **English Section**: Name, subtitle, description, format (in English)
   - **Settings**: 
     - Game Platform (e.g., "Roblox", "Kahoot")
     - Tournament Type (pvp, all-ages, custom)
     - Date & Time
     - Max Participants
     - Status (Draft/Published/Completed/Archived)
     - Display Order (controls which shows up first)
3. Click **"💾 Save Tournament"**

### Editing a Tournament

1. Find the tournament in the table
2. Click **"✏️ Edit"**
3. Update any fields
4. Click **"💾 Save Tournament"**

### Deleting a Tournament

1. Find the tournament in the table
2. Click **"🗑️ Delete"**
3. Confirm deletion

## Tournament Statuses

- **Draft**: Not visible on the website (work in progress)
- **Published**: Visible on landing page and signup form
- **Completed**: Archived but still in database
- **Archived**: Hidden from main view

## What's Dynamic Now?

✅ **Landing Page** (`index.html`)
- Tournament cards are generated from database
- Countdowns update automatically
- Bilingual support (FR/EN toggle)

✅ **Signup Form** (`signup.html`)
- Tournament options load from database
- Pre-selects tournament from URL parameter
- Updates when you add/edit/delete tournaments

✅ **Admin Panel** (`admin.html`)
- View all tournaments
- Create/Edit/Delete tournaments
- Full bilingual management

## Database Structure

Your `tournaments` table contains:
```
- id (UUID)
- name_fr / name_en
- subtitle_fr / subtitle_en
- description_fr / description_en
- format_fr / format_en
- game_platform (e.g., "Roblox", "Kahoot")
- tournament_type (pvp, all-ages, custom)
- tournament_date (timestamp)
- tournament_time (display string, e.g., "14h00 - 16h00")
- max_participants (number)
- status (draft, published, completed, archived)
- display_order (number, lower = shows first)
- created_at / updated_at
```

## Tips

- **Display Order**: Use 1, 2, 3... to control which tournaments appear first
- **Status**: Only "published" tournaments appear on the website
- **Dates**: Use the date picker for accurate countdowns
- **Time Display**: Can be different from the actual tournament_date (e.g., "14h00 - 16h00" shows while countdown uses exact timestamp)
- **Bilingual**: BOTH French and English names are required for best user experience

## No More Hardcoded Changes!

🚫 **Don't edit these anymore:**
- ~~index.html tournament cards~~
- ~~signup.html tournament options~~
- ~~Tournament configuration objects~~

✅ **Instead, use the admin panel!**

All changes are instant and automatically reflected on:
- Landing page
- Signup form
- Countdown timers
- Bilingual translations

---

**Questions?** Check the existing RIVALS and Ultimate Driving tournaments in the admin panel to see examples of how everything is set up.
