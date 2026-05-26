# Railway Build Fix

Fixed for Railway error:

`Error: Failed to read app source directory`
`No such file or directory (os error 2)`

Cause: Railway service Root Directory was configured as `backend`, but the repository did not include a `backend/` directory.

This version places the full Node app inside `backend/`, so the existing Railway service can build successfully.
