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
          { text: '版本演进', link: '/products/bash/versions' },
          { text: 'Docker 验证', link: '/products/bash/DockerTooling' },
        ] },
      ],
      '/products/zsh/': [
        { text: 'zsh', items: [
          { text: '概览', link: '/products/zsh/' },
          { text: '语法与展开', link: '/products/zsh/syntax' },
          { text: '参数与选项', link: '/products/zsh/args' },
          { text: '常见坑位', link: '/products/zsh/pitfalls' },
          { text: '版本演进', link: '/products/zsh/versions' },
          { text: 'Docker 验证', link: '/products/zsh/DockerTooling' },
        ] },
      ],
      '/products/fish/': [
        { text: 'fish', items: [
          { text: '概览', link: '/products/fish/' },
          { text: '语法与交互', link: '/products/fish/syntax' },
          { text: '参数与选项', link: '/products/fish/args' },
          { text: '常见坑位', link: '/products/fish/pitfalls' },
          { text: '版本演进', link: '/products/fish/versions' },
          { text: 'Docker 验证', link: '/products/fish/DockerTooling' },
        ] },
      ],
      '/products/cmd/': [
        { text: 'cmd', items: [
          { text: '概览', link: '/products/cmd/' },
          { text: '批处理语法', link: '/products/cmd/syntax' },
          { text: '参数与变量', link: '/products/cmd/args' },
          { text: '常见坑位', link: '/products/cmd/pitfalls' },
          { text: '版本演进', link: '/products/cmd/versions' },
          { text: 'Docker 验证', link: '/products/cmd/DockerTooling' },
        ] },
      ],
      '/products/powershell/': [
        { text: 'PowerShell', items: [
          { text: '概览', link: '/products/powershell/' },
          { text: '语法与管道', link: '/products/powershell/syntax' },
          { text: '参数与对象', link: '/products/powershell/args' },
          { text: '常见坑位', link: '/products/powershell/pitfalls' },
          { text: '版本演进', link: '/products/powershell/versions' },
          { text: 'Docker 验证', link: '/products/powershell/DockerTooling' },
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
            { text: 'container2wasm', link: '/playground/container2wasm' },
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
