import { defineConfig } from 'vitepress'

const base = process.env.NODE_ENV === 'production' ? '/hello-shell/' : '/'

function shellSidebar(id: string, name: string) {
  return [
    {
      text: name,
      items: [
        { text: `${name} 总览`, link: `/products/${id}/` },
        { text: `${name} 语法`, link: `/products/${id}/syntax` },
        { text: `${name} 入参`, link: `/products/${id}/args` },
        { text: `${name} 坑位`, link: `/products/${id}/pitfalls` },
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
  cleanUrls: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }]],
  themeConfig: {
    logo: '/logo.svg',
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
          text: '实验手册',
          items: [{ text: '实验总览', link: '/playground/' }],
        },
      ],
      '/matrix/': [
        {
          text: '对比矩阵',
          items: [
            { text: '矩阵总览', link: '/matrix/' },
            { text: '变量与引号', link: '/matrix/quoting-variables' },
            { text: '控制流', link: '/matrix/control-flow' },
            { text: '函数与管道', link: '/matrix/functions-pipes' },
            { text: '错误与信号', link: '/matrix/errors-signals' },
            { text: '入参矩阵', link: '/matrix/args-matrix' },
            { text: '可移植性矩阵', link: '/matrix/portability-matrix' },
            { text: 'Shell vs Python', link: '/matrix/comparison/shell-vs-python' },
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
          ],
        },
      ],
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'MIT License',
    },
  },
})
