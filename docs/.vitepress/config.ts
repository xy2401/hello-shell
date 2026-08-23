import { defineConfig } from 'vitepress'

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
      { text: '指南', link: '/concepts/getting-started' },
      { text: '基础概念', link: '/concepts/' },
      { text: '对比矩阵', link: '/matrix/' },
      { text: '试验场', link: '/matrix/experiment/' },
      { text: '参考文档', link: '/reference/version-policy' },
    ],
    sidebar: {
      '/concepts/': [
        {
          text: '基础概念',
          items: [
            { text: '指南', link: '/concepts/getting-started' },
            { text: '内核、Shell、GUI：三层概念', link: '/concepts/kernel-shell-gui' },
            { text: 'Shell 基本语义骨架', link: '/concepts/shell-semantics' },
          ],
        },
      ],
      '/products/': [
        {
          text: 'bash',
          items: [
            { text: 'bash 总览', link: '/products/bash/' },
            { text: 'bash 语法', link: '/products/bash/syntax' },
            { text: 'bash 入参', link: '/products/bash/args' },
            { text: 'bash 坑位', link: '/products/bash/pitfalls' },
          ],
        },
        {
          text: 'zsh',
          items: [
            { text: 'zsh 总览', link: '/products/zsh/' },
            { text: 'zsh 语法', link: '/products/zsh/syntax' },
            { text: 'zsh 入参', link: '/products/zsh/args' },
            { text: 'zsh 坑位', link: '/products/zsh/pitfalls' },
          ],
        },
        {
          text: 'fish',
          items: [
            { text: 'fish 总览', link: '/products/fish/' },
            { text: 'fish 语法', link: '/products/fish/syntax' },
            { text: 'fish 入参', link: '/products/fish/args' },
            { text: 'fish 坑位', link: '/products/fish/pitfalls' },
          ],
        },
        {
          text: 'cmd',
          items: [
            { text: 'cmd 总览', link: '/products/cmd/' },
            { text: 'cmd 语法', link: '/products/cmd/syntax' },
            { text: 'cmd 入参', link: '/products/cmd/args' },
            { text: 'cmd 坑位', link: '/products/cmd/pitfalls' },
          ],
        },
        {
          text: 'PowerShell',
          items: [
            { text: 'PowerShell 总览', link: '/products/powershell/' },
            { text: 'PowerShell 语法', link: '/products/powershell/syntax' },
            { text: 'PowerShell 入参', link: '/products/powershell/args' },
            { text: 'PowerShell 坑位', link: '/products/powershell/pitfalls' },
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
