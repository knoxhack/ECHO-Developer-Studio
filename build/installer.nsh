; Custom NSIS installer script for ECHO Developer Studio
; This runs during the electron-builder NSIS build process

!macro customInit
  ; Check if ECHO Developer Studio is already running
  ; Note: nsProcess plugin not available, skipping process check
  ; Users should close the app manually before installing
!macroend

!macro customInstall
  ; Create the .echo-studio directory in user home for audit logs
  CreateDirectory "$PROFILE\.echo-studio"
!macroend

!macro customUninstall
  ; Clean up user data on uninstall (optional - commented out to preserve settings)
  ; RMDir /r "$PROFILE\.echo-studio"
!macroend
