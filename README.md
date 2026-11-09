# The 365

David Cash's year of realistic daily non-negotiables. It's a static web app built to run as an iPhone home-screen app.

## Deploy (GitHub Pages)
1. Create a repo called `the365` under `cashlabsltd` and upload every file in this folder to it, keeping the `icons/` folder.
2. In the repo, go to Settings › Pages › Source: "Deploy from a branch", choose `main` and `/ (root)`, then Save.
3. After about a minute it's live at https://cashlabsltd.github.io/the365/

## Install on iPhone
Open the link in Safari, tap Share, then "Add to Home Screen".

## Custom domain later
Add a CNAME DNS record `365` pointing to `cashlabsltd.github.io`, then enter `365.davidcash.ca` under Settings › Pages › Custom domain.

## Data
Everything is stored on the device (localStorage). Use Setup › Export backup regularly. Cloud sync (Supabase) is planned for phase 2.
