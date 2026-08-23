import { defineConfig } from 'vitepress'

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
  base: process.env.NODE_ENV === 'production' ? '/hello-shell/' : '/',
  cleanUrls: true,
  themeConfig: {
    nav: [
      // 前 5 个 Shell 全部平铺（bash/zsh/fish/cmd/powershell）
      { text: 'Bash', link: '/products/bash/' },
      { text: 'zsh', link: '/products/zsh/' },
      { text: 'fish', link: '/products/fish/' },
      { text: 'cmd', link: '/products/cmd/' },
      { text: 'PowerShell', link: '/products/powershell/' },
      { text: '对比矩阵', link: '/matrix/' },
      { text: '试验场', link: '/matrix/experiment/' },
      { text: '参考文档', link: '/reference/version-policy' },
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
      '/matrix/experiment/': [
        {
          text: '实验手册',
          items: [{ text: '实验总览', link: '/matrix/experiment/' }],
        },
      ],
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'MIT License',
    },
  },
})
