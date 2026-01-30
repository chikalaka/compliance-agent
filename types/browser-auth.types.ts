export interface SessionStatus {
  authenticated: boolean
  services: {
    github: boolean
    linear: boolean
    googleWorkspace: boolean
    aws: boolean
  }
}
