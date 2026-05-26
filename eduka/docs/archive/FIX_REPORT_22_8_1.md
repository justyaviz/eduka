# Fix Report 22.8.1

Implemented persistent image storage via GitHub Contents API.

## What it fixes
Previously profile images/logos could only be saved as URLs or not saved permanently. This update lets Eduka upload images to GitHub under the relevant center/branch folder and store the resulting raw URL in PostgreSQL.

## Important
Railway filesystem is not permanent. GitHub asset storage requires `GITHUB_ASSETS_TOKEN` and `GITHUB_ASSETS_REPO`. Use a separate public repository such as `justyaviz/eduka-assets` to avoid redeploying the main Eduka app on every image upload.
