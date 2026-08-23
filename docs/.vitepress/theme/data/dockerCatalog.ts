export type DockerEvidenceStatus = 'verified' | 'partial' | 'documented' | 'unsupported'
export type DockerRunMode = 'container' | 'custom-image' | 'native' | 'browser'

export interface DockerImageRef {
  role: 'builder' | 'runtime' | 'server' | 'client'
  tag: string
  digest?: string
  digestKey?: string
  source: 'official' | 'vendor' | 'custom-official-base' | 'native'
}

export interface DockerCatalogEntry {
  id: string
  name: string
  mode: DockerRunMode
  status: DockerEvidenceStatus
  images: DockerImageRef[]
  toolRoots: string[]
  keyTools: string[]
  buildCommand: string
  runCommand: string
  note?: string
}

export const dockerCatalog: DockerCatalogEntry[] = [
  {
    id: 'bash', name: 'bash', mode: 'container', status: 'partial',
    images: [{ role: 'runtime', tag: 'bash:5.2', digestKey: 'BASH_IMAGE', source: 'official' }],
    toolRoots: ['shell builtins', '/usr/local/bin', '/usr/bin', '/bin'], keyTools: ['bash', 'help', 'compgen'],
    buildCommand: 'bash -n script.sh', runCommand: 'bash script.sh',
  },
  {
    id: 'zsh', name: 'zsh', mode: 'custom-image', status: 'partial',
    images: [{ role: 'runtime', tag: 'alpine:3.22 + zsh', digestKey: 'ALPINE_IMAGE', source: 'custom-official-base' }],
    toolRoots: ['zsh builtins', '/usr/bin', '/bin'], keyTools: ['zsh', 'whence'],
    buildCommand: 'zsh -n script.zsh', runCommand: 'zsh script.zsh',
  },
  {
    id: 'fish', name: 'fish', mode: 'custom-image', status: 'partial',
    images: [{ role: 'runtime', tag: 'alpine:3.22 + fish', digestKey: 'ALPINE_IMAGE', source: 'custom-official-base' }],
    toolRoots: ['fish builtins', '/usr/bin', '/bin'], keyTools: ['fish', 'functions', 'type'],
    buildCommand: 'fish --no-execute script.fish', runCommand: 'fish script.fish',
  },
  {
    id: 'powershell', name: 'PowerShell', mode: 'container', status: 'partial',
    images: [
      { role: 'runtime', tag: 'mcr.microsoft.com/powershell:7.5-debian-12', digestKey: 'POWERSHELL_IMAGE', source: 'vendor' },
      { role: 'runtime', tag: 'Windows runner: PowerShell 5/7', source: 'native' },
    ],
    toolRoots: ['Get-Command -CommandType Cmdlet,Function,Application'], keyTools: ['pwsh', 'Get-Command', 'Get-Module', 'Get-Help'],
    buildCommand: 'Invoke-ScriptAnalyzer（若已安装）/ PowerShell parser', runCommand: 'pwsh -NoProfile -File script.ps1',
    note: '产品页同时呈现 Linux 容器内 PowerShell 7 与 Windows runner 原生 PowerShell 5/7。',
  },
  {
    id: 'cmd', name: 'cmd', mode: 'native', status: 'partial',
    images: [{ role: 'runtime', tag: 'Windows runner native', source: 'native' }],
    toolRoots: ['cmd builtins', 'System32 PATH'], keyTools: ['cmd', 'where', 'help'],
    buildCommand: 'cmd /d /c script.bat', runCommand: 'cmd /d /c script.bat',
    note: 'cmd 属于 Windows 原生运行体，不虚构 Docker 支持；证据由 Windows Actions runner 采集。',
  },
]

export const dockerCatalogById = Object.fromEntries(dockerCatalog.map((entry) => [entry.id, entry])) as Record<string, DockerCatalogEntry>
