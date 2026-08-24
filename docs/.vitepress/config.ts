import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'

const base = process.env.DOCS_BASE || '/'

function shellSidebar(id: string, name: string) {
  return [
    {
      text: name,
      items: [
        { text: `${name} 总览`, link: `/products/${id}/` },
        { text: `${name} 语法`, link: `/products/${id}/syntax` },
        { text: `${name} 入参`, link: `/products/${id}/args` },
        { text: `${name} 坑位`, link: `/products/${id}/pitfalls` },
        { text: `${name} 版本演进`, link: `/products/${id}/versions` },
        { text: 'Docker 工具', link: `/products/${id}/DockerTooling` },
      ],
    },
  ]
}

export default defineConfig({
  title: 'hello-shell',
  description:
    'Shell 与命令行统一任务矩阵：bash/zsh/fish/cmd/PowerShell 同任务对照与真实输出快照 (Shell & Command Line Task Matrix)',
  lang: 'zh-CN',
  base,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }]],
  vite: {
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
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
      { text: '对比矩阵', link: '/matrix/' },
      { text: '试验场', link: '/playground/' },
      { text: '参考资料', link: '/reference/' },
    ],
    sidebar: {
      '/products/bash/': shellSidebar('bash', 'bash'),
      '/products/zsh/': shellSidebar('zsh', 'zsh'),
      '/products/fish/': shellSidebar('fish', 'fish'),
      '/products/cmd/': shellSidebar('cmd', 'cmd'),
      '/products/powershell/': shellSidebar('powershell', 'PowerShell'),
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
          text: '浏览器工作台',
          items: [
            { text: '工作台总览', link: '/playground/' },
            { text: 'JUST-BASH', link: '/playground/just-bash' },
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
