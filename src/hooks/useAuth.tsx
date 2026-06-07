import React, { createContext, useContext, useState } from 'react'
import type { User, Role, Permission } from '@/types'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'view_mission_control','view_platform_stack','view_core_modules','view_native_runtime',
    'view_packos','view_official_addons','view_official_experiences','view_launcher',
    'view_release_manager','view_signing','view_addon_review','view_diagnostics',
    'view_ai_agents','view_terminal','view_settings','edit_module','edit_packos_policy',
    'run_validation','run_build','run_migration_agent','package_release','sign_artifact',
    'publish_catalog','approve_addon','reject_addon','block_addon','access_support_bundle',
    'run_terminal_commands','manage_ai_agents',
  ],
  platform_admin: [
    'view_mission_control','view_platform_stack','view_core_modules','view_native_runtime',
    'view_packos','view_official_addons','view_official_experiences','view_launcher',
    'view_release_manager','view_addon_review','view_diagnostics','view_ai_agents',
    'view_terminal','view_settings','edit_module','edit_packos_policy','run_validation',
    'run_build','run_migration_agent','package_release','publish_catalog','approve_addon',
    'reject_addon','block_addon','access_support_bundle','run_terminal_commands','manage_ai_agents',
  ],
  echo_developer: [
    'view_mission_control','view_platform_stack','view_core_modules','view_native_runtime',
    'view_packos','view_official_addons','view_official_experiences','view_launcher',
    'view_release_manager','view_addon_review','view_diagnostics','view_ai_agents',
    'view_terminal','view_settings','edit_module','run_validation','run_build',
    'run_migration_agent','access_support_bundle','run_terminal_commands','manage_ai_agents',
  ],
  module_maintainer: [
    'view_mission_control','view_platform_stack','view_core_modules','view_packos',
    'view_official_addons','view_diagnostics','view_terminal','view_settings',
    'edit_module','run_validation','run_build','access_support_bundle','run_terminal_commands',
  ],
  runtime_developer: [
    'view_mission_control','view_platform_stack','view_core_modules','view_native_runtime',
    'view_packos','view_diagnostics','view_ai_agents','view_terminal','view_settings',
    'edit_module','run_validation','run_build','run_migration_agent','run_terminal_commands','manage_ai_agents',
  ],
  packos_admin: [
    'view_mission_control','view_platform_stack','view_core_modules','view_native_runtime',
    'view_packos','view_official_addons','view_official_experiences','view_launcher',
    'view_diagnostics','view_ai_agents','view_terminal','view_settings',
    'edit_packos_policy','run_validation','run_build','package_release','access_support_bundle',
    'run_terminal_commands','manage_ai_agents',
  ],
  launcher_developer: [
    'view_mission_control','view_launcher','view_release_manager','view_diagnostics',
    'view_terminal','view_settings','run_validation','run_build','package_release',
    'run_terminal_commands',
  ],
  release_manager: [
    'view_mission_control','view_platform_stack','view_core_modules','view_native_runtime',
    'view_packos','view_official_addons','view_official_experiences','view_launcher',
    'view_release_manager','view_signing','view_addon_review','view_diagnostics',
    'view_ai_agents','view_terminal','view_settings','run_validation','run_build',
    'package_release','publish_catalog','access_support_bundle','run_terminal_commands',
    'manage_ai_agents',
  ],
  signing_admin: [
    'view_mission_control','view_release_manager','view_signing','view_settings','sign_artifact',
  ],
  addon_reviewer: [
    'view_mission_control','view_addon_review','view_diagnostics','view_terminal',
    'view_settings','approve_addon','reject_addon','access_support_bundle','run_terminal_commands',
  ],
  support_engineer: [
    'view_mission_control','view_diagnostics','view_terminal','view_settings',
    'access_support_bundle','run_terminal_commands',
  ],
  viewer: [
    'view_mission_control','view_platform_stack','view_core_modules','view_native_runtime',
    'view_packos','view_official_addons','view_official_experiences','view_launcher',
    'view_diagnostics',
  ],
}

interface AuthContextType {
  user: User
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children, role = 'owner' }: { children: React.ReactNode; role?: Role }) {
  const [user] = useState<User>({
    id: '1',
    name: 'ECHO Developer',
    email: 'dev@echolabs.local',
    role,
    permissions: ROLE_PERMISSIONS[role],
  })

  const can = (permission: Permission) => user.permissions.includes(permission)

  return (
    <AuthContext.Provider value={{ user, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
