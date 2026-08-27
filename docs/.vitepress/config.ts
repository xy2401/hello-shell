import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'

const base = process.env.DOCS_BASE || '/'

const crossOriginIsolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

function crossOriginIsolationPlugin() {
  const installHeaders = (server: any) => {
    server.middlewares.use((_req: any, res: any, next: any) => {
      for (const [name, value] of Object.entries(crossOriginIsolationHeaders)) {
        res.setHeader(name, value)
      }
      next()
    })
  }

  return {
    name: 'hello-shell:cross-origin-isolation',
    configureServer: installHeaders,
    configurePreviewServer: installHeaders,
  }
}

export default defineConfig({
  markdown: {
    languageAliases: {
      elvish: 'bash',
      murex: 'bash',
      ysh: 'bash',
      rc: 'bash',
      oils: 'bash',
      dash: 'bash',
      ash: 'bash',
      nushell: 'bash'
    }
  },
  title: 'Hello Shell',
  titleTemplate: ':title | Shell 手册',
  description:
    'Shell 与命令行统一任务矩阵：bash/zsh/fish/cmd/PowerShell 同任务对照与真实输出快照 (Shell & Command Line Task Matrix)',
  lang: 'zh-CN',
  base,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }]],
  vite: {
    plugins: [crossOriginIsolationPlugin()],
    server: {
      headers: crossOriginIsolationHeaders,
    },
    preview: {
      headers: crossOriginIsolationHeaders,
    },
    resolve: {
      alias: {
        'node:zlib': fileURLToPath(new URL('./theme/shims/zlib.ts', import.meta.url)),
      },
    },
  },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Bash', link: '/products/bash/' },
      { text: 'zsh', link: '/products/zsh/' },
      { text: 'fish', link: '/products/fish/' },
      { text: 'cmd', link: '/products/cmd/' },
      { text: 'PowerShell', link: '/products/powershell/' },
      {
        text: '📦 更多',
        items: [
          { text: '👑 Nushell', link: '/products/nushell/' },
          { text: '🛢️ Oils for Unix', link: '/products/oils/' },
          { text: '🧝 Elvish', link: '/products/elvish/' },
          { text: '🪐 rc', link: '/products/rc/' },
          { text: '🦕 Murex', link: '/products/murex/' },
          { text: '⚡ Dash', link: '/products/dash/' },
          { text: '🪨 Ash (BusyBox)', link: '/products/ash/' },
        ],
      },
      { text: '🧪 实验台', link: '/playground/' },
      { text: '⚖️ 对比矩阵', link: '/matrix/' },
      { text: '📚 参考资料', link: '/reference/' },
    ],
    sidebar: {
      '/products/bash/': [
        { text: 'bash', items: [
          { text: '概览', link: '/products/bash/' },
          { text: '语法与语义', link: '/products/bash/syntax' },
          { text: '参数与位置变量', link: '/products/bash/args' },
          { text: '常见坑位', link: '/products/bash/pitfalls' },
          {
            text: '版本演进',
            link: '/products/bash/version/',
            collapsed: false,
            items: [
              { text: "Bash 5.3", link: '/products/bash/version/bash-5.3' },
              { text: "Bash 5.2", link: '/products/bash/version/bash-5.2' },
              { text: "Bash 5.1", link: '/products/bash/version/bash-5.1' },
              { text: "Bash 5.0", link: '/products/bash/version/bash-5.0' },
              { text: "Bash 4.4", link: '/products/bash/version/bash-4.4' },
              { text: "Bash 4.0", link: '/products/bash/version/bash-4.0' },
            ],
          },
          { text: 'Docker 验证', link: '/products/bash/DockerTooling' },
        ] },
      ],
      '/products/zsh/': [
        { text: 'zsh', items: [
          { text: '概览', link: '/products/zsh/' },
          { text: '语法与展开', link: '/products/zsh/syntax' },
          { text: '参数与选项', link: '/products/zsh/args' },
          { text: '常见坑位', link: '/products/zsh/pitfalls' },
          {
            text: '版本演进',
            link: '/products/zsh/version/',
            collapsed: false,
            items: [
              { text: "Zsh 5.9", link: '/products/zsh/version/zsh-5.9' },
              { text: "Zsh 5.8", link: '/products/zsh/version/zsh-5.8' },
              { text: "Zsh 5.0", link: '/products/zsh/version/zsh-5.0' },
            ],
          },
          { text: 'Docker 验证', link: '/products/zsh/DockerTooling' },
        ] },
      ],
      '/products/fish/': [
        { text: 'fish', items: [
          { text: '概览', link: '/products/fish/' },
          { text: '语法与交互', link: '/products/fish/syntax' },
          { text: '参数与选项', link: '/products/fish/args' },
          { text: '常见坑位', link: '/products/fish/pitfalls' },
          {
            text: '版本演进',
            link: '/products/fish/version/',
            collapsed: false,
            items: [
              { text: "Fish 4.2", link: '/products/fish/version/fish-4.2' },
              { text: "Fish 4.0", link: '/products/fish/version/fish-4.0' },
              { text: "Fish 3.7", link: '/products/fish/version/fish-3.7' },
              { text: "Fish 3.0", link: '/products/fish/version/fish-3.0' },
            ],
          },
          { text: 'Docker 验证', link: '/products/fish/DockerTooling' },
        ] },
      ],
      '/products/cmd/': [
        { text: 'cmd', items: [
          { text: '概览', link: '/products/cmd/' },
          { text: '批处理语法', link: '/products/cmd/syntax' },
          { text: '参数与变量', link: '/products/cmd/args' },
          { text: '常见坑位', link: '/products/cmd/pitfalls' },
          {
            text: '版本演进',
            link: '/products/cmd/version/',
            collapsed: false,
            items: [
              { text: "Windows 11 / Server 2022 CMD", link: '/products/cmd/version/windows-11-server-2022-cmd' },
              { text: "Windows 10 CMD", link: '/products/cmd/version/windows-10-cmd' },
              { text: "Windows 2000 / NT 4.0 CMD", link: '/products/cmd/version/windows-2000-nt-4.0-cmd' },
            ],
          },
          { text: 'Docker 验证', link: '/products/cmd/DockerTooling' },
        ] },
      ],
      '/products/powershell/': [
        { text: 'PowerShell', items: [
          { text: '概览', link: '/products/powershell/' },
          { text: '语法与管道', link: '/products/powershell/syntax' },
          { text: '参数与对象', link: '/products/powershell/args' },
          { text: '常见坑位', link: '/products/powershell/pitfalls' },
          {
            text: '版本演进',
            link: '/products/powershell/version/',
            collapsed: false,
            items: [
              { text: "PowerShell 7.6 LTS", link: '/products/powershell/version/powershell-7.6' },
              { text: "PowerShell 7.4 LTS", link: '/products/powershell/version/powershell-7.4' },
              { text: "PowerShell 7.2 LTS", link: '/products/powershell/version/powershell-7.2' },
              { text: "PowerShell 7.0", link: '/products/powershell/version/powershell-7.0' },
              { text: "PowerShell Core 6.0", link: '/products/powershell/version/powershell-core-6.0' },
              { text: "Windows PowerShell 5.1", link: '/products/powershell/version/windows-powershell-5.1' },
            ],
          },
          { text: 'Docker 验证', link: '/products/powershell/DockerTooling' },
        ] },
      ],
      '/products/nushell/': [
        { text: '👑 Nushell', items: [
          { text: '概览', link: '/products/nushell/' },
          { text: '语法与特性', link: '/products/nushell/syntax' },
          { text: '参数与交互', link: '/products/nushell/args' },
          { text: '常见坑位', link: '/products/nushell/pitfalls' },
          {
            text: '版本演进',
            link: '/products/nushell/version/',
            collapsed: false,
            items: [
              { text: "Nushell 0.115", link: '/products/nushell/version/nushell-0.115' },
            ],
          },
        ] },
      ],
      '/products/oils/': [
        { text: '🛢️ Oils for Unix', items: [
          { text: '概览', link: '/products/oils/' },
          { text: '语法与特性', link: '/products/oils/syntax' },
          { text: '参数与交互', link: '/products/oils/args' },
          { text: '常见坑位', link: '/products/oils/pitfalls' },
          {
            text: '版本演进',
            link: '/products/oils/version/',
            collapsed: false,
            items: [
              { text: "Oils 0.24", link: '/products/oils/version/oils-0.24' },
              { text: "Oils 0.20", link: '/products/oils/version/oils-0.20' },
            ],
          },
        ] },
      ],
      '/products/elvish/': [
        { text: '🧝 Elvish', items: [
          { text: '概览', link: '/products/elvish/' },
          { text: '语法与特性', link: '/products/elvish/syntax' },
          { text: '参数与交互', link: '/products/elvish/args' },
          { text: '常见坑位', link: '/products/elvish/pitfalls' },
          {
            text: '版本演进',
            link: '/products/elvish/version/',
            collapsed: false,
            items: [
              { text: "Elvish 0.21", link: '/products/elvish/version/elvish-0.21' },
              { text: "Elvish 0.20", link: '/products/elvish/version/elvish-0.20' },
            ],
          },
        ] },
      ],
      '/products/rc/': [
        { text: '🪐 rc', items: [
          { text: '概览', link: '/products/rc/' },
          { text: '语法与特性', link: '/products/rc/syntax' },
          { text: '参数与交互', link: '/products/rc/args' },
          { text: '常见坑位', link: '/products/rc/pitfalls' },
          {
            text: '版本演进',
            link: '/products/rc/version/',
            collapsed: false,
            items: [
              { text: "rc 1.7", link: '/products/rc/version/rc-1.7' },
              { text: "Plan 9 rc", link: '/products/rc/version/plan-9-rc' },
            ],
          },
        ] },
      ],
      '/products/murex/': [
        { text: '🦕 Murex', items: [
          { text: '概览', link: '/products/murex/' },
          { text: '语法与特性', link: '/products/murex/syntax' },
          { text: '参数与交互', link: '/products/murex/args' },
          { text: '常见坑位', link: '/products/murex/pitfalls' },
          {
            text: '版本演进',
            link: '/products/murex/version/',
            collapsed: false,
            items: [
              { text: "Murex 7.x", link: '/products/murex/version/murex-7.x' },
              { text: "Murex 6.x", link: '/products/murex/version/murex-6.x' },
            ],
          },
        ] },
      ],
      '/products/dash/': [
        { text: '⚡ Dash', items: [
          { text: '概览', link: '/products/dash/' },
          { text: '语法与特性', link: '/products/dash/syntax' },
          { text: '参数与交互', link: '/products/dash/args' },
          { text: '常见坑位', link: '/products/dash/pitfalls' },
          {
            text: '版本演进',
            link: '/products/dash/version/',
            collapsed: false,
            items: [
              { text: "dash 0.5.12", link: '/products/dash/version/dash-0.5.12' },
              { text: "dash 0.5.11", link: '/products/dash/version/dash-0.5.11' },
            ],
          },
        ] },
      ],
      '/products/ash/': [
        { text: '🪨 Ash (BusyBox)', items: [
          { text: '概览', link: '/products/ash/' },
          { text: '语法与特性', link: '/products/ash/syntax' },
          { text: '参数与交互', link: '/products/ash/args' },
          { text: '常见坑位', link: '/products/ash/pitfalls' },
          {
            text: '版本演进',
            link: '/products/ash/version/',
            collapsed: false,
            items: [
              { text: "BusyBox 1.37", link: '/products/ash/version/busybox-1.37' },
              { text: "BusyBox 1.36", link: '/products/ash/version/busybox-1.36' },
            ],
          },
        ] },
      ],
      '/products/': [
        {
          text: 'Shell 目录',
          items: [
            { text: 'bash', link: '/products/bash/' },
            { text: 'zsh', link: '/products/zsh/' },
            { text: 'fish', link: '/products/fish/' },
            { text: 'cmd', link: '/products/cmd/' },
            { text: 'PowerShell', link: '/products/powershell/' },
            { text: '👑 Nushell', link: '/products/nushell/' },
            { text: '🛢️ Oils for Unix', link: '/products/oils/' },
            { text: '🧝 Elvish', link: '/products/elvish/' },
            { text: '🪐 rc', link: '/products/rc/' },
            { text: '🦕 Murex', link: '/products/murex/' },
            { text: '⚡ Dash', link: '/products/dash/' },
            { text: '🪨 Ash (BusyBox)', link: '/products/ash/' },
          ],
        },
      ],
      '/playground/': [
        {
          text: '浏览器实验台',
          items: [
            { text: '实验台总览', link: '/playground/' },
            { text: 'JUST-BASH', link: '/playground/just-bash' },
            { text: 'BusyBox', link: '/playground/busybox' },
            { text: 'Pyodide', link: '/playground/pyodide' },
            { text: 'V86', link: '/playground/v86' },
            { text: 'c2w', link: '/playground/c2w-alpine' },
            { text: 'c2w (Shell+Py)', link: '/playground/c2w-shell' },
            { text: 'c2w (PowerShell)', link: '/playground/c2w-powershell' },
          ],
        },
      ],
      '/matrix/': [
        {
          text: '对比矩阵',
          items: [
            { text: '矩阵总览', link: '/matrix/' },
            { text: '统一任务实验', link: '/matrix/experiments' },
            { text: '变量与引号', link: '/matrix/quoting-variables' },
            { text: '控制流', link: '/matrix/control-flow' },
            { text: '函数与管道', link: '/matrix/functions-pipes' },
            { text: '错误与信号', link: '/matrix/errors-signals' },
            { text: '入参矩阵', link: '/matrix/args-matrix' },
            { text: '可移植性矩阵', link: '/matrix/portability-matrix' },
            { text: 'Shell vs Python', link: '/matrix/comparison/shell-vs-python' },
            { text: 'Docker 与命令工具', link: '/matrix/docker-tools' },
          ],
        },
      ],
      '/reference/': [
        {
          text: '参考资料',
          items: [
            { text: '参考资料总览', link: '/reference/' },
            { text: '快速上手', link: '/reference/getting-started' },
            { text: '版本政策', link: '/reference/version-policy' },
            { text: '证据政策', link: '/reference/evidence-policy' },
            { text: '官方资料基线', link: '/reference/sources' },
            { text: '编程语言 Shell (REPL)', link: '/reference/lang-repl' },
            { text: '特定领域 Shell', link: '/reference/domain-repl' },
          ],
        },
      ],
    },
    outline: {
      level: [2, 3],
      label: '本页目录',
    },
    socialLinks: [],
    search: {
      provider: 'local',
    },
  },
})
