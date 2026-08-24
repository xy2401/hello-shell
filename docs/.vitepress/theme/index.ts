import DefaultTheme from 'vitepress/theme'
import { defineAsyncComponent } from 'vue'
import DockerTooling from './components/DockerTooling.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BrowserBashWorkbench', defineAsyncComponent(() => import('./components/BrowserBashWorkbench.vue')))
    app.component('BrowserBusyboxWorkbench', defineAsyncComponent(() => import('./components/BrowserBusyboxWorkbench.vue')))
    app.component('BrowserWebContainerWorkbench', defineAsyncComponent(() => import('./components/BrowserWebContainerWorkbench.vue')))
    app.component('BrowserPythonWorkbench', defineAsyncComponent(() => import('./components/BrowserPythonWorkbench.vue')))
    app.component('BrowserLinuxWorkbench', defineAsyncComponent(() => import('./components/BrowserLinuxWorkbench.vue')))
    app.component('BrowserContainerWorkbench', defineAsyncComponent(() => import('./components/BrowserContainerWorkbench.vue')))
    app.component('DockerTooling', DockerTooling)
  },
}
