export type Role =
  | 'owner'
  | 'platform_admin'
  | 'echo_developer'
  | 'module_maintainer'
  | 'runtime_developer'
  | 'packos_admin'
  | 'launcher_developer'
  | 'release_manager'
  | 'signing_admin'
  | 'addon_reviewer'
  | 'support_engineer'
  | 'viewer'

export type Permission =
  | 'view_mission_control'
  | 'view_platform_stack'
  | 'view_core_modules'
  | 'view_native_runtime'
  | 'view_packos'
  | 'view_official_addons'
  | 'view_official_experiences'
  | 'view_launcher'
  | 'view_release_manager'
  | 'view_signing'
  | 'view_addon_review'
  | 'view_diagnostics'
  | 'view_ai_agents'
  | 'view_terminal'
  | 'view_settings'
  | 'edit_module'
  | 'edit_packos_policy'
  | 'run_validation'
  | 'run_build'
  | 'run_migration_agent'
  | 'package_release'
  | 'sign_artifact'
  | 'publish_catalog'
  | 'approve_addon'
  | 'reject_addon'
  | 'block_addon'
  | 'access_support_bundle'
  | 'run_terminal_commands'
  | 'manage_ai_agents'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  permissions: Permission[]
}

export type ModuleStatus = 'healthy' | 'warning' | 'blocker' | 'in_review' | 'ready'

export interface ECHOModule {
  id: string
  name: string
  version: string
  owner: string
  status: ModuleStatus
  buildResult: string
  dependencies: string[]
  apiStability: number
  nativeReadiness: number
  testCoverage: number
  openIssues: number
  lastCommit: string
  releaseChannel: string
}

export interface Addon {
  id: string
  name: string
  version: string
  status: ModuleStatus
  dependencies: string[]
  missionCoverage: number
  recipeCoverage: number
  assetHealth: number
  nativeReadiness: number
  packInclusion: boolean
  releaseReady: boolean
}

export interface Experience {
  id: string
  name: string
  type: string
  target: string
  policy: string
  releaseChannel: string
  requiredModules: string[]
  optionalModules: string[]
  buildStatus: ModuleStatus
  knownBlockers: number
}

export interface Submission {
  id: string
  addonName: string
  developer: string
  namespace: string
  targetExperience: string
  trustLevel: string
  requestType: string
  packosResult: string
  permissions: string
  nativeStatus: string
  status: 'new' | 'automated' | 'needs_review' | 'changes_requested' | 'approved' | 'rejected' | 'published' | 'blocked'
}

export type RiskLevel = 'low' | 'medium' | 'high'

export interface AuditEntry {
  id: string
  actor: string
  action: string
  target: string
  timestamp: string
  risk: RiskLevel
}
